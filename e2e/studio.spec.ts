import { expect, test } from "@playwright/test";

test("generate, preview, edit, checkpoint and switch device", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Describe your website" })).toBeVisible();
  await page.getByRole("button", { name: "Generate website" }).click();
  await expect(page.getByTitle("Website preview")).toBeVisible();
  await expect(page.getByText("Deterministic demo created.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Heading").fill("A fresh creative studio");
  await expect(page.getByLabel("Heading")).toHaveValue("A fresh creative studio");
  await page.getByRole("button", { name: "Save version" }).click();
  await expect(page.getByText("Version saved to this browser.")).toBeVisible();
});

test("regeneration is proposed and explicitly accepted or rejected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate website" }).click();
  await page.getByLabel("Regenerate selected section").fill("Write a more concise description");
  await page.getByRole("button", { name: "Propose change" }).click();
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toBeVisible();
  await page.getByRole("button", { name: "Reject change" }).click();
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toHaveCount(0);
});

test("health endpoint and download behavior", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBeTruthy();
  expect(await health.json()).toMatchObject({ status: "ok" });
  await page.goto("/");
  await page.getByRole("button", { name: "Generate website" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export ZIP" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("website-export.zip");
});
