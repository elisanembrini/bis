import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { RegisterForm } from "./RegisterForm";

const meta = {
  component: RegisterForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof RegisterForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Nome"), "Anna");
    await userEvent.type(canvas.getByLabelText("Email"), "anna@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "una-password-sicura");
    await userEvent.click(canvas.getByRole("button", { name: "Registrati" }));

    await expect(args.onSubmit).toHaveBeenCalledWith({
      display_name: "Anna",
      email: "anna@example.com",
      password: "una-password-sicura",
    });
  },
};

export const ValidationErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Password"), "corta");
    await userEvent.click(canvas.getByRole("button", { name: "Registrati" }));

    await expect(await canvas.findByText("Inserisci il tuo nome")).toBeVisible();
    await expect(canvas.getByText("Inserisci un indirizzo email valido")).toBeVisible();
    await expect(canvas.getByText("La password deve avere da 10 a 128 caratteri")).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const EmailAlreadyRegistered: Story = {
  args: { errorCode: "EMAIL_ALREADY_REGISTERED" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Esiste già un account con questa email.",
    );
  },
};
