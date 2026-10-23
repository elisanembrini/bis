import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

const meta = {
  component: ForgotPasswordForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof ForgotPasswordForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Email"), "anna@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Invia il link" }));

    await expect(args.onSubmit).toHaveBeenCalledWith({ email: "anna@example.com" });
  },
};

export const ValidationErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Invia il link" }));

    await expect(await canvas.findByText("Inserisci un indirizzo email valido")).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const Sent: Story = {
  args: { isSent: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Se l'indirizzo è registrato");
  },
};

export const ServerError: Story = {
  args: { errorCode: "UNKNOWN" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Qualcosa è andato storto");
  },
};
