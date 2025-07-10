import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { clerkClient } from '@clerk/nextjs/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    // Get headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get('svix-id')
    const svix_timestamp = headerPayload.get('svix-timestamp')
    const svix_signature = headerPayload.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error occurred -- no svix headers', {
        status: 400,
      })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

    let evt: any

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Error verifying webhook:', err)
      return new Response('Error occurred', {
        status: 400,
      })
    }

    // Handle the webhook event
    const { id, type, data } = evt

    if (type === 'user.created') {
      const userId = data.id
      const email = data.email_addresses?.[0]?.email_address
      const firstName = data.first_name
      const lastName = data.last_name
      const fullName = `${firstName || ''} ${lastName || ''}`.trim()

      console.log('🔔 User created webhook received:', { userId, email, fullName })

      try {
        // Calculate trial expiration (7 days from now)
        const trialExpiresAt = new Date()
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 7)

        // Set initial metadata in Clerk
        await clerkClient.users.updateUserMetadata(userId, {
          publicMetadata: {
            createdAt: Date.now(),
            profileCompleted: false,
            trialStarted: true,
            trialExpiresAt: trialExpiresAt.getTime(),
            status: 'TRIAL',
            role: null // Will be set during onboarding
          }
        })

        // Save to database with trial setup
        await query(`
          INSERT INTO users (
            clerk_id, email, name, profile_completed, 
            trial_started, status, trial_expires_at, 
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
          ON CONFLICT (clerk_id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            trial_expires_at = EXCLUDED.trial_expires_at,
            status = EXCLUDED.status,
            updated_at = NOW()
        `, [userId, email, fullName, false, true, 'TRIAL', trialExpiresAt])

        console.log('✅ User trial setup completed:', userId)

      } catch (error) {
        console.error('❌ Error setting up user trial:', error)
        // Don't fail the webhook - just log the error
      }
    }

    if (type === 'user.updated') {
      const userId = data.id
      const email = data.email_addresses?.[0]?.email_address
      const firstName = data.first_name
      const lastName = data.last_name
      const fullName = `${firstName || ''} ${lastName || ''}`.trim()

      console.log('🔔 User updated webhook received:', { userId, email, fullName })

      try {
        // Update database
        await query(`
          UPDATE users 
          SET email = $2, name = $3, updated_at = NOW()
          WHERE clerk_id = $1
        `, [userId, email, fullName])

        console.log('✅ User data updated:', userId)

      } catch (error) {
        console.error('❌ Error updating user data:', error)
      }
    }

    if (type === 'user.deleted') {
      const userId = data.id

      console.log('🔔 User deleted webhook received:', { userId })

      try {
        // Soft delete in database
        await query(`
          UPDATE users 
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE clerk_id = $1
        `, [userId])

        console.log('✅ User soft deleted:', userId)

      } catch (error) {
        console.error('❌ Error deleting user:', error)
      }
    }

    return new Response('', { status: 200 })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return new Response('Error occurred', {
      status: 500,
    })
  }
}