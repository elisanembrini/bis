import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { ResetPasswordForm } from "./ResetPasswordForm";

const meta = {
  component: ResetPasswordForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof ResetPasswordForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Nuova password"), "una-nuova-password");
    await userEvent.click(canvas.getByRole("button", { name: "Salva la password" }));

    await expect(args.onSubmit).toHaveBeenCalledWith({ password: "una-nuova-password" });
  },
};

export const ValidationErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Nuova password"), "corta");
    await userEvent.click(canvas.getByRole("button", { name: "Salva la password" }));

    await expect(
      await canvas.findByText("La password deve avere da 10 a 128 caratteri"),
    ).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const InvalidToken: Story = {
  args: { errorCode: "RESET_TOKEN_INVALID" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Il link non è valido");
    await expect(canvas.getByRole("link", { name: "Richiedi un nuovo link" })).toBeVisible();
  },
};

export const Done: Story = {
  args: { isDone: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Password aggiornata");
  },
};
