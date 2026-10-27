import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { NOW, finishedTimer, longTimer, runningTimer } from "./fixtures";
import { TimerBar } from "./TimerBar";

const meta = {
  component: TimerBar,
  args: { timers: [], now: NOW, onCancel: fn(), onDismiss: fn() },
} satisfies Meta<typeof TimerBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoTimers: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("region", { name: "Timer" })).toBeNull();
  },
};

export const OneRunning: Story = {
  args: { timers: [runningTimer] },
  play: async ({ args, canvas, userEvent }) => {
    const bar = await canvas.findByRole("region", { name: "Timer" });
    await expect(bar).toHaveTextContent("Passaggio 2");
    await expect(bar).toHaveTextContent("3:41");

    await userEvent.click(canvas.getByRole("button", { name: "Ferma il timer del passaggio 2" }));

    await expect(args.onCancel).toHaveBeenCalledWith("r1:1");
  },
};

export const SeveralRunning: Story = {
  args: { timers: [runningTimer, longTimer] },
  play: async ({ canvas }) => {
    const bar = await canvas.findByRole("region", { name: "Timer" });
    await expect(bar).toHaveTextContent("3:41");
    await expect(bar).toHaveTextContent("43:00");
  },
};

export const Finished: Story = {
  args: { timers: [finishedTimer, runningTimer] },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Timer finito: passaggio 1");
    await expect(canvas.getByText("3:41")).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "OK" }));

    await expect(args.onDismiss).toHaveBeenCalledWith("r1:0");
  },
};
