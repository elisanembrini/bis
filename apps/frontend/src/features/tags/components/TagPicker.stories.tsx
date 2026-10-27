import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { availableTags } from "../../recipes/components/fixtures";
import { TagPicker } from "./TagPicker";

const meta = {
  component: TagPicker,
  args: { tags: availableTags, value: [], onChange: fn() },
} satisfies Meta<typeof TagPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MultipleSelection: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <TagPicker
        tags={args.tags}
        value={value}
        onChange={(next) => {
          setValue(next);
          args.onChange(next);
        }}
      />
    );
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("checkbox", { name: "Primi" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Natale" }));

    await expect(args.onChange).toHaveBeenLastCalledWith([
      "6f1d5a10-0000-4000-8000-000000000002",
      "aaaaaaaa-0000-4000-8000-000000000001",
    ]);
    await expect(canvas.getByRole("checkbox", { name: "Primi" })).toBeChecked();
  },
};
