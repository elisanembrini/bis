import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { SearchBar, type SearchMode } from "./SearchBar";

const meta = {
  component: SearchBar,
  args: { value: "", mode: "title", onChange: fn(), onModeChange: fn() },
} satisfies Meta<typeof SearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("searchbox", { name: "Cerca ricette" })).toHaveAttribute(
      "placeholder",
      "Cerca per nome",
    );
  },
};

export const WithText: Story = {
  args: { value: "pomod" },
};

export const IngredientMode: Story = {
  args: { value: "zucchina", mode: "ingredient" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("searchbox")).toHaveAttribute(
      "placeholder",
      "Cerca per ingrediente",
    );
    await expect(canvas.getByRole("radio", { name: "Ingrediente" })).toBeChecked();
  },
};

export const TypingAndSwitchingMode: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    const [mode, setMode] = useState<SearchMode>(args.mode);
    return (
      <SearchBar
        value={value}
        mode={mode}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
        onModeChange={(next) => {
          setMode(next);
          args.onModeChange(next);
        }}
      />
    );
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByRole("searchbox"), "zucch");
    await expect(args.onChange).toHaveBeenLastCalledWith("zucch");

    await userEvent.click(canvas.getByRole("radio", { name: "Ingrediente" }));

    await expect(args.onModeChange).toHaveBeenCalledWith("ingredient");
    await expect(canvas.getByRole("searchbox")).toHaveValue("zucch");
  },
};
