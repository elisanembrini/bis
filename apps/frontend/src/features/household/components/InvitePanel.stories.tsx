import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { InvitePanel } from "./InvitePanel";

const meta = {
  component: InvitePanel,
  args: { onGenerate: fn() },
} satisfies Meta<typeof InvitePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Genera un link di invito" }));

    await expect(args.onGenerate).toHaveBeenCalledOnce();
  },
};

export const Generating: Story = {
  args: { isGenerating: true },
};

export const Generated: Story = {
  args: {
    invite: {
      url: "https://bis.example/invite/abc-123",
      expires_at: "2026-10-30T12:00:00Z",
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Link di invito")).toHaveValue(
      "https://bis.example/invite/abc-123",
    );
    await expect(canvas.getByText("Valido fino al 30 ottobre 2026")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Copia" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Genera un altro link" })).toBeVisible();
  },
};

export const Error: Story = {
  args: { errorCode: "NOT_HOUSEHOLD_OWNER" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Solo chi è titolare della casa può farlo.",
    );
  },
};
