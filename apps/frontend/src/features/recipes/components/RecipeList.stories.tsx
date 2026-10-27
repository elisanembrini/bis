import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { recipeSummaries } from "./fixtures";
import { RecipeList } from "./RecipeList";

const meta = {
  component: RecipeList,
  args: { recipes: recipeSummaries },
} satisfies Meta<typeof RecipeList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithRecipes: Story = {
  play: async ({ canvas }) => {
    const links = await canvas.findAllByRole("link", { name: /Pasta|Uovo/ });
    await expect(links.map((link) => link.textContent)).toEqual(["Pasta al pomodoro", "Uovo sodo"]);
    await expect(canvas.getByText("4 porzioni · 25 min")).toBeVisible();
    await expect(canvas.getByText("1 porzione")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { recipes: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Non hai ancora nessuna ricetta.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Scrivi la tua prima ricetta" })).toBeVisible();
  },
};

export const Loading: Story = {
  args: { recipes: undefined, isLoading: true },
};

export const Error: Story = {
  args: { recipes: undefined, errorCode: "UNKNOWN" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Qualcosa è andato storto");
  },
};
