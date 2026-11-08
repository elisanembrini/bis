import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { RecipeImportPanel } from "./RecipeImportPanel";

const meta = {
  component: RecipeImportPanel,
  args: { onImport: fn() },
} satisfies Meta<typeof RecipeImportPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Importa" })).toBeDisabled();
  },
};

export const ImportText: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Testo della ricetta"), "Pasta al pomodoro");
    await userEvent.click(canvas.getByRole("button", { name: "Importa" }));
    await expect(args.onImport).toHaveBeenCalledWith({ text: "Pasta al pomodoro" });
  },
};

export const ImportLink: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByText("Link"));
    await userEvent.type(
      await canvas.findByLabelText("Link della ricetta"),
      "https://example.com/ricetta",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Importa" }));
    await expect(args.onImport).toHaveBeenCalledWith({ url: "https://example.com/ricetta" });
  },
};

export const Loading: Story = {
  args: { isLoading: true },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Sto leggendo la ricetta. Può richiedere qualche decina di secondi."),
    ).toBeVisible();
    await expect(canvas.getByLabelText("Testo della ricetta")).toBeDisabled();
  },
};

export const NoRecipeFound: Story = {
  args: { errorCode: "IMPORT_NO_RECIPE" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("In questo contenuto non è stata trovata nessuna ricetta."),
    ).toBeVisible();
  },
};

export const Done: Story = {
  args: { isDone: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(/Ricetta importata/)).toBeVisible();
  },
};
