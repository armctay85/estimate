const { test, expect } = require('@playwright/test');

test.describe('EstiMate Frontend Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
  });

  test('Dashboard loads correctly', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-grid', { timeout: 10000 });
    
    // Check that main dashboard cards are present
    await expect(page.locator('text=Quick Floor Plan Sketch')).toBeVisible();
    await expect(page.locator('text=Professional QS Tools')).toBeVisible();
    await expect(page.locator('text=BIM Auto-Takeoff')).toBeVisible();
    await expect(page.locator('text=AI Cost Predictor')).toBeVisible();
    await expect(page.locator('text=Photo-to-Renovation')).toBeVisible();
    await expect(page.locator('text=Upload Plans')).toBeVisible();
  });

  test('3D Wireframe Processor opens', async ({ page }) => {
    // Click on 3D Wireframe Processor card
    await page.click('[data-testid="3d-wireframe-btn"]');
    
    // Wait for 3D viewer to load
    await page.waitForSelector('.simple-3d-viewer', { timeout: 5000 });
    
    // Check that 3D elements are visible
    await expect(page.locator('text=Building')).toBeVisible();
    await expect(page.locator('text=Total Cost:')).toBeVisible();
  });

  test('AI Cost Predictor modal works', async ({ page }) => {
    // Click on AI Cost Predictor card
    await page.click('[data-testid="ai-predictor-btn"]');
    
    // Wait for modal to open
    await page.waitForSelector('.cost-predictor-modal', { timeout: 3000 });
    
    // Fill out the form
    await page.selectOption('select[name="projectType"]', 'residential');
    await page.fill('input[name="area"]', '150');
    await page.selectOption('select[name="location"]', 'melbourne');
    await page.selectOption('select[name="complexity"]', 'medium');
    
    // Submit form
    await page.click('button:has-text("Get AI Prediction")');
    
    // Check for prediction results
    await expect(page.locator('text=Powered by X AI')).toBeVisible({ timeout: 5000 });
  });

  test('Quick Floor Plan Sketch workspace', async ({ page }) => {
    // Click on Quick Floor Plan Sketch
    await page.click('[data-testid="quick-sketch-btn"]');
    
    // Wait for workspace to load
    await page.waitForSelector('.canvas-container', { timeout: 5000 });
    
    // Check workspace elements
    await expect(page.locator('.material-selector')).toBeVisible();
    await expect(page.locator('.drawing-tools')).toBeVisible();
    await expect(page.locator('.cost-display')).toBeVisible();
  });

  test('Navigation to Projects page', async ({ page }) => {
    // Click on Recent Projects card
    await page.click('[data-testid="recent-projects-btn"]');
    
    // Should navigate to projects page
    await page.waitForURL('**/projects');
    await expect(page.locator('text=Projects')).toBeVisible();
  });

  test('Photo Renovation Tool loads', async ({ page }) => {
    // Click on Photo Renovation card
    await page.click('[data-testid="photo-renovation-btn"]');
    
    // Wait for photo renovation modal
    await page.waitForSelector('.photo-renovation-modal', { timeout: 3000 });
    
    // Check upload area is visible
    await expect(page.locator('text=Upload photo')).toBeVisible();
  });

  test('BIM Auto-Takeoff processor', async ({ page }) => {
    // Click on BIM Auto-Takeoff card
    await page.click('[data-testid="bim-processor-btn"]');
    
    // Wait for BIM processor modal
    await page.waitForSelector('.bim-processor-modal', { timeout: 3000 });
    
    // Check file upload area
    await expect(page.locator('text=Drag & drop your BIM files')).toBeVisible();
  });

  test('Upload Plans functionality', async ({ page }) => {
    // Click on Upload Plans card
    await page.click('[data-testid="upload-plans-btn"]');
    
    // Wait for upload dialog
    await page.waitForSelector('.upload-plans-modal', { timeout: 3000 });
    
    // Check upload instructions
    await expect(page.locator('text=Select floor plan files')).toBeVisible();
  });

  test('Service status indicator', async ({ page }) => {
    // Check if service status is displayed
    await expect(page.locator('.service-status')).toBeVisible();
    
    // Should show services are running
    await expect(page.locator('text=X AI: Active')).toBeVisible();
    await expect(page.locator('text=Forge: Active')).toBeVisible();
  });

  test('Responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Dashboard should still be accessible
    await expect(page.locator('.dashboard-grid')).toBeVisible();
    
    // Cards should stack vertically on mobile
    const cards = page.locator('.dashboard-card');
    await expect(cards).toHaveCount(9); // Should have all 9 dashboard cards
  });
});