import { expect, test } from "@playwright/test";

const PASSWORD = "una-password-sicura";

test("the privacy notice is reachable from the sign-in page without an account", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Informativa sulla privacy" }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Informativa sulla privacy" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "I tuoi diritti" })).toBeVisible();
  await expect(page.getByRole("link", { name: "elisanembrinii@gmail.com" })).toBeVisible();
});

test("the privacy notice is linked from the footer when signed in", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Prova");
  await page.getByLabel("Email").fill(`e2e-privacy-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();

  await page.getByRole("link", { name: "Informativa sulla privacy" }).click();

  await expect(page).toHaveURL(/\/privacy$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Informativa sulla privacy" }),
  ).toBeVisible();
});
