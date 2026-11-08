import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { LegalFooter } from "./LegalFooter";

const meta = {
  component: LegalFooter,
} satisfies Meta<typeof LegalFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("link", { name: "Informativa sulla privacy" }),
    ).toHaveAttribute("href", "/privacy");
  },
};
