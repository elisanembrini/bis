import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { InviteCard } from "./InviteCard";

const meta = {
  component: InviteCard,
  args: {
    token: "abc-123",
    inviterName: "Anna",
    state: { kind: "anonymous" },
    returnTo: "/invite/abc-123",
    onAccept: fn(),
  },
} satisfies Meta<typeof InviteCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Anonymous: Story = {
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("heading", { name: "Anna ti invita nella sua casa su Bis" }),
    ).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Registrati" })).toHaveAttribute(
      "href",
      "/register?invite=abc-123",
    );
    await expect(canvas.getByRole("link", { name: "Accedi" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Finvite%2Fabc-123",
    );
    await expect(canvas.getByRole("link", { name: "Accedi con Google" })).toHaveAttribute(
      "href",
      "/api/auth/google/authorize?invite_token=abc-123",
    );
  },
};

export const CanJoin: Story = {
  args: { state: { kind: "canJoin" } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Entrando lascerai la tua casa attuale",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Entra nella casa" }));

    await expect(args.onAccept).toHaveBeenCalledOnce();
  },
};

export const Accepting: Story = {
  args: { state: { kind: "canJoin" }, isAccepting: true },
};

export const MustLeave: Story = {
  args: { state: { kind: "mustLeave" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("devi prima lasciarla");
    await expect(canvas.queryByRole("button", { name: "Entra nella casa" })).toBeNull();
    await expect(canvas.getByRole("link", { name: "Vai alla tua casa" })).toBeVisible();
  },
};

export const AlreadyMember: Story = {
  args: { state: { kind: "alreadyMember" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Fai già parte di questa casa.",
    );
  },
};

export const AcceptFailed: Story = {
  args: { state: { kind: "canJoin" }, errorCode: "INVITE_USED" },
  play: async ({ canvas }) => {
    const alerts = await canvas.findAllByRole("alert");
    await expect(alerts[0]).toHaveTextContent("Questo invito è già stato usato.");
  },
};
