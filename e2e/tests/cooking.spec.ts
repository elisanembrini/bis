import { type Page, expect, test } from "@playwright/test";

const registerNewUser = async (page: Page) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Cuoca");
  await page
    .getByLabel("Email")
    .fill(`cucina-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("una-password-sicura");
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
};

const createRecipe = async (page: Page) => {
  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill("Uova al tegamino");
  await page.getByLabel("Porzioni").fill("2");
  const ingredient = page.getByRole("group", { name: "Ingrediente 1" });
  await ingredient.getByLabel("Quantità").fill("4");
  await ingredient.getByLabel("Ingrediente").fill("uova");

  const first = page.getByRole("group", { name: "Passaggio 1" });
  await first.getByLabel("Descrizione").fill("Scalda la padella con un filo d'olio.");
  await first.getByLabel("Timer: minuti").fill("1");
  await page.getByRole("button", { name: "Aggiungi passaggio" }).click();
  await page
    .getByRole("group", { name: "Passaggio 2" })
    .getByLabel("Descrizione")
    .fill("Rompi le uova nella padella.");
  await page.getByRole("button", { name: "Aggiungi passaggio" }).click();
  await page
    .getByRole("group", { name: "Passaggio 3" })
    .getByLabel("Descrizione")
    .fill("Servi subito.");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: "Uova al tegamino" })).toBeVisible();
};

test("cook a recipe step by step with a timer", async ({ page }) => {
  await page.clock.install();
  await registerNewUser(page);
  await createRecipe(page);

  await page.getByRole("button", { name: "Una porzione in più" }).click();
  await expect(page.getByText("3 porzioni")).toBeVisible();
  await page.getByRole("link", { name: "Inizia a cucinare" }).click();

  await expect(page).toHaveURL(/\/cook\?step=1&servings=3$/);
  await expect(page.getByText("Scalda la padella con un filo d'olio.")).toBeVisible();
  await expect(page.getByText("Passaggio 1 di 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Indietro" })).toBeDisabled();

  await page.getByRole("button", { name: "Avvia timer · 1:00" }).click();
  const timers = page.getByRole("region", { name: "Timer" });
  await expect(timers).toContainText("Passaggio 1");
  await expect(page.getByRole("button", { name: "Timer in corso" })).toBeDisabled();

  await page.getByRole("button", { name: "Avanti" }).click();
  await expect(page).toHaveURL(/step=2/);
  await expect(page.getByText("Rompi le uova nella padella.")).toBeVisible();
  await expect(timers).toContainText("Passaggio 1");

  await page.getByRole("button", { name: "Ingredienti" }).click();
  await expect(page.getByRole("list", { name: "Ingredienti" })).toContainText("6");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Avanti" }).click();
  await expect(page).toHaveURL(/step=3/);
  await expect(page.getByText("Servi subito.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Avanti" })).toHaveCount(0);

  await page.getByRole("button", { name: "Indietro" }).click();
  await expect(page).toHaveURL(/step=2/);

  await page.clock.fastForward(61_000);
  await expect(page.getByRole("alert").filter({ hasText: "Timer finito: passaggio 1" })).toBeVisible();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(timers).toHaveCount(0);
});

test("leaving the cooking mode with a running timer asks for confirmation", async ({ page }) => {
  await registerNewUser(page);
  await createRecipe(page);
  await page.getByRole("link", { name: "Inizia a cucinare" }).click();
  await page.getByRole("button", { name: "Avvia timer · 1:00" }).click();

  await page.getByRole("button", { name: "Esci" }).click();

  const dialog = page.getByRole("dialog", { name: "Uscire dalla modalità cucina?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Annulla" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/cook/);

  await page.getByRole("button", { name: "Esci" }).click();
  await page
    .getByRole("dialog", { name: "Uscire dalla modalità cucina?" })
    .getByRole("button", { name: "Esci" })
    .click();
  await expect(page.getByRole("heading", { name: "Uova al tegamino" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/cook/);
});

test("without timers the cooking mode can be left directly", async ({ page }) => {
  await registerNewUser(page);
  await createRecipe(page);
  await page.getByRole("link", { name: "Inizia a cucinare" }).click();

  await page.getByRole("button", { name: "Esci" }).click();

  await expect(page.getByRole("heading", { name: "Uova al tegamino" })).toBeVisible();
});
