import { expect, test } from "@playwright/test";
import { BEFOREACH } from "../POM/Hooks/before-each";
import { AFTEREACH } from "../POM/Hooks/after-each";
import { API } from "../POM/api";
import fs from "fs";
import path, { dirname } from "path";

let api: API; // Declare a variable to hold the API page object
const dirPath = path.join(__dirname, '..', '__snapshots__', 'api'); // Define the directory path for snapshots

// Hook to run before each test
test.beforeEach(async ({ page }, testInfo) => {
  await BEFOREACH(page, testInfo); // Perform setup actions
  await page.goto("/apps/fetch/"); // Navigate to the fetch app
  api = new API(page); // Initialize the API page object
});

// Hook to run after each test
test.afterEach(async ({ page }, testInfo) => {
  await AFTEREACH(page, testInfo); // Perform cleanup actions
});

// Group of tests for API functionality
test.describe("API Test", () => {

  // Test to fetch data from an API and verify it
  test("Fetch Data", async ({ request, page }) => {
    const filePath = path.join(dirPath, 'data.json'); // Define the file path for saving data
    const response = await request.get("https://jsonplaceholder.typicode.com/posts"); // Fetch data from the API
    expect(response.ok()).toBeTruthy(); // Verify the response is successful
    const data = await response.json(); // Parse the response JSON
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // Save the data to a file
    expect(data.length).toBe(100); // Verify the data contains 100 items
    const count = await api.card.count(); // Count the number of cards on the page
    expect(count).toBe(100); // Verify the number of cards matches the data length
  });

  // Test to verify the titles of the cards
  test("Check Card Titles", async () => {
    const json = fs.readFileSync(path.join(dirPath, 'data.json'), 'utf-8'); // Read the saved data file
    const data = JSON.parse(json); // Parse the JSON data
    const titles = data.map((item: { title: string }) => item.title); // Extract titles from the data
    for (let i = 0; i < titles.length; i++) {
      await expect(api.title.nth(i)).toHaveText(titles[i]); // Verify each card title matches the data
    }
  });

  // Test to verify the bodies of the cards
  test("Check Card Bodies", async () => {
    const json = fs.readFileSync(path.join(dirPath, 'data.json'), 'utf-8'); // Read the saved data file
    const data = JSON.parse(json); // Parse the JSON data
    const bodies = data.map((item: { body: string }) => item.body); // Extract bodies from the data
    for (let i = 0; i < bodies.length; i++) {
      await expect(api.body.nth(i)).toHaveText(bodies[i]); // Verify each card body matches the data
    }
  });
});