import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

// Allowed file types for chat attachments
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const chatId = formData.get('chatId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed',
        allowedTypes: ALLOWED_TYPES
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large',
        maxSize: MAX_FILE_SIZE,
        receivedSize: file.size
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 15)
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${randomSuffix}_${originalName}`
    
    // Create upload directory path
    const uploadDir = join(process.cwd(), 'uploads', 'chat', chatId)
    const filePath = join(uploadDir, filename)

    // For development: save to local filesystem
    // In production: this should upload to S3/CloudFlare/etc
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Ensure directory exists
      const fs = require('fs')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      
      await writeFile(filePath, buffer)
      
      console.log('✅ File uploaded successfully:', filename)
      
    } catch (fsError) {
      console.error('❌ Error saving file:', fsError)
      return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
    }

    // Generate file URL (for development - local serving)
    const fileUrl = `/api/chat/files/${chatId}/${filename}`
    
    // File metadata
    const fileMetadata = {
      id: `file_${timestamp}_${randomSuffix}`,
      filename: originalName,
      internalFilename: filename,
      size: file.size,
      type: file.type,
      url: fileUrl,
      chatId: chatId,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString()
    }

    // TODO: In production, save file metadata to database
    // await query('INSERT INTO chat_attachments (id, chat_id, filename, file_type, file_size, file_url, uploaded_by, created_at) VALUES (...)')

    return NextResponse.json({
      success: true,
      file: fileMetadata,
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId,
        uploadMethod: 'local_filesystem' // In production: 's3', 'cloudflare', etc.
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ API: POST /api/chat/upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Get upload limits and allowed types
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      limits: {
        maxFileSize: MAX_FILE_SIZE,
        maxFileSizeMB: Math.round(MAX_FILE_SIZE / (1024 * 1024)),
        allowedTypes: ALLOWED_TYPES
      },
      typeCategories: {
        images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        documents: [
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
      },
      _meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    })

  } catch (error) {
    console.error('❌ API: GET /api/chat/upload error:', error)
    return NextResponse.json({ error: 'Failed to get upload info' }, { status: 500 })
  }
}