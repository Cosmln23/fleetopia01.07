#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const checks = []

function addCheck(name, passed, message) {
  const status = passed ? '✅' : '❌'
  console.log(`${status} ${name}${message ? ` - ${message}` : ''}`)
  checks.push({ name, passed, message })
}

function checkFileExists(filePath, name) {
  const exists = fs.existsSync(filePath)
  addCheck(name, exists, exists ? 'Found' : 'Missing')
  return exists
}

function checkEnvironmentFiles() {
  console.log('🔍 Checking Environment Configuration...')
  
  checkFileExists('.env.production', 'Production Environment File')
  checkFileExists('netlify.toml', 'Netlify Configuration')
  checkFileExists('middleware.ts', 'Security Middleware')
}

function checkDatabaseSchema() {
  console.log('\n📊 Checking Database Configuration...')
  
  checkFileExists('database/schema.sql', 'Database Schema')
  checkFileExists('lib/db.ts', 'Database Connection')
}

function checkAPIEndpoints() {
  console.log('\n🔗 Checking API Endpoints...')
  
  const apiDir = 'app/api'
  const requiredEndpoints = [
    'stats/route.ts',
    'cargo/route.ts',
    'quotes/route.ts',
    'vehicles/route.ts',
    'health/route.ts'
  ]
  
  requiredEndpoints.forEach(endpoint => {
    checkFileExists(path.join(apiDir, endpoint), `API: ${endpoint}`)
  })
}

function checkWebSocketImplementation() {
  console.log('\n🔄 Checking WebSocket Implementation...')
  
  checkFileExists('pages/api/socket.ts', 'WebSocket Server')
  checkFileExists('hooks/useWebSocket.ts', 'WebSocket Client Hook')
  checkFileExists('lib/websocket.ts', 'WebSocket Configuration')
}

function checkMonitoring() {
  console.log('\n📈 Checking Monitoring & Logging...')
  
  checkFileExists('lib/logger.ts', 'Logging System')
  checkFileExists('lib/monitoring.ts', 'Monitoring System')
  checkFileExists('sentry.client.config.ts', 'Sentry Client Config')
  checkFileExists('sentry.server.config.ts', 'Sentry Server Config')
}

function checkBuildConfiguration() {
  console.log('\n🏗️ Checking Build Configuration...')
  
  checkFileExists('next.config.js', 'Next.js Configuration')
  checkFileExists('package.json', 'Package Configuration')
  checkFileExists('tsconfig.json', 'TypeScript Configuration')
  
  // Check if build works
  try {
    console.log('Building project...')
    execSync('npm run build', { stdio: 'pipe' })
    addCheck('Build Process', true, 'Build successful')
  } catch (error) {
    addCheck('Build Process', false, 'Build failed')
  }
}

function checkSecurityConfiguration() {
  console.log('\n🔒 Checking Security Configuration...')
  
  const nextConfigContent = fs.readFileSync('next.config.js', 'utf8')
  const hasSecurityHeaders = nextConfigContent.includes('X-Frame-Options') && nextConfigContent.includes('X-Content-Type-Options')
  addCheck('Security Headers', hasSecurityHeaders, 'Security headers configured')
  
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8')
  const hasAuthProtection = middlewareContent.includes('isProtectedRoute') && middlewareContent.includes('auth()')
  addCheck('Authentication Protection', hasAuthProtection, 'Route protection implemented')
}

function checkProductionOptimizations() {
  console.log('\n⚡ Checking Production Optimizations...')
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  
  // Check for production dependencies
  const hasMonitoring = packageJson.dependencies['@sentry/nextjs'] && packageJson.dependencies['winston']
  addCheck('Monitoring Dependencies', hasMonitoring, 'Sentry and Winston installed')
  
  const hasWebSocket = packageJson.dependencies['socket.io'] && packageJson.dependencies['socket.io-client']
  addCheck('WebSocket Dependencies', hasWebSocket, 'Socket.IO installed')
  
  // Check for unnecessary dev dependencies in production
  const devDepsInProd = Object.keys(packageJson.dependencies).filter(dep => 
    dep.includes('dev') || dep.includes('test') || dep.includes('mock')
  )
  addCheck('Clean Dependencies', devDepsInProd.length === 0, 'No dev dependencies in production')
}

function checkMockDataRemoval() {
  console.log('\n🧹 Checking Mock Data Removal...')
  
  const filesToCheck = [
    'lib/communication-data.ts',
    'app/api/stats/route.ts',
    'app/api/cargo/route.ts'
  ]
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8')
      const hasMockData = content.includes('mock') || content.includes('Mock') || content.includes('demo')
      addCheck(`Mock Data Removed: ${file}`, !hasMockData, hasMockData ? 'Still contains mock data' : 'Clean')
    }
  })
}

function generateReport() {
  const passed = checks.filter(c => c.passed).length
  const failed = checks.filter(c => !c.passed).length
  const total = checks.length
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 Deployment Readiness Report')
  console.log('='.repeat(60))
  console.log(`Total Checks: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`)
  
  if (failed > 0) {
    console.log('\n⚠️  Failed Checks:')
    checks.filter(c => !c.passed).forEach(c => {
      console.log(`   - ${c.name}: ${c.message}`)
    })
    
    console.log('\n🔧 Recommended Actions:')
    console.log('   1. Fix all failed checks before deployment')
    console.log('   2. Run production test script')
    console.log('   3. Test on staging environment')
    console.log('   4. Monitor deployment logs')
  }
  
  console.log('\n' + (failed === 0 ? '🎉 All checks passed! Ready for deployment.' : '⚠️  Fix issues before deploying.'))
  
  return failed === 0
}

// Main execution
function main() {
  console.log('🚀 Pre-deployment Readiness Check\n')
  console.log('Checking all systems for production deployment...\n')
  
  checkEnvironmentFiles()
  checkDatabaseSchema()
  checkAPIEndpoints()
  checkWebSocketImplementation()
  checkMonitoring()
  checkBuildConfiguration()
  checkSecurityConfiguration()
  checkProductionOptimizations()
  checkMockDataRemoval()
  
  const ready = generateReport()
  
  process.exit(ready ? 0 : 1)
}

if (require.main === module) {
  main()
}

module.exports = { main }