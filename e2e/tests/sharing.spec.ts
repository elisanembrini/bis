import path from "node:path";

import { type Browser, type Locator, type Page, expect, test } from "@playwright/test";

const PASSWORD = "una-password-sicura";

const uniqueEmail = (name: string) =>
  `${name}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

const newPage = async (browser: Browser, baseURL: string | undefined): Promise<Page> => {
  const context = await browser.newContext({ baseURL });
  return context.newPage();
};

const fillRegistration = async (page: Page, name: string) => {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Email").fill(uniqueEmail(name.toLowerCase()));
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();
};

const expectLoaded = async (image: Locator) => {
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
};

test("a member shares a recipe and the other one makes it their own", async ({
  browser,
  baseURL,
}) => {
  const anna = await newPage(browser, baseURL);
  await anna.goto("/register");
  await fillRegistration(anna, "Anna");
  await expect(anna.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();

  await anna.getByRole("link", { name: "Nuova ricetta" }).click();
  await anna.getByLabel("Titolo").fill("Tiramisù della nonna");
  await anna.getByLabel("Link originale").fill("https://www.example.com/tiramisu");
  const chooser = anna.waitForEvent("filechooser");
  await anna
    .getByRole("group", { name: "Foto del piatto" })
    .getByRole("button", { name: "Aggiungi foto" })
    .click();
  await (await chooser).setFiles(path.join(import.meta.dirname, "..", "fixtures", "piatto.jpg"));
  await expect(
    anna.getByRole("group", { name: "Foto del piatto" }).getByRole("button", { name: "Cambia foto" }),
  ).toBeEnabled();
  await anna.getByRole("group", { name: "Ingrediente 1" }).getByLabel("Ingrediente").fill("savoiardi");
  await anna.getByRole("group", { name: "Passaggio 1" }).getByLabel("Descrizione").fill("Componi a strati.");
  await anna.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(anna.getByRole("heading", { name: "Tiramisù della nonna" })).toBeVisible();
  const recipeUrl = anna.url();

  await anna.getByRole("link", { name: "Casa" }).click();
  await anna.getByRole("button", { name: "Genera un link di invito" }).click();
  const inviteLink = await anna.getByLabel("Link di invito").inputValue();

  const bruno = await newPage(browser, baseURL);
  await bruno.goto(inviteLink);
  await bruno.getByRole("link", { name: "Registrati" }).click();
  await fillRegistration(bruno, "Bruno");
  await expect(bruno).toHaveURL(/\/household$/);

  await anna.goto(recipeUrl);
  await anna.getByRole("button", { name: "Condividi" }).click();
  const dialog = anna.getByRole("dialog", { name: "Condividi «Tiramisù della nonna»" });
  await dialog.getByRole("checkbox", { name: "Bruno" }).check();
  await dialog.getByRole("button", { name: "Salva" }).click();
  await expect(anna.getByText("Condivisa con Bruno")).toBeVisible();

  await bruno.getByRole("link", { name: "Ricette" }).click();
  const sharedWithMe = bruno.getByRole("list", { name: "Condivise con me" });
  await sharedWithMe.getByRole("link", { name: "Tiramisù della nonna" }).click();
  await expect(bruno.getByText("Ricetta di Anna, condivisa con te in sola lettura.")).toBeVisible();
  await expect(bruno.getByRole("link", { name: "Modifica" })).toHaveCount(0);
  await expectLoaded(bruno.getByRole("img", { name: "Foto di Tiramisù della nonna" }));
  await expect(bruno.getByRole("link", { name: "example.com" })).toHaveAttribute(
    "href",
    "https://www.example.com/tiramisu",
  );

  await bruno.getByRole("button", { name: "Fai il bis" }).click();

  await expect(bruno).toHaveURL(/copied=true/);
  const originalId = new URL(recipeUrl).pathname.split("/").at(-1) ?? "";
  const copyId = new URL(bruno.url()).pathname.split("/").at(-1) ?? "";
  expect(copyId).toMatch(/^[0-9a-f-]{36}$/);
  expect(copyId).not.toBe(originalId);
  await expect(bruno.getByText(/Ora la ricetta è nel tuo ricettario/)).toBeVisible();
  await expect(bruno.getByRole("link", { name: "Modifica" })).toBeVisible();
  await expectLoaded(bruno.getByRole("img", { name: "Foto di Tiramisù della nonna" }));
  await expect(bruno.getByRole("link", { name: "example.com" })).toBeVisible();

  await bruno.getByRole("link", { name: "Ricette" }).click();
  await expect(
    bruno.getByRole("list", { name: "Le mie ricette" }).getByRole("link", { name: "Tiramisù della nonna" }),
  ).toBeVisible();
  await expect(sharedWithMe.getByRole("link", { name: "Tiramisù della nonna" })).toBeVisible();
});
