import { expect, test } from "@playwright/test";

test("shows that the backend is up", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Stato del servizio" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Il servizio è attivo");
});
