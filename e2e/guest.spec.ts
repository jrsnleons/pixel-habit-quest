import { expect, test } from '@playwright/test'

test('guest can start a quest, check in, log sleep, and keep progress after reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try it without an account' }).click()

  await expect(page.getByRole('heading', { name: 'Meet your companion' })).toBeVisible()
  await page.getByRole('button', { name: 'Bunny' }).click()
  await page.getByLabel('Name').fill('Pip')
  await page.getByRole('button', { name: 'Start my quest' }).click()

  await expect(page.getByRole('heading', { name: 'Pip' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'HP' })).toHaveAttribute('aria-valuenow', '75')

  const water = page.locator('.habit', { hasText: 'Drink enough water' })
  await water.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('progressbar', { name: 'HP' })).toHaveAttribute('aria-valuenow', '80')

  await page.getByRole('button', { name: 'Log sleep' }).click()
  await expect(page.getByText('Goal met!')).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'HP' })).toHaveAttribute('aria-valuenow', '88')

  // Undo returns the reward instead of stacking it.
  await water.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByRole('progressbar', { name: 'HP' })).toHaveAttribute('aria-valuenow', '83')
  await water.getByRole('button', { name: 'Done' }).click()

  await page.waitForTimeout(800)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Pip' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'HP' })).toHaveAttribute('aria-valuenow', '88')
  await expect(water.getByRole('button', { name: 'Done' })).toHaveAttribute('aria-pressed', 'true')
})

test('habits can be added with a custom schedule', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Try it without an account' }).click()
  await page.getByRole('button', { name: 'Start my quest' }).click()
  await page.locator('nav:visible').getByRole('button', { name: 'Habits' }).click()
  await page.getByRole('button', { name: 'New habit' }).click()
  await page.getByLabel('Name').fill('Read 10 pages')
  for (const d of ['Sun', 'Mon', 'Sat']) await page.getByRole('button', { name: d, exact: true }).click()
  await page.getByRole('button', { name: 'Save habit' }).click()
  await expect(page.locator('.habit-card', { hasText: 'Read 10 pages' })).toContainText('Tue–Fri')
})
