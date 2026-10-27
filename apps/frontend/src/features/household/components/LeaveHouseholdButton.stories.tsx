import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor } from "storybook/test";

import { LeaveHouseholdButton } from "./LeaveHouseholdButton";

const meta = {
  component: LeaveHouseholdButton,
  args: { onLeave: fn() },
} satisfies Meta<typeof LeaveHouseholdButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Esci dalla casa" }));
    const dialog = await screen.findByRole("dialog", { name: "Uscire dalla casa?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(args.onLeave).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Esci" }));

    await expect(args.onLeave).toHaveBeenCalledOnce();
  },
};

export const Leaving: Story = {
  args: { isLeaving: true },
};

export const OwnerCannotLeave: Story = {
  args: { errorCode: "OWNER_CANNOT_LEAVE" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Chi è titolare della casa non può lasciarla.",
    );
  },
};
