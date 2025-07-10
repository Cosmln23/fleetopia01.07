import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { z } from 'zod'

// Validation schema for verification documents
const verificationSchema = z.object({
  companyDocument: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string().url()
  }),
  idDocument: z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    url: z.string().url()
  }),
  additionalNotes: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate the request body
    const validation = verificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Invalid data',
        details: validation.error.issues
      }, { status: 400 })
    }

    const verificationData = validation.data

    // Check if user already has a pending verification
    const existingRequest = await query(
      'SELECT * FROM verification_requests WHERE user_id = $1 AND status = $2',
      [userId, 'pending']
    )

    if (existingRequest.rows.length > 0) {
      return NextResponse.json({
        error: 'You already have a pending verification request'
      }, { status: 409 })
    }

    // Create verification request
    const verificationRequest = await query(`
      INSERT INTO verification_requests (
        user_id, documents_uploaded, status, submitted_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [
      userId,
      JSON.stringify(verificationData),
      'pending'
    ])

    // Update user verification status to pending
    await query(`
      UPDATE users 
      SET verification_status = $1, verification_submitted_at = NOW(), updated_at = NOW()
      WHERE clerk_id = $2
    `, ['pending', userId])

    // Update Clerk metadata - this will be handled by the admin approval system
    // No direct user metadata update needed here

    // TODO: Send notification to admin (Slack/email)
    console.log('🔔 New verification request submitted:', {
      userId,
      requestId: verificationRequest.rows[0].id,
      documents: Object.keys(verificationData)
    })

    return NextResponse.json({
      message: 'Verification request submitted successfully',
      requestId: verificationRequest.rows[0].id,
      status: 'pending',
      estimatedProcessingTime: '2-3 business days'
    })

  } catch (error) {
    console.error('❌ Error submitting verification request:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's verification status
    const userResult = await query(
      'SELECT verification_status, verification_submitted_at, verification_processed_at FROM users WHERE clerk_id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({
        error: 'User not found'
      }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Get latest verification request
    const requestResult = await query(
      'SELECT * FROM verification_requests WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1',
      [userId]
    )

    const latestRequest = requestResult.rows[0] || null

    return NextResponse.json({
      status: user.verification_status,
      submittedAt: user.verification_submitted_at,
      processedAt: user.verification_processed_at,
      latestRequest: latestRequest ? {
        id: latestRequest.id,
        status: latestRequest.status,
        submittedAt: latestRequest.submitted_at,
        processedAt: latestRequest.processed_at,
        rejectionReason: latestRequest.rejection_reason
      } : null
    })

  } catch (error) {
    console.error('❌ Error fetching verification status:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}