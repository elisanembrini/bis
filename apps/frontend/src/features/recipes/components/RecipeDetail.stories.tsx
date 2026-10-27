import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { dishImage, stepImage } from "../../../components/storyImages";
import { minimalRecipe, pastaRecipe, pastaWithPhotos } from "./fixtures";
import { RecipeDetail } from "./RecipeDetail";

const meta = {
  component: RecipeDetail,
  args: { recipe: pastaRecipe, onDelete: fn() },
} satisfies Meta<typeof RecipeDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Per 4 porzioni · Preparazione: 10 min · Cottura: 15 min"),
    ).toBeVisible();
    const ingredients = within(canvas.getByRole("list", { name: "Ingredienti" }));
    const items = ingredients.getAllByRole("listitem").map((item) => item.textContent);
    await expect(items).toEqual([
      "320 g spaghetti",
      "1,5 cucchiai olio extravergine",
      "1 spicchio aglio",
      "q.b. sale",
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
    await expect(await canvas.findByText("Per 1 porzione")).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Note" })).toBeNull();
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
