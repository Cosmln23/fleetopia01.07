#!/usr/bin/env node

/**
 * Trial Reminder Email Cron Job (JavaScript version for Railway)
 * 
 * This script runs daily to send reminder emails to users whose trials are expiring soon.
 * Sends reminders at 3 days and 1 day before expiration.
 * 
 * Usage:
 * - Railway Cron: 0 6 * * * node scripts/trial-reminders.js
 * - Local testing: node scripts/trial-reminders.js
 * 
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 * - POSTMARK_API_KEY: Postmark API key (optional, will mock if not set)
 * - POSTMARK_FROM_EMAIL: Sender email address
 */

const { query } = require('../lib/db')
const { sendTrialReminderEmail } = require('../lib/email')

async function getTrialReminderUsers(daysBefore) {
  try {
    const result = await query('SELECT * FROM get_trial_reminder_users($1)', [daysBefore])
    return result.rows
  } catch (error) {
    console.error(`❌ Error getting users for ${daysBefore}-day reminder:`, error)
    return []
  }
}

async function sendReminderBatch(users, reminderType) {
  console.log(`📧 Sending ${reminderType} reminders to ${users.length} users`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const user of users) {
    try {
      await sendTrialReminderEmail(user, reminderType)
      successCount++
      console.log(`✅ Sent ${reminderType} reminder to ${user.email}`)
    } catch (error) {
      errorCount++
      console.error(`❌ Failed to send ${reminderType} reminder to ${user.email}:`, error)
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`📊 ${reminderType} reminder batch completed:`)
  console.log(`   - Success: ${successCount}`)
  console.log(`   - Errors: ${errorCount}`)
  
  return { successCount, errorCount }
}

async function logReminderActivity(reminderType, successCount, errorCount) {
  try {
    await query(`
      INSERT INTO notifications (user_id, type, title, content, created_at)
      VALUES ($1, $2, $3, $4, NOW())
    `, [
      'system',
      'email_batch',
      `Trial Reminder Batch - ${reminderType}`,
      `Sent ${successCount} emails, ${errorCount} errors`
    ])
  } catch (error) {
    console.error('❌ Error logging reminder activity:', error)
  }
}

async function getTrialStats() {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND trial_expires_at > NOW()) as active_trials,
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND EXTRACT(DAYS FROM (trial_expires_at - NOW())) <= 3 AND trial_expires_at > NOW()) as expiring_soon,
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND EXTRACT(DAYS FROM (trial_expires_at - NOW())) = 3) as three_day_reminders,
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND EXTRACT(DAYS FROM (trial_expires_at - NOW())) = 1) as one_day_reminders
      FROM users
    `)
    
    return stats.rows[0]
  } catch (error) {
    console.error('❌ Error getting trial stats:', error)
    return null
  }
}

async function main() {
  try {
    console.log('🚀 Trial Reminder Email Job Started at', new Date().toISOString())
    
    // Get current stats
    const stats = await getTrialStats()
    if (stats) {
      console.log('📊 Current Trial Statistics:')
      console.log(`   - Active trials: ${stats.active_trials}`)
      console.log(`   - Expiring soon (≤3 days): ${stats.expiring_soon}`)
      console.log(`   - Need 3-day reminder: ${stats.three_day_reminders}`)
      console.log(`   - Need 1-day reminder: ${stats.one_day_reminders}`)
    }
    
    console.log('\n🔄 Processing reminder emails...')
    
    // Send 3-day reminders
    console.log('\n📧 Processing 3-day reminders...')
    const threeDayUsers = await getTrialReminderUsers(3)
    let threeDayResults = { successCount: 0, errorCount: 0 }
    
    if (threeDayUsers.length > 0) {
      threeDayResults = await sendReminderBatch(threeDayUsers, '3-day')
      await logReminderActivity('3-day', threeDayResults.successCount, threeDayResults.errorCount)
    } else {
      console.log('📧 No users need 3-day reminders today')
    }
    
    // Send 1-day reminders
    console.log('\n📧 Processing 1-day reminders...')
    const oneDayUsers = await getTrialReminderUsers(1)
    let oneDayResults = { successCount: 0, errorCount: 0 }
    
    if (oneDayUsers.length > 0) {
      oneDayResults = await sendReminderBatch(oneDayUsers, '1-day')
      await logReminderActivity('1-day', oneDayResults.successCount, oneDayResults.errorCount)
    } else {
      console.log('📧 No users need 1-day reminders today')
    }
    
    // Summary
    const totalSent = threeDayResults.successCount + oneDayResults.successCount
    const totalErrors = threeDayResults.errorCount + oneDayResults.errorCount
    
    console.log('\n✅ Trial reminder job completed successfully')
    console.log('📊 Final Summary:')
    console.log(`   - Total emails sent: ${totalSent}`)
    console.log(`   - Total errors: ${totalErrors}`)
    console.log(`   - 3-day reminders: ${threeDayResults.successCount}`)
    console.log(`   - 1-day reminders: ${oneDayResults.successCount}`)
    
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Trial reminder job failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { getTrialReminderUsers, sendReminderBatch }