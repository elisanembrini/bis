import { type Page, expect, test } from "@playwright/test";

const registerNewUser = async (page: Page) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Cuoca");
  await page
    .getByLabel("Email")
    .fill(`import-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("una-password-sicura");
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
};

const mockFeatures = async (page: Page, recipeImport: boolean) => {
  await page.route("**/api/features", (route) =>
    route.fulfill({ json: { recipe_import: recipeImport } }),
  );
};

test("import a recipe from text, review it and save it", async ({ page }) => {
  await mockFeatures(page, true);
  await page.route("**/api/recipes/import", (route) =>
    route.fulfill({
      json: {
        title: "Pasta al pomodoro",
        notes: null,
        prep_minutes: 10,
        cook_minutes: 15,
        servings: 4,
        ingredients: [
          { quantity: "320.000", unit: "g", name: "spaghetti" },
          { quantity: null, unit: null, name: "sale" },
        ],
        steps: [
          { text: "Porta a bollore l'acqua.", timer_seconds: null },
          { text: "Cuoci la pasta.", timer_seconds: 540 },
        ],
      },
    }),
  );
  await registerNewUser(page);

  await page.goto("/recipes/new");
  await page.getByLabel("Testo della ricetta").fill("Pasta al pomodoro: cuoci 320 g di spaghetti.");
  await page.getByRole("button", { name: "Importa" }).click();

  await expect(page.getByText(/Ricetta importata/)).toBeVisible();
  await expect(page.getByLabel("Titolo")).toHaveValue("Pasta al pomodoro");
  await expect(page.getByLabel("Porzioni")).toHaveValue("4");
  await page.getByLabel("Titolo").fill("Pasta al pomodoro della nonna");
  await page.getByRole("button", { name: "Salva ricetta" }).click();

  await expect(page.getByRole("heading", { name: "Pasta al pomodoro della nonna" })).toBeVisible();
  const ingredients = page.getByRole("list", { name: "Ingredienti" }).getByRole("listitem");
  await expect(ingredients).toHaveText(["spaghetti 320 g", "sale q.b."]);
  const steps = page.getByRole("list", { name: "Passaggi" }).getByRole("listitem");
  await expect(steps).toHaveText([
    "Porta a bollore l'acqua.",
    /Cuoci la pasta\.\s*Timer: 9 min/,
  ]);
});

test("an import that finds no recipe shows a clear message", async ({ page }) => {
  await mockFeatures(page, true);
  await page.route("**/api/recipes/import", (route) =>
    route.fulfill({
      status: 422,
      json: { code: "IMPORT_NO_RECIPE", message: "No recipe was found in this content." },
    }),
  );
  await registerNewUser(page);

  await page.goto("/recipes/new");
  await page.getByLabel("Testo della ricetta").fill("Ciao a tutti!");
  await page.getByRole("button", { name: "Importa" }).click();

  await expect(
    page.getByText("In questo contenuto non è stata trovata nessuna ricetta."),
  ).toBeVisible();
  await expect(page.getByLabel("Titolo")).toHaveValue("");
});

test("the import form is hidden when the feature is not available", async ({ page }) => {
  await mockFeatures(page, false);
  await registerNewUser(page);

  await page.goto("/recipes/new");

  await expect(page.getByRole("heading", { name: "Nuova ricetta" })).toBeVisible();
  await expect(page.getByLabel("Testo della ricetta")).toHaveCount(0);
});
