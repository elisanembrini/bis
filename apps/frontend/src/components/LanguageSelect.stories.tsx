import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { LanguageSelect } from "./LanguageSelect";

const meta = {
  component: LanguageSelect,
  args: {
    languages: [
      { code: "it", name: "Italiano" },
      { code: "en", name: "English" },
    ],
    value: "it",
    onChange: fn(),
  },
} satisfies Meta<typeof LanguageSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TwoLanguages: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const select = await canvas.findByRole("combobox", { name: "Lingua" });
    await expect(select).toHaveValue("it");

    await userEvent.selectOptions(select, "en");

    await expect(args.onChange).toHaveBeenCalledWith("en");
  },
};

export const SingleLanguageIsHidden: Story = {
  args: { languages: [{ code: "it", name: "Italiano" }] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("combobox")).toBeNull();
  },
};
