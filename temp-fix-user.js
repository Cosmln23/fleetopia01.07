const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function addCurrentUser() {
  try {
    console.log('🔧 Adding current user to users table...')
    
    // Get your Clerk user ID - you'll need to replace this with your actual Clerk user ID
    const CLERK_USER_ID = 'user_2nGiuQHjOSkzNsS20GPOPzRMHUu' // Replace with your actual Clerk ID
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE clerk_id = $1',
      [CLERK_USER_ID]
    )
    
    if (existingUser.rows.length > 0) {
      console.log('✅ User already exists:', existingUser.rows[0])
      return existingUser.rows[0]
    }
    
    // Create new user
    const result = await pool.query(`
      INSERT INTO users (
        clerk_id, name, email, role, rating, verified, 
        avatar, company, location, last_seen, is_online, created_ts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `, [
      CLERK_USER_ID,
      'Test User', // Replace with your name
      'test@fleetopia.co', // Replace with your email  
      'CARGO_OWNER',
      5.0,
      true,
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      'Test Company',
      'Test Location',
      Date.now(),
      true,
      Date.now()
    ])
    
    console.log('✅ User created successfully:', result.rows[0])
    
    // Update existing cargo to have proper sender_id
    const updateResult = await pool.query(`
      UPDATE cargo 
      SET sender_id = $1 
      WHERE provider_name LIKE '%Test%' OR provider_name = 'Unknown Provider'
      RETURNING id, title, provider_name, sender_id
    `, [CLERK_USER_ID])
    
    console.log('✅ Updated cargo records:', updateResult.rows.length)
    updateResult.rows.forEach(cargo => {
      console.log(`  - ${cargo.title}: ${cargo.provider_name} → sender_id: ${cargo.sender_id}`)
    })
    
    return result.rows[0]
    
  } catch (error) {
    console.error('❌ Error adding user:', error)
    throw error
  } finally {
    await pool.end()
  }
}

// Run the script
addCurrentUser()
  .then(() => {
    console.log('🎉 User setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 