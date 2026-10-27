import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { dishImage, stepImage } from "../../../components/storyImages";
import { minimalRecipe, pastaRecipe, pastaWithPhotos, sharedRecipe } from "./fixtures";
import { RecipeDetail } from "./RecipeDetail";

const meta = {
  component: RecipeDetail,
  args: { recipe: pastaRecipe, onDelete: fn(), onCopy: fn(), onShare: fn() },
} satisfies Meta<typeof RecipeDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Preparazione: 10 min · Cottura: 15 min")).toBeVisible();
    await expect(canvas.getByText("Primi")).toBeVisible();
    const ingredients = within(canvas.getByRole("list", { name: "Ingredienti" }));
    const items = ingredients.getAllByRole("listitem").map((item) => item.textContent);
    await expect(items).toEqual([
      "spaghetti 320 g",
      "olio extravergine 1,5 cucchiai",
      "aglio 1 spicchio",
      "sale q.b.",
    ]);
    await expect(canvas.getByText("Timer: 9 min 30 s")).toBeVisible();
  },
};

export const WithPhotos: Story = {
  args: {
    recipe: pastaWithPhotos,
    photoSrc: (photoId) => (photoId === "cover-photo" ? dishImage : stepImage),
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("img", { name: "Foto di Pasta al pomodoro" }),
    ).toHaveAttribute("src", dishImage);
    await expect(canvas.getByRole("img", { name: "Foto del passaggio 2" })).toHaveAttribute(
      "src",
      stepImage,
    );
  },
};

export const WithoutNotesAndTimes: Story = {
  args: { recipe: minimalRecipe },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("1 porzione")).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Note" })).toBeNull();
  },
};

export const ChangeServings: Story = {
  play: async ({ canvas, userEvent }) => {
    const ingredients = () =>
      within(canvas.getByRole("list", { name: "Ingredienti" }))
        .getAllByRole("listitem")
        .map((item) => item.textContent);

    await userEvent.click(await canvas.findByRole("button", { name: "Una porzione in meno" }));
    await userEvent.click(canvas.getByRole("button", { name: "Una porzione in meno" }));

    await expect(canvas.getByText("2 porzioni")).toBeVisible();
    await expect(ingredients()).toEqual([
      "spaghetti 160 g",
      "olio extravergine 0,75 cucchiai",
      "aglio 0,5 spicchi",
      "sale q.b.",
    ]);

    await userEvent.click(canvas.getByRole("button", { name: "Torna a 4 porzioni" }));

    await expect(ingredients()[0]).toBe("spaghetti 320 g");
    await expect(canvas.queryByRole("button", { name: "Torna a 4 porzioni" })).toBeNull();
  },
};

export const DeleteWithConfirmation: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Elimina" }));
    const dialog = await screen.findByRole("dialog", { name: "Eliminare «Pasta al pomodoro»?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(args.onDelete).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole("button", { name: "Elimina" }));

    await expect(args.onDelete).toHaveBeenCalledOnce();
  },
};

export const Deleting: Story = {
  args: { isDeleting: true },
};

export const DeleteError: Story = {
  args: { errorCode: "RECIPE_NOT_FOUND" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Questa ricetta non esiste o non è tua.",
    );
  },
};

export const OwnerSharedWithOthers: Story = {
  args: { sharedWith: ["Bruno", "Carla"] },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByText("Condivisa con Bruno e Carla")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Condividi" }));

    await expect(args.onShare).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("button", { name: "Fai il bis" })).toBeNull();
  },
};

export const SharedReadOnly: Story = {
  args: { recipe: sharedRecipe },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      await canvas.findByText("Ricetta di Bruno, condivisa con te in sola lettura."),
    ).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Modifica" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Elimina" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Condividi" })).toBeNull();
    await expect(canvas.getByRole("group", { name: "Porzioni" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Fai il bis" }));

    await expect(args.onCopy).toHaveBeenCalledOnce();
  },
};

export const SharedServingsStillWork: Story = {
  args: { recipe: sharedRecipe },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Una porzione in più" }));
    await expect(canvas.getByText("5 porzioni")).toBeVisible();
    const first = within(canvas.getByRole("list", { name: "Ingredienti" })).getAllByRole(
      "listitem",
    )[0];
    await expect(first).toHaveTextContent("spaghetti 400 g");
  },
};

export const Copying: Story = {
  args: { recipe: sharedRecipe, isCopying: true },
};

export const CopyFailed: Story = {
  args: { recipe: sharedRecipe, errorCode: "RECIPE_NOT_FOUND" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Questa ricetta non esiste o non è tua.")).toBeVisible();
  },
};

export const JustCopied: Story = {
  args: { justCopied: true },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Fatto! Ora la ricetta è nel tuo ricettario e puoi modificarla."),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Modifica" })).toBeVisible();
  },
};
