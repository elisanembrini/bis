import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { CookNavigation } from "./CookNavigation";

const meta = {
  component: CookNavigation,
  args: {
    isFirst: false,
    isLast: false,
    onPrevious: fn(),
    onNext: fn(),
    onFinish: fn(),
  },
} satisfies Meta<typeof CookNavigation>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MiddleStep: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const next = await canvas.findByRole("button", { name: "Avanti" });
    await expect(next.getBoundingClientRect().height).toBeGreaterThanOrEqual(64);
    await userEvent.click(next);
    await userEvent.click(canvas.getByRole("button", { name: "Indietro" }));

    await expect(args.onNext).toHaveBeenCalledOnce();
    await expect(args.onPrevious).toHaveBeenCalledOnce();
  },
};

export const FirstStep: Story = {
  args: { isFirst: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Indietro" })).toBeDisabled();
  },
};

export const LastStep: Story = {
  args: { isLast: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.queryByRole("button", { name: "Avanti" })).toBeNull();

    await userEvent.click(await canvas.findByRole("button", { name: "Fine" }));

    await expect(args.onFinish).toHaveBeenCalledOnce();
  },
};
