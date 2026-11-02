import { expect, test } from "@playwright/test";

const PASSWORD = "una-password-sicura";

test("a signed-in person can install the app from the banner and the banner then goes away", async ({
  page,
}) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Anna");
  await page
    .getByLabel("Email")
    .fill(`anna-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Installa l'app" })).toHaveCount(0);

  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: () => {
        document.body.dataset["installPrompted"] = "true";
        return Promise.resolve();
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });

  await page.getByRole("button", { name: "Installa l'app" }).click();

  await expect(page.locator("body")).toHaveAttribute("data-install-prompted", "true");
  await expect(page.getByRole("button", { name: "Installa l'app" })).toHaveCount(0);
});

test("dismissing the banner keeps it away after a reload", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Nome").fill("Bruno");
  await page
    .getByLabel("Email")
    .fill(`bruno-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Registrati" }).click();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();

  const fireInstallPrompt = () =>
    page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: () => Promise.resolve(),
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });

  await fireInstallPrompt();
  await page.getByRole("button", { name: "Non ora" }).click();
  await expect(page.getByRole("button", { name: "Installa l'app" })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Le mie ricette" })).toBeVisible();
  await fireInstallPrompt();
  await expect(page.getByRole("button", { name: "Installa l'app" })).toHaveCount(0);
});
