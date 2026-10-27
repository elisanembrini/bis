import { type Page, expect, test } from "@playwright/test";

type Ingredient = { quantity: string; unit?: string; name: string };

const registerNewUser = async (page: Page) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Cercatrice");
  await page
    .getByLabel("Email")
    .fill(`cerca-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("una-password-sicura");
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
};

const createRecipe = async (
  page: Page,
  title: string,
  ingredients: Ingredient[],
  tag?: string,
) => {
  await page.getByRole("link", { name: "Ricette" }).click();
  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill(title);
  for (const [index, ingredient] of ingredients.entries()) {
    if (index > 0) {
      await page.getByRole("button", { name: "Aggiungi ingrediente" }).click();
    }
    const row = page.getByRole("group", { name: `Ingrediente ${index + 1}` });
    await row.getByLabel("Quantità").fill(ingredient.quantity);
    if (ingredient.unit !== undefined) {
      await row.getByLabel("Unità").selectOption(ingredient.unit);
    }
    await row.getByLabel("Ingrediente").fill(ingredient.name);
  }
  await page.getByRole("group", { name: "Passaggio 1" }).getByLabel("Descrizione").fill("Cucina.");
  if (tag !== undefined) {
    await page.getByRole("group", { name: "Etichette" }).getByText(tag, { exact: true }).click();
  }
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
};

test("search by ingredient and by name, filter by tag and change servings", async ({ page }) => {
  await registerNewUser(page);
  await createRecipe(
    page,
    "Frittata di zucchine",
    [
      { quantity: "4", name: "uova" },
      { quantity: "300", unit: "g", name: "zucchine" },
    ],
    "Vegetariano",
  );
  await createRecipe(page, "Pasta al pomodoro", [
    { quantity: "320", unit: "g", name: "spaghetti" },
    { quantity: "400", unit: "g", name: "pomodori pelati" },
  ]);
  await page.getByRole("link", { name: "Ricette" }).click();

  const frittata = page.getByRole("link", { name: "Frittata di zucchine" });
  const pasta = page.getByRole("link", { name: "Pasta al pomodoro" });
  const searchBox = page.getByRole("searchbox", { name: "Cerca ricette" });

  await page.getByText("Ingrediente", { exact: true }).click();
  await searchBox.fill("zucchina");
  await expect(page).toHaveURL(/ingredient=zucchina/);
  await expect(frittata).toBeVisible();
  await expect(pasta).toHaveCount(0);

  await page.getByText("Nome", { exact: true }).click();
  await searchBox.fill("pomod");
  await expect(page).toHaveURL(/q=pomod/);
  await expect(pasta).toBeVisible();
  await expect(frittata).toHaveCount(0);

  await searchBox.fill("");
  await expect(frittata).toBeVisible();
  await page
    .getByRole("group", { name: "Filtra per etichetta" })
    .getByText("Vegetariano", { exact: true })
    .click();
  await expect(pasta).toHaveCount(0);
  await expect(frittata).toBeVisible();

  await frittata.click();
  const ingredients = page.getByRole("list", { name: "Ingredienti" }).getByRole("listitem");
  await expect(ingredients).toHaveText(["4 uova", "300 g zucchine"]);
  await page.getByRole("button", { name: "Una porzione in meno" }).click();
  await page.getByRole("button", { name: "Una porzione in meno" }).click();
  await expect(page.getByText("2 porzioni")).toBeVisible();
  await expect(ingredients).toHaveText(["2 uova", "150 g zucchine"]);
});
