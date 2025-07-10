import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { query } from '@/lib/db'
import { z } from 'zod'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Validation schema for user profile
const userProfileSchema = z.object({
  fullName: z.string().min(2, 'Numele trebuie să conțină minim 2 caractere'),
  phone: z.string().min(10, 'Telefonul trebuie să conțină minim 10 caractere'),
  company: z.string().min(2, 'Numele companiei trebuie să conțină minim 2 caractere'),
  vatNumber: z.string().min(2, 'CUI/VAT trebuie să conțină minim 2 caractere'),
  role: z.enum(['provider', 'carrier'], {
    required_error: 'Rolul este obligatoriu',
  }),
  industry: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Romania'),
  vehicleCount: z.number().optional(),
})

export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate the request body
    const validation = userProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Date invalide',
        details: validation.error.issues
      }, { status: 400 })
    }

    const profileData = validation.data

    // Check if VAT number already exists for another user
    const existingVat = await query(
      'SELECT clerk_id FROM users WHERE vat_number = $1 AND clerk_id != $2',
      [profileData.vatNumber, userId]
    )

    if (existingVat.rows.length > 0) {
      return NextResponse.json({
        error: 'CUI/VAT-ul este deja folosit de altă companie'
      }, { status: 409 })
    }

    // Update or insert user profile
    const result = await query(`
      INSERT INTO users (
        clerk_id, name, phone, company, vat_number, role, 
        industry, address, city, country, vehicle_count,
        profile_completed, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
      ON CONFLICT (clerk_id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        company = EXCLUDED.company,
        vat_number = EXCLUDED.vat_number,
        role = EXCLUDED.role,
        industry = EXCLUDED.industry,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        vehicle_count = EXCLUDED.vehicle_count,
        profile_completed = true,
        updated_at = NOW()
      RETURNING *
    `, [
      userId,
      profileData.fullName,
      profileData.phone,
      profileData.company,
      profileData.vatNumber,
      profileData.role,
      profileData.industry || null,
      profileData.address || null,
      profileData.city || null,
      profileData.country,
      profileData.vehicleCount || null
    ])

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: 'Eroare la salvarea profilului'
      }, { status: 500 })
    }

    const savedProfile = result.rows[0]

    console.log('✅ User profile saved successfully:', {
      userId,
      company: savedProfile.company,
      role: savedProfile.role
    })

    return NextResponse.json({
      message: 'Profilul a fost salvat cu succes',
      profile: {
        id: savedProfile.id,
        name: savedProfile.name,
        phone: savedProfile.phone,
        company: savedProfile.company,
        vatNumber: savedProfile.vat_number,
        role: savedProfile.role,
        industry: savedProfile.industry,
        address: savedProfile.address,
        city: savedProfile.city,
        country: savedProfile.country,
        vehicleCount: savedProfile.vehicle_count,
        profileCompleted: savedProfile.profile_completed,
        createdAt: savedProfile.created_at,
        updatedAt: savedProfile.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Error saving user profile:', error)
    return NextResponse.json({
      error: 'Eroare internă la salvarea profilului'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from database
    const result = await query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({
        error: 'Profilul nu a fost găsit'
      }, { status: 404 })
    }

    const profile = result.rows[0]

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        company: profile.company,
        vatNumber: profile.vat_number,
        role: profile.role,
        industry: profile.industry,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        vehicleCount: profile.vehicle_count,
        profileCompleted: profile.profile_completed,
        trialStarted: profile.trial_started,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Error fetching user profile:', error)
    return NextResponse.json({
      error: 'Eroare la încărcarea profilului'
    }, { status: 500 })
  }
}