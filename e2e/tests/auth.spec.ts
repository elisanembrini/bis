import { expect, test } from "@playwright/test";

const PASSWORD = "una-password-sicura";

test("registration, logout and login", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Nome").fill("Prova");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();

  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();

  await page.getByRole("button", { name: "Esci", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?redirect=/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
});

test("wrong credentials show a generic error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(`nessuno-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("password-sbagliata");
  await page.getByRole("button", { name: "Accedi" }).click();

  await expect(page.getByRole("alert")).toContainText("Email o password non corretti.");
});
