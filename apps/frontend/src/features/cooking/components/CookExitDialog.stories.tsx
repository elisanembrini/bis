import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { CookExitDialog } from "./CookExitDialog";

const meta = {
  component: CookExitDialog,
  args: { opened: true, runningTimers: 1, onCancel: fn(), onConfirm: fn() },
} satisfies Meta<typeof CookExitDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OneTimer: Story = {
  play: async ({ args, userEvent }) => {
    const dialog = await screen.findByRole("dialog", { name: "Uscire dalla modalità cucina?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveTextContent("Hai un timer in corso: uscendo si ferma.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Esci" }));

    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

export const SeveralTimers: Story = {
  args: { runningTimers: 3 },
  play: async ({ args, userEvent }) => {
    const dialog = await screen.findByRole("dialog", { name: "Uscire dalla modalità cucina?" });
    await expect(dialog).toHaveTextContent("Hai 3 timer in corso: uscendo si fermano.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Annulla" }));

    await expect(args.onCancel).toHaveBeenCalled();
  },
};
