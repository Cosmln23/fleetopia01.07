import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { clerkClient } from '@clerk/nextjs/server'

// Admin-only endpoint - check admin role
async function checkAdminRole(req: NextRequest) {
  const { userId, sessionClaims } = await auth()
  
  if (!userId) {
    return { error: 'Unauthorized', status: 401 }
  }

  const role = sessionClaims?.publicMetadata?.role
  if (role !== 'admin') {
    return { error: 'Forbidden - Admin access required', status: 403 }
  }

  return { userId, role }
}

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await checkAdminRole(req)
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get verification requests with user info
    const result = await query(`
      SELECT 
        vr.*,
        u.name as user_name,
        u.email as user_email,
        u.company as user_company,
        u.phone as user_phone
      FROM verification_requests vr
      JOIN users u ON vr.user_id = u.clerk_id
      WHERE vr.status = $1
      ORDER BY vr.submitted_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset])

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM verification_requests WHERE status = $1',
      [status]
    )

    const total = parseInt(countResult.rows[0].total)

    return NextResponse.json({
      requests: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        userCompany: row.user_company,
        userPhone: row.user_phone,
        documents: row.documents_uploaded,
        status: row.status,
        submittedAt: row.submitted_at,
        processedAt: row.processed_at,
        processedBy: row.processed_by,
        rejectionReason: row.rejection_reason
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('❌ Error fetching verification requests:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await checkAdminRole(req)
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
    }

    const { requestId, action, rejectionReason } = await req.json()

    if (!requestId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'Invalid request - requestId and action (approve/reject) required'
      }, { status: 400 })
    }

    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({
        error: 'Rejection reason required when rejecting'
      }, { status: 400 })
    }

    // Get the verification request
    const requestResult = await query(
      'SELECT * FROM verification_requests WHERE id = $1',
      [requestId]
    )

    if (requestResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Verification request not found'
      }, { status: 404 })
    }

    const request = requestResult.rows[0]

    if (request.status !== 'pending') {
      return NextResponse.json({
        error: 'Request already processed'
      }, { status: 409 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    const userVerificationStatus = action === 'approve' ? 'verified' : 'unverified'

    // Update verification request
    await query(`
      UPDATE verification_requests 
      SET status = $1, processed_at = NOW(), processed_by = $2, rejection_reason = $3, updated_at = NOW()
      WHERE id = $4
    `, [newStatus, adminCheck.userId, rejectionReason || null, requestId])

    // Update user status
    await query(`
      UPDATE users 
      SET verification_status = $1, verification_processed_at = NOW(), updated_at = NOW()
      WHERE clerk_id = $2
    `, [userVerificationStatus, request.user_id])

    // Update Clerk metadata
    try {
      await clerkClient.users.updateUserMetadata(request.user_id, {
        publicMetadata: {
          verification_status: userVerificationStatus,
          verification_processed_at: Date.now()
        }
      })
    } catch (clerkError) {
      console.error('⚠️ Error updating Clerk metadata:', clerkError)
      // Don't fail the request if Clerk update fails
    }

    // TODO: Send notification email to user
    console.log(`✅ Verification request ${action}ed:`, {
      requestId,
      userId: request.user_id,
      action,
      processedBy: adminCheck.userId
    })

    return NextResponse.json({
      message: `Verification request ${action}ed successfully`,
      requestId,
      newStatus: userVerificationStatus
    })

  } catch (error) {
    console.error('❌ Error processing verification request:', error)
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 })
  }
}