import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { shareCandidates } from "./fixtures";
import { MemberPicker } from "./MemberPicker";

const meta = {
  component: MemberPicker,
  args: { candidates: shareCandidates, onSave: fn(), onCancel: fn() },
} satisfies Meta<typeof MemberPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SomeSelected: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("checkbox", { name: "Bruno" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Carla" })).not.toBeChecked();

    await userEvent.click(canvas.getByRole("checkbox", { name: "Carla" }));
    await userEvent.click(canvas.getByRole("checkbox", { name: "Bruno" }));
    await userEvent.click(canvas.getByRole("button", { name: "Salva" }));

    await expect(args.onSave).toHaveBeenCalledWith(["33333333-3333-4333-8333-333333333333"]);
  },
};

export const NoneSelected: Story = {
  args: {
    candidates: shareCandidates.map(({ user_id, display_name }) => ({
      user_id,
      display_name,
      shared: false,
    })),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Salva" }));

    await expect(args.onSave).toHaveBeenCalledWith([]);
  },
};

export const NoOtherMembers: Story = {
  args: { candidates: [] },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Nella tua casa non c'è ancora nessun altro."),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Invita qualcuno nella tua casa" }),
    ).toHaveAttribute("href", "/household");
  },
};

export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Annulla" })).toBeDisabled();
  },
};

export const SaveError: Story = {
  args: { errorCode: "SHARE_NOT_ALLOWED" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Puoi condividere una ricetta solo con chi vive nella tua casa.",
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Annulla" }));

    await expect(args.onCancel).toHaveBeenCalledOnce();
    await expect(args.onSave).not.toHaveBeenCalled();
  },
};
