import { expect, test } from '@playwright/test';
import { testSetup } from '../POM/Hooks/before-each';
import { testTeardown } from '../POM/Hooks/after-each';
import { API } from '../POM/api';

const API_URL = 'https://jsonplaceholder.typicode.com/posts';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

let api: API;
let posts: Post[] = [];

test.describe('API Test', () => {
  // Fetch once — all tests in this describe use the same data
  test.beforeAll(async ({ request }) => {
    const response = await request.get(API_URL);
    expect(response.ok()).toBeTruthy();
    posts = await response.json();
    // Guard: if the API returns empty, every loop test would pass vacuously
    expect(posts.length).toBeGreaterThan(0);
  });

  test.beforeEach(async ({ page }, testInfo) => {
    await testSetup(page, testInfo);
    await page.goto('/apps/fetch/');
    api = new API(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    await testTeardown(page, testInfo);
  });

  test('API returns 100 posts', async () => {
    expect(posts).toHaveLength(100);
  });

  test('UI renders all cards', async () => {
    await expect(api.card).toHaveCount(posts.length);
  });

  test('Card titles match API data', async () => {
    for (let i = 0; i < posts.length; i++) {
      await expect(api.title.nth(i)).toHaveText(posts[i].title);
    }
  });

  test('Card bodies match API data', async () => {
    for (let i = 0; i < posts.length; i++) {
      await expect(api.body.nth(i)).toHaveText(posts[i].body);
    }
  });
});
