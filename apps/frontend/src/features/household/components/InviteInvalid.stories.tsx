import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { InviteInvalid } from "./InviteInvalid";

const meta = {
  component: InviteInvalid,
  args: { code: "INVITE_EXPIRED" },
} satisfies Meta<typeof InviteInvalid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Expired: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Questo invito è scaduto.");
  },
};

export const Used: Story = {
  args: { code: "INVITE_USED" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Questo invito è già stato usato.",
    );
  },
};

export const NotFound: Story = {
  args: { code: "INVITE_NOT_FOUND" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Questo invito non esiste.");
  },
};
