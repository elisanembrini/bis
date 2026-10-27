import { type Browser, type Page, expect, test } from "@playwright/test";

const PASSWORD = "una-password-sicura";

const uniqueEmail = (name: string) =>
  `${name.toLowerCase()}-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`;

const newPage = async (browser: Browser, baseURL: string | undefined): Promise<Page> => {
  const context = await browser.newContext({ baseURL });
  return context.newPage();
};

const fillRegistration = async (page: Page, name: string, email: string) => {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();
};

const registerOwnerAndCreateInvite = async (page: Page): Promise<string> => {
  await page.goto("/register");
  await fillRegistration(page, "Anna", uniqueEmail("anna"));
  await expect(page.getByRole("heading", { name: "Ciao, Anna!" })).toBeVisible();
  await page.getByRole("link", { name: "Casa" }).click();
  await page.getByRole("button", { name: "Genera un link di invito" }).click();
  return page.getByLabel("Link di invito").inputValue();
};

const expectMembers = async (page: Page, names: string[]) => {
  const items = page.getByRole("listitem");
  await expect(items).toHaveCount(names.length);
  for (const name of names) {
    await expect(items.filter({ hasText: name })).toHaveCount(1);
  }
};

test("a new person joins the household by registering from the invite", async ({
  browser,
  baseURL,
}) => {
  const owner = await newPage(browser, baseURL);
  const inviteLink = await registerOwnerAndCreateInvite(owner);

  const guest = await newPage(browser, baseURL);
  await guest.goto(inviteLink);
  await expect(
    guest.getByRole("heading", { name: "Anna ti invita nella sua casa su Bis" }),
  ).toBeVisible();
  await guest.getByRole("link", { name: "Registrati" }).click();
  await fillRegistration(guest, "Bruno", uniqueEmail("bruno"));

  await expect(guest).toHaveURL(/\/household$/);
  await expectMembers(guest, ["Anna", "Bruno"]);

  await owner.reload();
  await expectMembers(owner, ["Anna", "Bruno"]);
});

test("an existing user signs in from the invite and confirms", async ({ browser, baseURL }) => {
  const owner = await newPage(browser, baseURL);
  const inviteLink = await registerOwnerAndCreateInvite(owner);

  const guest = await newPage(browser, baseURL);
  const carlaEmail = uniqueEmail("carla");
  await guest.goto("/register");
  await fillRegistration(guest, "Carla", carlaEmail);
  await guest.getByRole("button", { name: "Esci", exact: true }).click();
  await expect(guest).toHaveURL(/\/login$/);

  await guest.goto(inviteLink);
  await guest.getByRole("link", { name: "Accedi", exact: true }).click();
  await guest.getByLabel("Email").fill(carlaEmail);
  await guest.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await guest.getByRole("button", { name: "Accedi" }).click();

  await expect(guest.getByText("Entrando lascerai la tua casa attuale")).toBeVisible();
  await guest.getByRole("button", { name: "Entra nella casa" }).click();

  await expect(guest).toHaveURL(/\/household$/);
  await expectMembers(guest, ["Anna", "Carla"]);
  await owner.reload();
  await expectMembers(owner, ["Anna", "Carla"]);
});

test("a used invite cannot be used again", async ({ browser, baseURL }) => {
  const owner = await newPage(browser, baseURL);
  const inviteLink = await registerOwnerAndCreateInvite(owner);
  const first = await newPage(browser, baseURL);
  await first.goto(inviteLink);
  await first.getByRole("link", { name: "Registrati" }).click();
  await fillRegistration(first, "Bruno", uniqueEmail("bruno"));
  await expect(first).toHaveURL(/\/household$/);

  const second = await newPage(browser, baseURL);
  await second.goto(inviteLink);

  await expect(second.getByRole("alert")).toContainText("Questo invito è già stato usato.");
});
