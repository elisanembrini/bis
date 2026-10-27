import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { VoiceControl } from "./VoiceControl";

const meta = {
  component: VoiceControl,
  args: { status: "off", onEnable: fn(), onDisable: fn() },
} satisfies Meta<typeof VoiceControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Off: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      await canvas.findByText("Il riconoscimento vocale può usare servizi del browser."),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Attiva i comandi vocali" }));

    await expect(args.onEnable).toHaveBeenCalledOnce();
  },
};

export const Listening: Story = {
  args: { status: "listening" },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("status")).toHaveTextContent("In ascolto");
    await userEvent.click(canvas.getByRole("button", { name: "Disattiva i comandi vocali" }));

    await expect(args.onDisable).toHaveBeenCalledOnce();
  },
};

export const ReadingAloud: Story = {
  args: { status: "paused" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("status")).toHaveTextContent("Sto leggendo il passaggio");
  },
};

export const Unsupported: Story = {
  args: { status: "unsupported" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Questo browser non riconosce i comandi vocali: usa i pulsanti.",
    );
    await expect(canvas.queryByRole("button", { name: /comandi vocali/ })).toBeNull();
  },
};

export const PermissionDenied: Story = {
  args: { status: "denied" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Il microfono non è autorizzato",
    );
  },
};

export const RecognitionError: Story = {
  args: { status: "error" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Il riconoscimento vocale si è interrotto",
    );
  },
};
