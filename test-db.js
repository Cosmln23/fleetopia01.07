import { query } from './lib/db.js';

async function testDB() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'NOT SET');
  try {
    const result = await query('SELECT NOW()');
    console.log('DB Connection OK:', result.rows[0]);
  } catch (error) {
    console.error('DB Connection Failed:', error.message);
  }
}

testDB(); 