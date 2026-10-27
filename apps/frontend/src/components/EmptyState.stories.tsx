import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { AnchorLink } from "./AnchorLink";
import { EmptyState } from "./EmptyState";

const meta = {
  component: EmptyState,
  args: { title: "Non hai ancora nessuna ricetta." },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAction: Story = {
  args: { action: <AnchorLink to="/recipes/new">Scrivi la tua prima ricetta</AnchorLink> },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { name: "Non hai ancora nessuna ricetta." }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Scrivi la tua prima ricetta" })).toBeVisible();
  },
};

export const WithDescription: Story = {
  args: {
    title: "Nessuna ricetta trovata.",
    description: "Prova con un'altra parola o togli il filtro.",
  },
};
