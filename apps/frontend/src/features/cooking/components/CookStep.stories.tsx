import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { dishImage } from "../../../components/storyImages";
import { CookStep } from "./CookStep";

const meta = {
  component: CookStep,
  args: {
    number: 2,
    total: 5,
    text: "Monta le uova con lo zucchero finché il composto è chiaro e spumoso.",
    timerSeconds: null,
    timerState: "none",
    onStartTimer: fn(),
  },
} satisfies Meta<typeof CookStep>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText(
        "Monta le uova con lo zucchero finché il composto è chiaro e spumoso.",
      ),
    ).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /Avvia timer/ })).toBeNull();
    await expect(canvas.queryByRole("img")).toBeNull();
  },
};

export const WithPhoto: Story = {
  args: { photoSrc: dishImage },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("img", { name: "Foto del passaggio 2" })).toBeVisible();
  },
};

export const WithTimerToStart: Story = {
  args: { timerSeconds: 300, timerState: "ready" },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Avvia timer · 5:00" }));

    await expect(args.onStartTimer).toHaveBeenCalledOnce();
  },
};

export const TimerAlreadyRunning: Story = {
  args: { timerSeconds: 300, timerState: "running" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Timer in corso" })).toBeDisabled();
  },
};

export const LongTimer: Story = {
  args: { timerSeconds: 4500, timerState: "ready" },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("button", { name: "Avvia timer · 1:15:00" }),
    ).toBeVisible();
  },
};
