import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";

import { InstallBanner } from "./InstallBanner";

const meta = {
  component: InstallBanner,
  args: { mode: "prompt", onInstall: fn(), onDismiss: fn() },
} satisfies Meta<typeof InstallBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Prompt: Story = {
  play: async ({ canvas, args }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Installa l'app" }));
    await expect(args.onInstall).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Non ora" }));
    await expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

export const Ios: Story = {
  args: { mode: "ios" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Tocca Condividi, poi Aggiungi alla schermata Home."),
    ).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Installa l'app" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Non ora" })).toBeVisible();
  },
};
