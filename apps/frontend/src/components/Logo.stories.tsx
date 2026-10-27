import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Logo } from "./Logo";

const meta = {
  component: Logo,
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Header: Story = {
  play: async ({ canvas }) => {
    const logo = await canvas.findByRole("img", { name: "Bis" });
    await expect(logo).toHaveAttribute("src", "/brand/logo.svg");
    await waitFor(() =>
      expect(logo instanceof HTMLImageElement ? logo.naturalWidth : 0).toBeGreaterThan(0),
    );
  },
};

export const Large: Story = {
  args: { width: 128 },
};

export const NeverSmallerThanMinimum: Story = {
  args: { width: 20 },
  play: async ({ canvas }) => {
    const logo = await canvas.findByRole("img", { name: "Bis" });
    await waitFor(() => expect(logo.getBoundingClientRect().width).toBeGreaterThanOrEqual(64));
  },
};
