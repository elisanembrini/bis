import path from "node:path";

import { type Locator, type Page, expect, test } from "@playwright/test";

const fixture = (name: string) => path.join(import.meta.dirname, "..", "fixtures", name);

const registerNewUser = async (page: Page) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Fotografa");
  await page
    .getByLabel("Email")
    .fill(`foto-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("una-password-sicura");
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
};

const choosePhoto = async (page: Page, field: Locator, file: string) => {
  const chooser = page.waitForEvent("filechooser");
  await field.getByRole("button", { name: "Aggiungi foto" }).click();
  await (await chooser).setFiles(fixture(file));
  await expect(field.getByRole("button", { name: "Cambia foto" })).toBeEnabled();
  await expect(field.getByRole("img")).toHaveAttribute("src", /\/api\/photos\/.+size=thumb/);
};

const expectLoaded = async (image: Locator) => {
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
};

test("create a recipe with a dish photo and a step photo", async ({ page }) => {
  await registerNewUser(page);
  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill("Torta di mele");

  await choosePhoto(page, page.getByRole("group", { name: "Foto del piatto" }), "piatto.jpg");
  await page.getByRole("group", { name: "Ingrediente 1" }).getByLabel("Ingrediente").fill("mele");
  const step = page.getByRole("group", { name: "Passaggio 1" });
  await step.getByLabel("Descrizione").fill("Taglia le mele a fettine.");
  await choosePhoto(page, step.getByRole("group", { name: "Foto del passaggio 1" }), "passaggio.jpg");

  await page.getByRole("button", { name: "Salva ricetta" }).click();

  await expect(page.getByRole("heading", { name: "Torta di mele" })).toBeVisible();
  await expectLoaded(page.getByRole("img", { name: "Foto di Torta di mele" }));
  await expectLoaded(page.getByRole("img", { name: "Foto del passaggio 1" }));

  await page.getByRole("link", { name: "Ricette" }).click();
  const item = page.getByRole("listitem").filter({ hasText: "Torta di mele" });
  await expectLoaded(item.locator("img"));
});
