// Start selector - determines whether to run cron jobs or Next.js server
const { spawn } = require('child_process');

const isCronMode = process.env.CRON_MODE === 'true';

if (isCronMode) {
  console.log('🕐 CRON_MODE detected - running cron jobs');
  // Run cron script
  const cronProcess = spawn('node', ['run-cron.js'], { stdio: 'inherit' });
  
  cronProcess.on('exit', (code) => {
    console.log(`✅ Cron process exited with code ${code}`);
    process.exit(code);
  });
  
} else {
  console.log('🚀 Starting Next.js production server');
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