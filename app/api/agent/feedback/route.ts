import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { z } from 'zod'

// Validation schema for feedback
const feedbackSchema = z.object({
  suggestionId: z.string().min(1, 'Suggestion ID is required'),
  feedbackType: z.enum(['UP', 'DOWN'], {
    errorMap: () => ({ message: 'Feedback type must be UP or DOWN' })
  }),
  notes: z.string().optional()
})

// Get user feedback history
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const suggestionId = searchParams.get('suggestionId')
    
    if (suggestionId) {
      // Get feedback for specific suggestion
      const result = await query(`
        SELECT 
          af.id,
          af.suggestion_id,
          af.feedback_type,
          af.notes,
          af.created_at,
          af.updated_at,
          ags.suggestion_data,
          ags.suggestion_type,
          ags.confidence_score
        FROM agent_feedback af
        LEFT JOIN agent_suggestions ags ON ags.id = af.suggestion_id
        WHERE af.user_id = $1 AND af.suggestion_id = $2
      `, [userId, suggestionId])
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
      }
      
      return NextResponse.json({ feedback: result.rows[0] })
    } else {
      // Get user feedback history
      const result = await query(`
        SELECT * FROM get_user_feedback_history($1, $2)
      `, [userId, limit])
      
      return NextResponse.json({
        feedback: result.rows,
        pagination: {
          limit,
          count: result.rows.length
        },
        _meta: {
          timestamp: new Date().toISOString(),
          userId: userId
        }
      })
    }
    
  } catch (error) {
    console.error('❌ API: GET /api/agent/feedback error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}

// Submit or update feedback
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    
    // Validate request body
    const validation = feedbackSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid data',
        details: validation.error.issues
      }, { status: 400 })
    }
    
    const { suggestionId, feedbackType, notes } = validation.data
    
    // Check if suggestion exists (optional - for better UX)
    const suggestionResult = await query(`
      SELECT id, suggestion_type, confidence_score 
      FROM agent_suggestions 
      WHERE id = $1
    `, [suggestionId])
    
    let suggestionInfo = null
    if (suggestionResult.rows.length > 0) {
      suggestionInfo = suggestionResult.rows[0]
    }
    
    // Record feedback using database function
    const feedbackResult = await query(`
      SELECT * FROM record_agent_feedback($1, $2, $3, $4)
    `, [userId, suggestionId, feedbackType, notes || null])
    
    const feedbackInfo = feedbackResult.rows[0]
    
    // Get updated feedback statistics for this suggestion
    const statsResult = await query(`
      SELECT * FROM get_feedback_stats($1)
    `, [suggestionId])
    
    const stats = statsResult.rows[0]
    
    console.log(`✅ API: Feedback recorded - ${feedbackType} for suggestion ${suggestionId}`)
    
    return NextResponse.json({
      feedback: {
        id: feedbackInfo.feedback_id,
        suggestionId: suggestionId,
        feedbackType: feedbackType,
        notes: notes,
        createdAt: feedbackInfo.created_at,
        isUpdate: feedbackInfo.updated
      },
      suggestion: suggestionInfo,
      stats: {
        totalFeedback: parseInt(stats.total_feedback),
        positiveFeedback: parseInt(stats.positive_feedback),
        negativeFeedback: parseInt(stats.negative_feedback),
        positivePercentage: parseFloat(stats.positive_percentage)
      },
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId,
        action: feedbackInfo.updated ? 'updated' : 'created'
      }
    }, { status: feedbackInfo.updated ? 200 : 201 })
    
  } catch (error) {
    console.error('❌ API: POST /api/agent/feedback error:', error)
    
    if (error.message?.includes('foreign key')) {
      return NextResponse.json({ error: 'Invalid suggestion ID' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 })
  }
}

// Delete feedback
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const suggestionId = searchParams.get('suggestionId')
    
    if (!suggestionId) {
      return NextResponse.json({ error: 'Suggestion ID is required' }, { status: 400 })
    }
    
    // Delete feedback
    const result = await query(`
      DELETE FROM agent_feedback 
      WHERE user_id = $1 AND suggestion_id = $2
      RETURNING id
    `, [userId, suggestionId])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }
    
    console.log(`✅ API: Feedback deleted for suggestion ${suggestionId}`)
    
    return NextResponse.json({
      message: 'Feedback deleted successfully',
      suggestionId: suggestionId,
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId,
        action: 'deleted'
      }
    })
    
  } catch (error) {
    console.error('❌ API: DELETE /api/agent/feedback error:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}

// Get feedback statistics
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const suggestionId = searchParams.get('suggestionId')
    
    // Get feedback statistics
    const statsResult = await query(`
      SELECT * FROM get_feedback_stats($1)
    `, [suggestionId || null])
    
    const stats = statsResult.rows[0]
    
    // Get performance by suggestion type
    const performanceResult = await query(`
      SELECT * FROM v_suggestion_performance
      ORDER BY positive_percentage DESC NULLS LAST
      LIMIT 10
    `)
    
    return NextResponse.json({
      stats: {
        totalFeedback: parseInt(stats.total_feedback),
        positiveFeedback: parseInt(stats.positive_feedback),
        negativeFeedback: parseInt(stats.negative_feedback),
        positivePercentage: parseFloat(stats.positive_percentage)
      },
      performance: performanceResult.rows.map(row => ({
        suggestionType: row.suggestion_type,
        totalSuggestions: parseInt(row.total_suggestions),
        suggestionsWithFeedback: parseInt(row.suggestions_with_feedback),
        positiveFeedback: parseInt(row.positive_feedback),
        negativeFeedback: parseInt(row.negative_feedback),
        positivePercentage: row.positive_percentage ? parseFloat(row.positive_percentage) : null,
        avgConfidenceScore: row.avg_confidence_score ? parseFloat(row.avg_confidence_score) : null
      })),
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId,
        scope: suggestionId ? 'suggestion' : 'global'
      }
    })
    
  } catch (error) {
    console.error('❌ API: PATCH /api/agent/feedback error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}