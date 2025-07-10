#!/usr/bin/env node

/**
 * Trial Expiration Cron Job
 * 
 * This script runs daily to expire trial accounts that have exceeded their 7-day limit.
 * 
 * Usage:
 * - Railway Cron: 0 1 * * * node scripts/expire-trials.js
 * - Local testing: tsx scripts/expire-trials.ts
 * 
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 */

import { query } from '../lib/db'

async function expireTrials() {
  console.log('🔄 Starting trial expiration job at', new Date().toISOString())
  
  try {
    // Call the database function to expire trials
    const result = await query('SELECT expire_trials() as expired_count')
    const expiredCount = result.rows[0]?.expired_count || 0
    
    console.log(`✅ Trial expiration completed. Expired ${expiredCount} accounts.`)
    
    // Log summary
    if (expiredCount > 0) {
      console.log(`📊 Summary:`)
      console.log(`   - Accounts expired: ${expiredCount}`)
      console.log(`   - Status changed: TRIAL → DISABLED`)
      console.log(`   - These users will need to upgrade to continue`)
    } else {
      console.log('📊 No trials to expire at this time.')
    }
    
    return expiredCount
    
  } catch (error) {
    console.error('❌ Error during trial expiration:', error)
    throw error
  }
}

async function getTrialStats() {
  try {
    // Get current trial statistics
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'TRIAL') as active_trials,
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND trial_expires_at < NOW()) as expired_trials,
        COUNT(*) FILTER (WHERE status = 'TRIAL' AND trial_expires_at > NOW() AND trial_expires_at < NOW() + INTERVAL '1 day') as expiring_soon,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_users,
        COUNT(*) FILTER (WHERE status = 'DISABLED') as disabled_users
      FROM users
    `)
    
    const {
      active_trials,
      expired_trials,
      expiring_soon,
      active_users,
      disabled_users
    } = stats.rows[0]
    
    console.log('📈 Current User Statistics:')
    console.log(`   - Active trials: ${active_trials}`)
    console.log(`   - Expired trials: ${expired_trials}`)
    console.log(`   - Expiring in 24h: ${expiring_soon}`)
    console.log(`   - Active users: ${active_users}`)
    console.log(`   - Disabled users: ${disabled_users}`)
    
    return stats.rows[0]
    
  } catch (error) {
    console.error('❌ Error getting trial stats:', error)
    return null
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Trial Expiration Cron Job Started')
    
    // Get stats before expiration
    console.log('\n📊 Before expiration:')
    await getTrialStats()
    
    // Expire trials
    console.log('\n🔄 Processing expirations...')
    const expiredCount = await expireTrials()
    
    // Get stats after expiration
    if (expiredCount > 0) {
      console.log('\n📊 After expiration:')
      await getTrialStats()
    }
    
    console.log('\n✅ Trial expiration job completed successfully')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Trial expiration job failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { expireTrials, getTrialStats }