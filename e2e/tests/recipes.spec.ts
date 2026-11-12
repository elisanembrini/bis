import { type Locator, type Page, expect, test } from "@playwright/test";

const registerNewUser = async (page: Page) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Cuoca");
  await page.getByLabel("Email").fill(`ricette-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("una-password-sicura");
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
};

const group = (page: Page, name: string): Locator => page.getByRole("group", { name });

test("create, edit and delete a recipe", async ({ page }) => {
  await registerNewUser(page);
  await expect(page.getByText("Non hai ancora nessuna ricetta.")).toBeVisible();

  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill("Pane di casa");
  await page.getByLabel("Porzioni").fill("6");

  const flour = group(page, "Ingrediente 1");
  await flour.getByLabel("Quantità").fill("1,5");
  await flour.getByLabel("Unità").selectOption("kg");
  await flour.getByLabel("Ingrediente").fill("farina");
  await page.getByRole("button", { name: "Aggiungi ingrediente" }).click();
  await group(page, "Ingrediente 2").getByLabel("Ingrediente").fill("sale");

  await group(page, "Passaggio 1").getByLabel("Descrizione").fill("Inforna.");
  await group(page, "Passaggio 1").getByLabel("Timer: minuti").fill("40");
  await page.getByRole("button", { name: "Aggiungi passaggio" }).click();
  await group(page, "Passaggio 2").getByLabel("Descrizione").fill("Impasta tutto.");
  await group(page, "Passaggio 2").getByRole("button", { name: "Sposta su" }).click();

  await page.getByRole("button", { name: "Salva ricetta" }).click();

  await expect(page.getByRole("heading", { name: "Pane di casa" })).toBeVisible();
  const ingredients = page.getByRole("list", { name: "Ingredienti" }).getByRole("listitem");
  await expect(ingredients).toHaveText(["farina 1,5 kg", "sale q.b."]);
  const steps = page.getByRole("list", { name: "Passaggi" }).getByRole("listitem");
  await expect(steps).toHaveText(["Impasta tutto.", /Inforna\.\s*Timer: 40 min/]);

  await page.getByRole("link", { name: "Modifica" }).click();
  await page.getByLabel("Titolo").fill("Pane della nonna");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: "Pane della nonna" })).toBeVisible();

  await page.getByRole("link", { name: "Ricette" }).click();
  await expect(page.getByRole("link", { name: "Pane della nonna" })).toBeVisible();
  await page.getByRole("link", { name: "Pane della nonna" }).click();

  await page.getByRole("button", { name: "Elimina" }).click();
  const dialog = page.getByRole("dialog", { name: "Eliminare «Pane della nonna»?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Elimina" }).click();

  await expect(page).toHaveURL(/\/recipes$/);
  await expect(page.getByText("Non hai ancora nessuna ricetta.")).toBeVisible();
});

test("an unsaved draft survives a reload and can be restored", async ({ page }) => {
  await registerNewUser(page);
  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill("Torta in bozza");

  await page.reload();

  await expect(page.getByText(/Hai una bozza non salvata/)).toBeVisible();
  await page.getByRole("button", { name: "Ripristina" }).click();
  await expect(page.getByLabel("Titolo")).toHaveValue("Torta in bozza");
});

test("add, change and remove the link a recipe comes from", async ({ page }) => {
  await registerNewUser(page);
  await page.getByRole("link", { name: "Nuova ricetta" }).click();
  await page.getByLabel("Titolo").fill("Focaccia");
  await group(page, "Ingrediente 1").getByLabel("Ingrediente").fill("farina");
  await group(page, "Passaggio 1").getByLabel("Descrizione").fill("Impasta.");

  await page.getByLabel("Link originale").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByText("Usa un indirizzo che inizi con http:// o https://")).toBeVisible();

  await page.getByLabel("Link originale").fill("https://www.example.com/focaccia");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: "Focaccia" })).toBeVisible();
  await expect(page.getByRole("link", { name: "example.com" })).toHaveAttribute(
    "href",
    "https://www.example.com/focaccia",
  );

  await page.getByRole("link", { name: "Modifica" }).click();
  await expect(page.getByLabel("Link originale")).toHaveValue("https://www.example.com/focaccia");
  await page.getByLabel("Link originale").fill("");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: "Focaccia" })).toBeVisible();
  await expect(page.getByText("Fonte:")).toHaveCount(0);
});

const createRatedRecipe = async (page: Page, title: string, rating: string) => {
  await page.goto("/recipes/new");
  await page.getByLabel("Titolo").fill(title);
  await group(page, "Ingrediente 1").getByLabel("Ingrediente").fill("farina");
  await group(page, "Passaggio 1").getByLabel("Descrizione").fill("Cuoci.");
  if (rating !== "") {
    await page.getByLabel("Voto (da 1 a 10)").selectOption(rating);
  }
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
};

test("rate recipes, then sort and filter the list by rating", async ({ page }) => {
  await registerNewUser(page);
  await createRatedRecipe(page, "Frittata", "6");
  await createRatedRecipe(page, "Lasagne", "9");
  await createRatedRecipe(page, "Insalata", "");
  await expect(page.getByText("Voto: ", { exact: false })).toHaveCount(0);

  await page.goto("/recipes");
  const own = page.getByRole("list", { name: "Le mie ricette" }).getByRole("link");
  await expect(own).toHaveText(["Insalata", "Lasagne", "Frittata"]);
  await expect(page.getByText("Voto 9/10")).toBeVisible();

  await page.getByLabel("Ordina per").selectOption("Voto più alto");
  await expect(own).toHaveText(["Lasagne", "Frittata", "Insalata"]);
  await expect(page).toHaveURL(/sort=rating/);

  await page.getByLabel("Voto minimo").selectOption("8+");
  await expect(own).toHaveText(["Lasagne"]);
  await expect(page).toHaveURL(/minRating=8/);

  await page.reload();
  await expect(own).toHaveText(["Lasagne"]);
  await expect(page.getByLabel("Voto minimo")).toHaveValue("8");
  await expect(page.getByLabel("Ordina per")).toHaveValue("rating");

  await page.getByLabel("Voto minimo").selectOption("10");
  await expect(page.getByText("Nessuna ricetta trovata.")).toBeVisible();

  await page.getByLabel("Voto minimo").selectOption("Tutti");
  await expect(own).toHaveText(["Lasagne", "Frittata", "Insalata"]);

  await page.getByRole("link", { name: "Lasagne" }).click();
  await expect(page.getByText("Voto: 9/10")).toBeVisible();
  await page.getByRole("link", { name: "Modifica" }).click();
  await expect(page.getByLabel("Voto (da 1 a 10)")).toHaveValue("9");
  await page.getByLabel("Voto (da 1 a 10)").selectOption("Nessun voto");
  await page.getByRole("button", { name: "Salva ricetta" }).click();
  await expect(page.getByRole("heading", { name: "Lasagne" })).toBeVisible();
  await expect(page.getByText(/^Voto:/)).toHaveCount(0);
});
