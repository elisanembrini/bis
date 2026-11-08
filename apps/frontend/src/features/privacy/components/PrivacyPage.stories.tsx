import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { PRIVACY_CONTACT_EMAIL } from "../constants";
import { PrivacyPage } from "./PrivacyPage";

const meta = {
  component: PrivacyPage,
} satisfies Meta<typeof PrivacyPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { level: 1, name: "Informativa sulla privacy" }),
    ).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(8);
    await expect(canvas.getByRole("link", { name: PRIVACY_CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${PRIVACY_CONTACT_EMAIL}`,
    );
  },
};
