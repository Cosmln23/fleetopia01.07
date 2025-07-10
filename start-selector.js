// Start selector - determines whether to run cron jobs or Next.js server
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Auto-detect if this should run as cron or web server
const isCronMode = process.env.CRON_MODE === 'true' || 
                  process.env.RAILWAY_CRON === 'true' ||
                  process.env.IS_CRON === 'true' ||
                  // Auto-detect: if no .next directory exists, assume cron mode
                  !fs.existsSync(path.join(__dirname, '.next')) ||
                  // Auto-detect: if environment suggests cron job
                  process.env.NODE_ENV === 'cron' ||
                  process.argv.includes('--cron');

console.log(`🔍 Environment detection:
  CRON_MODE: ${process.env.CRON_MODE}
  RAILWAY_CRON: ${process.env.RAILWAY_CRON}
  .next exists: ${fs.existsSync(path.join(__dirname, '.next'))}
  NODE_ENV: ${process.env.NODE_ENV}
  Detected mode: ${isCronMode ? 'CRON' : 'WEB'}`);

if (isCronMode) {
  console.log('🕐 CRON MODE detected - running cron jobs');
  // Run cron script
  const cronProcess = spawn('node', ['run-cron.js'], { stdio: 'inherit' });
  
  cronProcess.on('exit', (code) => {
    console.log(`✅ Cron process exited with code ${code}`);
    process.exit(code);
  });
  
} else {
  console.log('🚀 WEB MODE detected - starting Next.js production server');
  // Use pnpm to start Next.js (most reliable)
  const nextProcess = spawn('pnpm', ['start:next'], { stdio: 'inherit', shell: true });
  
  nextProcess.on('error', (err) => {
    console.error('❌ Failed to start with pnpm, trying npm:', err.message);
    // Fallback to npm
    const fallbackProcess = spawn('npm', ['run', 'start:next'], { stdio: 'inherit', shell: true });
    fallbackProcess.on('exit', (code) => {
      process.exit(code);
    });
  });
  
  nextProcess.on('exit', (code) => {
    console.log(`Next.js process exited with code ${code}`);
    process.exit(code);
  });
} 