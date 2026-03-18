import { expect, test } from '@playwright/test';

test('home page renders primary navigation and hero content', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Automate your tests/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Docs$/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start for Free/i })).toBeVisible();
});

test('docs page shows setup and product tour content', async ({ page }) => {
    await page.goto('/docs');

    await expect(page.getByRole('heading', { name: /Learn the app/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bring up your own instance/i })).toBeVisible();
    await expect(page.getByText(/make dev/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /See how the application is meant to be used/i })).toBeVisible();
});

test('login and signup pages render auth forms', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    await expect(page.getByLabel(/Full name/i)).toBeVisible();
    await expect(page.getByLabel(/^Email$/i)).toBeVisible();
    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
});
