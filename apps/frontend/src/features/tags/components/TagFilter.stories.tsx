import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { availableTags } from "../../recipes/components/fixtures";
import { TagFilter } from "./TagFilter";

const vegetarian = "6f1d5a10-0000-4000-8000-000000000006";

const meta = {
  component: TagFilter,
  args: { tags: availableTags, selectedTagId: undefined, onChange: fn() },
} satisfies Meta<typeof TagFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoneSelected: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("group", { name: "Filtra per etichetta" })).toBeVisible();
    await userEvent.click(canvas.getByRole("checkbox", { name: "Vegetariano" }));

    await expect(args.onChange).toHaveBeenCalledWith(vegetarian);
  },
};

export const OneSelected: Story = {
  args: { selectedTagId: vegetarian },
  play: async ({ args, canvas, userEvent }) => {
    const chip = await canvas.findByRole("checkbox", { name: "Vegetariano" });
    await expect(chip).toBeChecked();

    await userEvent.click(chip);

    await expect(args.onChange).toHaveBeenCalledWith(undefined);
  },
};

export const ManageLink: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Gestisci etichette" })).toHaveAttribute(
      "href",
      "/tags",
    );
  },
};
