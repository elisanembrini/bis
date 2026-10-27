import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor } from "storybook/test";

import { ownerMember, regularMember } from "./fixtures";
import { MemberList } from "./MemberList";

const meta = {
  component: MemberList,
  args: {
    members: [ownerMember, regularMember],
    currentUserId: ownerMember.user_id,
    canRemove: true,
    onRemove: fn(),
  },
} satisfies Meta<typeof MemberList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OwnerView: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByText("Titolare")).toBeVisible();
    await expect(canvas.getByText("Membro")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Rimuovi Anna" })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: "Rimuovi Bruno" }));
    const dialog = await screen.findByRole("dialog", { name: "Rimuovere Bruno dalla casa?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await userEvent.click(screen.getByRole("button", { name: "Rimuovi" }));

    await expect(args.onRemove).toHaveBeenCalledWith(regularMember);
  },
};

export const CancelRemoval: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Rimuovi Bruno" }));
    await userEvent.click(await screen.findByRole("button", { name: "Annulla" }));

    await expect(args.onRemove).not.toHaveBeenCalled();
  },
};

export const MemberView: Story = {
  args: { currentUserId: regularMember.user_id, canRemove: false },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("(tu)")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: /Rimuovi/ })).toBeNull();
  },
};

export const OnlyOwner: Story = {
  args: { members: [ownerMember] },
  play: async ({ canvas }) => {
    await expect(await canvas.findAllByRole("listitem")).toHaveLength(1);
  },
};

export const Removing: Story = {
  args: { removingUserId: regularMember.user_id },
};

export const RemoveError: Story = {
  args: { errorCode: "MEMBER_NOT_FOUND" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Questa persona non fa più parte della casa.",
    );
  },
};
