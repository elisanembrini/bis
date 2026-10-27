import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { GoogleSignInButton } from "./GoogleSignInButton";

const meta = {
  component: GoogleSignInButton,
} satisfies Meta<typeof GoogleSignInButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = await canvas.findByRole("link", { name: "Accedi con Google" });
    await expect(link).toHaveAttribute("href", "/api/auth/google/authorize");
  },
};

export const WithRedirect: Story = {
  args: { redirect: "/ricette" },
  play: async ({ canvas }) => {
    const link = await canvas.findByRole("link", { name: "Accedi con Google" });
    await expect(link).toHaveAttribute("href", "/api/auth/google/authorize?redirect=%2Fricette");
  },
};

export const WithInvite: Story = {
  args: { inviteToken: "abc-123" },
  play: async ({ canvas }) => {
    const link = await canvas.findByRole("link", { name: "Accedi con Google" });
    await expect(link).toHaveAttribute("href", "/api/auth/google/authorize?invite_token=abc-123");
  },
};
