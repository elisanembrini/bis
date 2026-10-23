import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { HealthStatus } from "./HealthStatus";

const meta = {
  component: HealthStatus,
} satisfies Meta<typeof HealthStatus>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ok: Story = {
  args: { state: "ok" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Il servizio è attivo");
  },
};

export const Loading: Story = {
  args: { state: "loading" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Verifica in corso…");
  },
};

export const Error: Story = {
  args: { state: "error" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveTextContent(
      "Il servizio non è raggiungibile",
    );
  },
};
