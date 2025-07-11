import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { stat } from 'fs/promises'

export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string; filename: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, filename } = params
    
    // Validate parameters
    if (!chatId || !filename) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Construct file path
    const filePath = join(process.cwd(), 'uploads', 'chat', chatId, filename)
    
    try {
      // Check if file exists and get stats
      const fileStats = await stat(filePath)
      
      if (!fileStats.isFile()) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      // Read file
      const fileBuffer = await readFile(filePath)
      
      // Determine content type based on file extension
      const getContentType = (filename: string): string => {
        const ext = filename.toLowerCase().split('.').pop()
        
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg'
          case 'png':
            return 'image/png'
          case 'gif':
            return 'image/gif'
          case 'webp':
            return 'image/webp'
          case 'pdf':
            return 'application/pdf'
          case 'txt':
            return 'text/plain'
          case 'doc':
            return 'application/msword'
          case 'docx':
            return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          case 'xls':
            return 'application/vnd.ms-excel'
          case 'xlsx':
            return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          default:
            return 'application/octet-stream'
        }
      }

      const contentType = getContentType(filename)
      
      // Security headers
      const headers = new Headers({
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'private, max-age=3600',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      })

      // For images, allow inline display
      if (contentType.startsWith('image/')) {
        headers.set('Content-Disposition', `inline; filename="${filename}"`)
      } else {
        // For documents, force download
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
      }

      console.log(`✅ File served: ${filename} (${fileStats.size} bytes)`)
      
      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      })

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      
      console.error('❌ Error reading file:', fileError)
      return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ API: GET /api/chat/files error:', error)
    return NextResponse.json({ error: 'File access failed' }, { status: 500 })
  }
}

// Delete file
export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string; filename: string } }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, filename } = params
    
    // Validate parameters
    if (!chatId || !filename) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // TODO: Check if user has permission to delete this file
    // - Check if user is participant in the chat
    // - Check if user uploaded the file
    
    const filePath = join(process.cwd(), 'uploads', 'chat', chatId, filename)
    
    try {
      const fs = require('fs').promises
      await fs.unlink(filePath)
      
      console.log(`✅ File deleted: ${filename}`)
      
      return NextResponse.json({
        success: true,
        message: 'File deleted successfully',
        filename: filename,
        _meta: {
          timestamp: new Date().toISOString(),
          userId: userId,
          action: 'delete'
        }
      })

    } catch (fileError) {
      if (fileError.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      
      console.error('❌ Error deleting file:', fileError)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ API: DELETE /api/chat/files error:', error)
    return NextResponse.json({ error: 'File deletion failed' }, { status: 500 })
  }
}