import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen } from "storybook/test";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  component: ConfirmDialog,
  args: {
    opened: true,
    title: "Uscire dalla casa?",
    body: "Avrai una nuova casa tutta tua.",
    confirmLabel: "Esci",
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ args, userEvent }) => {
    const dialog = await screen.findByRole("dialog", { name: "Uscire dalla casa?" });
    await expect(dialog).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Esci" }));
    await expect(args.onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalled();
  },
};

export const Confirming: Story = {
  args: { isConfirming: true },
  play: async () => {
    await expect(await screen.findByRole("button", { name: "Annulla" })).toBeDisabled();
  },
};
