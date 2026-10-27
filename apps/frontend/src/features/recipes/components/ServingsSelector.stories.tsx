import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { ServingsSelector } from "./ServingsSelector";

const meta = {
  component: ServingsSelector,
  args: { value: 4, original: 4, onChange: fn() },
} satisfies Meta<typeof ServingsSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("group", { name: "Porzioni" })).toBeVisible();
    await expect(canvas.getByText("4 porzioni")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /Torna a/ })).toBeNull();
  },
};

export const AtMinimum: Story = {
  args: { value: 1, original: 4 },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("button", { name: "Una porzione in meno" }),
    ).toBeDisabled();
    await expect(canvas.getByText("1 porzione")).toBeVisible();
  },
};

export const Changed: Story = {
  args: { value: 6, original: 4 },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Torna a 4 porzioni" }));

    await expect(args.onChange).toHaveBeenCalledWith(4);
  },
};

export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <ServingsSelector
        value={value}
        original={args.original}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Una porzione in più" }));
    await userEvent.click(canvas.getByRole("button", { name: "Una porzione in più" }));

    await expect(canvas.getByText("6 porzioni")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Torna a 4 porzioni" }));
    await expect(canvas.getByText("4 porzioni")).toBeVisible();
  },
};
