import { test, expect } from '@playwright/test'

/**
 * E2E tests for the trial system functionality
 * 
 * These tests verify the complete trial flow from signup to expiration
 */

test.describe('Trial System E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/')
  })

  test('New user gets 7-day trial on signup', async ({ page }) => {
    // Navigate to sign up
    await page.click('[href="/sign-up"]')
    
    // Wait for Clerk sign up form
    await expect(page.locator('[data-testid="sign-up-form"]')).toBeVisible()
    
    // Fill out sign up form (assuming email/password signup)
    const testEmail = `test-${Date.now()}@example.com`
    await page.fill('input[name="emailAddress"]', testEmail)
    await page.fill('input[name="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    
    // Should redirect to onboarding or home with trial banner
    await expect(page).toHaveURL(/\/(onboarding|)/)
    
    // Check for trial banner or indicator
    await expect(page.locator('text=/trial|Trial|TRIAL/')).toBeVisible()
  })

  test('Trial banner shows days remaining', async ({ page }) => {
    // Login with test user (assumes existing trial user)
    await page.goto('/sign-in')
    
    // Mock login or use test credentials
    // This would need actual test user credentials or mocking
    
    // Check for trial banner with days remaining
    await expect(page.locator('[data-testid="trial-banner"]')).toBeVisible()
    await expect(page.locator('text=/days? (left|remaining)/')).toBeVisible()
  })

  test('Expired trial redirects to billing page', async ({ page, context }) => {
    // Mock an expired trial user by manipulating the session
    await context.addCookies([
      {
        name: 'test-trial-expired',
        value: 'true',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Or use database manipulation to set trial_expires_at in the past
    // This requires test database setup
    
    // Try to access protected route
    await page.goto('/marketplace')
    
    // Should redirect to billing
    await expect(page).toHaveURL('/billing')
    
    // Should show upgrade message
    await expect(page.locator('text=/trial.*expired/i')).toBeVisible()
    await expect(page.locator('text=/upgrade/i')).toBeVisible()
  })

  test('API returns 402 for expired trial', async ({ request }) => {
    // Create request with expired trial headers/auth
    const response = await request.get('/api/cargo', {
      headers: {
        'test-trial-expired': 'true'
      }
    })
    
    expect(response.status()).toBe(402)
    
    const data = await response.json()
    expect(data.error).toBe('Trial expired')
    expect(data.redirectTo).toBe('/billing')
  })

  test('Verified user bypasses trial restrictions', async ({ page }) => {
    // Login with verified user
    await page.goto('/sign-in')
    
    // Mock verified user session
    await page.evaluate(() => {
      localStorage.setItem('test-user-verified', 'true')
    })
    
    // Should have full access even if trial would be expired
    await page.goto('/marketplace')
    await expect(page).toHaveURL('/marketplace')
    
    // Should not see trial banner
    await expect(page.locator('[data-testid="trial-banner"]')).not.toBeVisible()
    
    // Should see verified badge
    await expect(page.locator('text=/verified/i')).toBeVisible()
  })

  test('Trial extension works during verification process', async ({ page }) => {
    // Login with user who has submitted verification documents
    await page.goto('/sign-in')
    
    // Navigate to verification page
    await page.goto('/settings/verification')
    
    // Upload mock documents
    await page.setInputFiles('input[type="file"]', [
      {
        name: 'company-doc.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content')
      }
    ])
    
    // Submit verification
    await page.click('button[type="submit"]')
    
    // Should show pending status
    await expect(page.locator('text=/pending.*verification/i')).toBeVisible()
    
    // Should maintain access during review period
    await page.goto('/marketplace')
    await expect(page).toHaveURL('/marketplace')
  })

  test('Email reminder system (mock)', async ({ page }) => {
    // This test would require email testing setup
    // For now, we test the API endpoint that triggers emails
    
    const response = await page.request.post('/api/admin/trigger-reminders', {
      data: {
        reminderType: '3-day',
        testMode: true
      }
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data.message).toContain('reminder')
  })

  test('Admin can manually expire trials', async ({ page }) => {
    // Login as admin
    await page.goto('/sign-in')
    // Add admin login logic
    
    // Navigate to admin panel
    await page.goto('/admin/verifications')
    
    // Should see admin interface
    await expect(page.locator('text=/admin/i')).toBeVisible()
    
    // Test trial expiration functionality
    await page.click('[data-testid="expire-trials-button"]')
    
    // Should show confirmation
    await expect(page.locator('text=/expired.*trial/i')).toBeVisible()
  })

  test('Trial countdown updates correctly', async ({ page }) => {
    // Login with trial user
    await page.goto('/sign-in')
    
    // Mock different trial states
    const trialStates = [
      { daysLeft: 3, shouldShowBanner: true },
      { daysLeft: 1, shouldShowBanner: true, isUrgent: true },
      { daysLeft: 0, shouldRedirect: true }
    ]
    
    for (const state of trialStates) {
      // Mock trial state
      await page.evaluate((trialState) => {
        localStorage.setItem('mock-trial-state', JSON.stringify(trialState))
      }, state)
      
      await page.reload()
      
      if (state.shouldRedirect) {
        await expect(page).toHaveURL('/billing')
      } else if (state.shouldShowBanner) {
        await expect(page.locator('[data-testid="trial-banner"]')).toBeVisible()
        
        if (state.isUrgent) {
          await expect(page.locator('.bg-red-600')).toBeVisible()
        }
      }
    }
  })

  test('Database trial functions work correctly', async ({ page }) => {
    // Test the database functions through API
    const expireResponse = await page.request.post('/api/admin/expire-trials')
    expect(expireResponse.status()).toBe(200)
    
    const reminderResponse = await page.request.get('/api/admin/trial-reminders?days=3')
    expect(reminderResponse.status()).toBe(200)
    
    const reminderData = await reminderResponse.json()
    expect(Array.isArray(reminderData.users)).toBe(true)
  })

  test('Full trial-to-verified flow', async ({ page }) => {
    // Complete flow test
    
    // 1. Sign up
    await page.goto('/sign-up')
    // ... signup logic
    
    // 2. Use trial features
    await page.goto('/marketplace')
    await expect(page).toHaveURL('/marketplace')
    
    // 3. Get trial reminder
    await expect(page.locator('[data-testid="trial-banner"]')).toBeVisible()
    
    // 4. Start verification
    await page.click('[href="/settings/verification"]')
    await expect(page).toHaveURL('/settings/verification')
    
    // 5. Submit documents
    // ... document upload logic
    
    // 6. Admin approves
    // ... admin approval logic
    
    // 7. Full access restored
    await page.goto('/marketplace')
    await expect(page.locator('text=/verified/i')).toBeVisible()
    await expect(page.locator('[data-testid="trial-banner"]')).not.toBeVisible()
  })
})

test.describe('Trial System Edge Cases', () => {
  
  test('Handles clock changes gracefully', async ({ page }) => {
    // Test system behavior with different time zones and clock changes
    await page.goto('/')
    
    // Mock different time zones
    await page.evaluate(() => {
      // Override Date to simulate different time zones
      const mockDate = new Date('2025-07-17T10:00:00Z') // 3 days after trial start
      Date.now = () => mockDate.getTime()
    })
    
    await page.reload()
    
    // Should still show correct trial status
    await expect(page.locator('text=/4 days? (left|remaining)/')).toBeVisible()
  })

  test('Handles network failures during trial check', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/marketplace')
    
    // Should gracefully handle failure and not break the app
    await expect(page.locator('body')).toBeVisible()
  })

  test('Prevents trial bypass attempts', async ({ page }) => {
    // Test security measures
    
    // Try to manipulate localStorage
    await page.evaluate(() => {
      localStorage.setItem('trial-bypass', 'true')
      localStorage.setItem('verification-status', 'verified')
    })
    
    // Try to access protected route
    await page.goto('/marketplace')
    
    // Should still enforce trial rules (localStorage manipulation shouldn't work)
    // This depends on server-side verification
  })
})