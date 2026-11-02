import { expect, test } from "@playwright/test";

test("the interface is Italian by default and ignores an unsupported stored language", async ({
  page,
}) => {
  await page.addInitScript(() => window.localStorage.setItem("bis:language", "en"));

  await page.goto("/login");

  await expect(page.locator("html")).toHaveAttribute("lang", "it");
  await expect(page.getByRole("heading", { name: "Accedi" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Lingua" })).toHaveCount(0);
});
