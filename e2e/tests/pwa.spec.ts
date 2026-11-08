import { expect, test } from "@playwright/test";

test("the manifest makes the app installable and full screen", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest: unknown = await response.json();

  expect(manifest).toMatchObject({
    id: "/",
    display: "standalone",
    start_url: "/",
    icons: expect.arrayContaining([expect.objectContaining({ purpose: "maskable" })]),
  });
});

test("the service worker shows the offline page when there is no connection", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Sei offline" })).toBeVisible();

  await context.setOffline(false);
  await page.getByRole("link", { name: "Riprova" }).click();

  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();
});

test("the service worker never stores API responses", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();

  const cachedUrls = await page.evaluate(async () => {
    const names = await caches.keys();
    const requests = await Promise.all(
      names.map(async (name) => (await caches.open(name)).keys()),
    );
    return requests.flat().map((request) => new URL(request.url).pathname);
  });

  expect(cachedUrls).toContain("/offline.html");
  expect(cachedUrls.filter((path) => path.startsWith("/api/"))).toEqual([]);
});
