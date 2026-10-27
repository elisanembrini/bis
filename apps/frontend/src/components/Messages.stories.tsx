import { Stack } from "@mantine/core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ErrorMessage, InfoMessage, SuccessMessage } from "./Messages";

const meta = {
  component: ErrorMessage,
  args: { title: "Email o password non corretti." },
} satisfies Meta<typeof ErrorMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllKinds: Story = {
  render: () => (
    <Stack>
      <ErrorMessage title="Email o password non corretti." />
      <SuccessMessage title="Password aggiornata." />
      <InfoMessage title="Hai una bozza non salvata." />
    </Stack>
  ),
  play: async ({ canvas }) => {
    const messages = await canvas.findAllByRole("alert");
    await expect(messages).toHaveLength(3);
    await expect(messages.every((message) => message.querySelector("svg") !== null)).toBe(true);
  },
};
