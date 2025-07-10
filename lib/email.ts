/**
 * Email Service with Postmark Integration
 * 
 * This module handles all email sending functionality with fallback to mock emails
 * when Postmark is not configured (for development/testing).
 */

interface TrialUser {
  clerk_id: string
  email: string
  name: string
  trial_expires_at: string
  days_left: number
}

interface EmailTemplate {
  subject: string
  htmlBody: string
  textBody: string
}

// Email templates
const EMAIL_TEMPLATES = {
  'trial-reminder-3d': {
    subject: 'Your Fleetopia trial expires in 3 days',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">⏰ Trial Expiring Soon</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your Fleetopia trial expires in 3 days</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi {{userName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Your 7-day free trial of Fleetopia will expire in <strong>3 days</strong> on {{expirationDate}}.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Don't lose access to:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8; color: #333; padding-left: 20px;">
            <li>🤖 Unlimited Agent AI assistance</li>
            <li>📦 Post and manage cargo listings</li>
            <li>🚛 Send quotes and connect with partners</li>
            <li>📊 Advanced marketplace features</li>
            <li>✅ Verified badge for increased trust</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{upgradeUrl}}" style="background: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              Complete Verification Now
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            Or visit: <a href="{{platformUrl}}" style="color: #4F46E5;">{{platformUrl}}</a>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>© 2025 Fleetopia. All rights reserved.</p>
          <p>Transport Paradise with AI-powered logistics solutions</p>
        </div>
      </div>
    `,
    textBody: `
Hi {{userName}},

Your 7-day free trial of Fleetopia will expire in 3 days on {{expirationDate}}.

Don't lose access to:
• Unlimited Agent AI assistance  
• Post and manage cargo listings
• Send quotes and connect with partners
• Advanced marketplace features
• Verified badge for increased trust

Complete your verification now: {{upgradeUrl}}

Or visit: {{platformUrl}}

© 2025 Fleetopia. All rights reserved.
Transport Paradise with AI-powered logistics solutions
    `
  },
  
  'trial-reminder-1d': {
    subject: '🚨 Your Fleetopia trial expires tomorrow!',
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🚨 Final Notice</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your trial expires tomorrow!</p>
        </div>
        
        <div style="padding: 30px; background: #fef2f2; border: 2px solid #fecaca; border-radius: 10px; margin: 20px 0;">
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi {{userName}},</p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            <strong>URGENT:</strong> Your Fleetopia trial expires <strong>tomorrow</strong> ({{expirationDate}}).
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            After expiration, you'll lose access to all platform features until you complete verification.
          </p>
          
          <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">What happens tomorrow:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li>🔒 Platform access will be restricted</li>
              <li>❌ No more Agent AI assistance</li>
              <li>❌ Cannot send quotes or offers</li>
              <li>📱 Account redirected to upgrade page</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{upgradeUrl}}" style="background: #dc2626; color: white; padding: 18px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
              Upgrade Now - Don't Lose Access!
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center;">
            Takes less than 5 minutes: <a href="{{platformUrl}}" style="color: #dc2626;">{{platformUrl}}</a>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
          <p>© 2025 Fleetopia. All rights reserved.</p>
        </div>
      </div>
    `,
    textBody: `
Hi {{userName}},

URGENT: Your Fleetopia trial expires TOMORROW ({{expirationDate}}).

What happens tomorrow:
• Platform access will be restricted
• No more Agent AI assistance  
• Cannot send quotes or offers
• Account redirected to upgrade page

Don't lose access - upgrade now: {{upgradeUrl}}

Takes less than 5 minutes: {{platformUrl}}

© 2025 Fleetopia. All rights reserved.
    `
  }
}

// Template variable replacement
function processTemplate(template: EmailTemplate, variables: Record<string, string>): EmailTemplate {
  let { subject, htmlBody, textBody } = template
  
  // Replace all {{variable}} patterns
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g')
    subject = subject.replace(pattern, value)
    htmlBody = htmlBody.replace(pattern, value)
    textBody = textBody.replace(pattern, value)
  })
  
  return { subject, htmlBody, textBody }
}

// Postmark email sending
async function sendWithPostmark(to: string, template: EmailTemplate): Promise<void> {
  const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY
  const POSTMARK_FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || 'noreply@fleetopia.co'
  
  if (!POSTMARK_API_KEY) {
    throw new Error('POSTMARK_API_KEY is not configured')
  }
  
  const response = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': POSTMARK_API_KEY,
    },
    body: JSON.stringify({
      From: POSTMARK_FROM_EMAIL,
      To: to,
      Subject: template.subject,
      HtmlBody: template.htmlBody,
      TextBody: template.textBody,
      TrackOpens: true,
      TrackLinks: 'HtmlAndText'
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Postmark API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }
  
  const result = await response.json()
  console.log('📧 Postmark email sent:', { messageId: result.MessageID, to })
}

// Mock email sending (for development)
async function sendMockEmail(to: string, template: EmailTemplate): Promise<void> {
  console.log('📧 [MOCK EMAIL] Would send email:')
  console.log(`   To: ${to}`)
  console.log(`   Subject: ${template.subject}`)
  console.log(`   Preview: ${template.textBody.substring(0, 100)}...`)
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200))
}

// Main email sending function
export async function sendTrialReminderEmail(
  user: TrialUser, 
  reminderType: '3-day' | '1-day'
): Promise<void> {
  const templateKey = `trial-reminder-${reminderType.charAt(0)}d` as keyof typeof EMAIL_TEMPLATES
  const template = EMAIL_TEMPLATES[templateKey]
  
  if (!template) {
    throw new Error(`Email template not found: ${templateKey}`)
  }
  
  // Format expiration date
  const expirationDate = new Date(user.trial_expires_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Template variables
  const variables = {
    userName: user.name || 'there',
    userEmail: user.email,
    expirationDate,
    daysLeft: user.days_left.toString(),
    upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://fleetopia.co'}/settings/verification`,
    platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://fleetopia.co'
  }
  
  // Process template with variables
  const processedTemplate = processTemplate(template, variables)
  
  // Send email (with fallback to mock)
  if (process.env.POSTMARK_API_KEY) {
    await sendWithPostmark(user.email, processedTemplate)
  } else {
    console.log('⚠️  POSTMARK_API_KEY not configured, using mock email')
    await sendMockEmail(user.email, processedTemplate)
  }
}

// General email sending function
export async function sendEmail(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<void> {
  const template: EmailTemplate = {
    subject,
    htmlBody,
    textBody: textBody || htmlBody.replace(/<[^>]*>/g, '') // Strip HTML for text version
  }
  
  if (process.env.POSTMARK_API_KEY) {
    await sendWithPostmark(to, template)
  } else {
    console.log('⚠️  POSTMARK_API_KEY not configured, using mock email')
    await sendMockEmail(to, template)
  }
}

// Export templates for testing
export { EMAIL_TEMPLATES }