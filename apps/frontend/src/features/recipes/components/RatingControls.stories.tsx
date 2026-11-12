import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { RatingControls } from "./RatingControls";

const meta = {
  component: RatingControls,
  args: {
    sort: undefined,
    minRating: undefined,
    onSortChange: fn(),
    onMinRatingChange: fn(),
  },
} satisfies Meta<typeof RatingControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByLabelText("Ordina per")).toHaveValue("");
    await expect(canvas.getByLabelText("Voto minimo")).toHaveValue("");
  },
};

export const ChooseSort: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.selectOptions(await canvas.findByLabelText("Ordina per"), "Voto più alto");

    await expect(args.onSortChange).toHaveBeenCalledWith("rating");
  },
};

export const BackToMostRecent: Story = {
  args: { sort: "rating" },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByLabelText("Ordina per")).toHaveValue("rating");
    await userEvent.selectOptions(canvas.getByLabelText("Ordina per"), "Più recenti");

    await expect(args.onSortChange).toHaveBeenCalledWith(undefined);
  },
};

export const ChooseMinimumRating: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const select = await canvas.findByLabelText("Voto minimo");
    await userEvent.selectOptions(select, "8+");

    await expect(args.onMinRatingChange).toHaveBeenCalledWith(8);
  },
};

export const TopRatingOnly: Story = {
  args: { minRating: 10 },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByLabelText("Voto minimo")).toHaveValue("10");
    await userEvent.selectOptions(canvas.getByLabelText("Voto minimo"), "Tutti");

    await expect(args.onMinRatingChange).toHaveBeenCalledWith(undefined);
  },
};
