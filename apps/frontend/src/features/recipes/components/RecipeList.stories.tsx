import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { dishImage } from "../../../components/storyImages";
import { recipeSummaries, sharedSummary, summariesWithThumbnail } from "./fixtures";
import { RecipeList } from "./RecipeList";

const meta = {
  component: RecipeList,
  args: { recipes: recipeSummaries, thumbnailSrc: () => dishImage },
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

export const WithThumbnails: Story = {
  args: { recipes: summariesWithThumbnail },
  play: async ({ canvasElement }) => {
    const images = canvasElement.querySelectorAll("img");
    await expect(images).toHaveLength(1);
    await expect(images[0]).toHaveAttribute("alt", "");
  },
};

export const WithSharedRecipes: Story = {
  args: { recipes: [...recipeSummaries, sharedSummary] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Condivise con me" })).toBeVisible();
    const shared = within(canvas.getByRole("list", { name: "Condivise con me" }));
    await expect(shared.getByRole("link", { name: "Tiramisù di Bruno" })).toBeVisible();
    await expect(shared.getByText("Condivisa")).toBeVisible();
    await expect(shared.getByText(/di Bruno · 4 porzioni/)).toBeVisible();
    const own = within(canvas.getByRole("list", { name: "Le mie ricette" }));
    await expect(own.queryByText("Tiramisù di Bruno")).toBeNull();
  },
};

export const OnlySharedRecipes: Story = {
  args: { recipes: [sharedSummary] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Non hai ancora nessuna ricetta.")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Condivise con me" })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { recipes: [] },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Non hai ancora nessuna ricetta.")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Scrivi la tua prima ricetta" })).toBeVisible();
  },
};

export const NoSearchResults: Story = {
  args: { recipes: [], isFiltered: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Nessuna ricetta trovata.")).toBeVisible();
    await expect(canvas.queryByText("Non hai ancora nessuna ricetta.")).toBeNull();
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
