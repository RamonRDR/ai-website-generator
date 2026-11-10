import { expect, test } from "@playwright/test";

test("generate, preview, edit, checkpoint and switch device", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Describe your website" })).toBeVisible();
  await page.getByRole("button", { name: "Generate website" }).click();
  await expect(page.getByTitle("Website preview")).toBeVisible();
  await expect(page.getByText("Deterministic demo created.", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Mobile" }).click();
  await expect(page.getByRole("button", { name: "Mobile" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
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

test("editor preserves spaces, temporary invalid drafts and safe committed values", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate website" }).click();

  const heading = page.getByLabel("Heading");
  await heading.fill("");
  await heading.pressSequentially("A creative studio with spaces");
  await expect(heading).toHaveValue("A creative studio with spaces");
  await page.getByLabel("Description").click();
  await expect(page.frameLocator('iframe[title="Website preview"]').locator("#hero h1")).toHaveText(
    "A creative studio with spaces",
  );

  await heading.fill("");
  await page.getByLabel("Description").click();
  await expect(heading).toHaveValue("");
  await expect(page.locator(".error[role=alert]")).toBeVisible();
  await expect(page.frameLocator('iframe[title="Website preview"]').locator("#hero h1")).toHaveText(
    "A creative studio with spaces",
  );

  await heading.fill("Restored valid heading");
  await page.getByLabel("Description").click();
  await expect(page.frameLocator('iframe[title="Website preview"]').locator("#hero h1")).toHaveText(
    "Restored valid heading",
  );

  const buttonLink = page.getByLabel("Button link");
  await buttonLink.fill("");
  await buttonLink.pressSequentially("https://example.com/contact");
  await expect(buttonLink).toHaveValue("https://example.com/contact");
  await heading.click();
  await expect(
    page.frameLocator('iframe[title="Website preview"]').locator("#hero a.button"),
  ).toHaveAttribute("href", "https://example.com/contact");
});

test("regeneration proposals are invalidated by edits and preserve the current theme", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate website" }).click();
  await page.getByLabel("Regenerate selected section").fill("Write a shorter hero section");
  await page.getByRole("button", { name: "Propose change" }).click();
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toBeVisible();

  await page.getByLabel("Website theme").selectOption("forest");
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toHaveCount(0);

  await page.getByRole("button", { name: "Propose change" }).click();
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toBeVisible();
  await page.getByRole("button", { name: "Accept change" }).click();
  await expect(page.getByLabel("Website theme")).toHaveValue("forest");
  await expect(page.getByLabel("Description")).toHaveValue("Write a shorter hero section");
  await expect(page.getByText("Regeneration accepted and versioned.")).toBeVisible();
});

test("a regeneration response is discarded if editing finishes while it is pending", async ({
  page,
}) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/regenerate", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Generate website" }).click();
  await page.getByLabel("Regenerate selected section").fill("Rewrite this section safely");
  await page.getByRole("button", { name: "Propose change" }).click();

  await page.getByLabel("Heading").fill("New heading while request is pending");
  await page.getByLabel("Description").click();
  release();

  await expect(
    page.getByText("The website changed during regeneration. Request a fresh proposal."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Review proposed changes" })).toHaveCount(0);
  await expect(page.getByLabel("Heading")).toHaveValue("New heading while request is pending");
});

test("both generation APIs reject oversized bodies with HTTP 413", async ({ request }) => {
  for (const endpoint of ["/api/generate", "/api/regenerate"]) {
    const response = await request.post(endpoint, {
      data: "x".repeat(endpoint.includes("regenerate") ? 110001 : 8001),
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(413);
    expect(await response.json()).toEqual({ error: "Request too large." });
  }
});
