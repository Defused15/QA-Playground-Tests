import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { API } from "../POM/api";
import fs from "fs";
import path, { dirname } from "path";
import { title } from "process";
let api: API;
const dirPath = path.join(__dirname, '..', '__snapshots__', 'api');

test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Custom before-each logic
  await page.goto("/apps/fetch/");
  api = new API(page);
});

test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Custom after-each logic
});

test.describe("API Test", () => {
  test("Fetch Data", async ({ request, page }) => {
    const filePath = path.join(dirPath, 'data.json');
    const response = await request.get("https://jsonplaceholder.typicode.com/posts");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    expect(data.length).toBe(100);
    const count = await api.card.count()
    expect(count).toBe(100);
});

test("Check Card Titles", async () => {
    const json = fs.readFileSync(path.join(dirPath, 'data.json'), 'utf-8');
    const data = JSON.parse(json);
    const titles = data.map((item: { title: string }) => item.title);
    for (let i = 0; i < titles.length; i++) {
        await expect(api.title.nth(i)).toHaveText(titles[i]);
        }
});

test("Check Card Bodies", async () => {
    const json = fs.readFileSync(path.join(dirPath, 'data.json'), 'utf-8');
    const data = JSON.parse(json);
    const bodies = data.map((item: { body:string}) => item.body);
    for (let i = 0; i < bodies.length; i++) {
        await expect(api.body.nth(i)).toHaveText(bodies[i]);
    }
});
});