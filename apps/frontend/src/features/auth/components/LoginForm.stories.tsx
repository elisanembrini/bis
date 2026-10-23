import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { LoginForm } from "./LoginForm";

const meta = {
  component: LoginForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Email"), "anna@example.com");
    await userEvent.type(canvas.getByLabelText("Password"), "una-password-sicura");
    await userEvent.click(canvas.getByRole("button", { name: "Accedi" }));

    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: "anna@example.com",
      password: "una-password-sicura",
    });
  },
};

export const ValidationErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Email"), "non-una-email");
    await userEvent.click(canvas.getByRole("button", { name: "Accedi" }));

    await expect(await canvas.findByText("Inserisci un indirizzo email valido")).toBeVisible();
    await expect(canvas.getByText("Inserisci la password")).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const InvalidCredentials: Story = {
  args: { errorCode: "INVALID_CREDENTIALS" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Email o password non corretti.",
    );
  },
};

export const TooManyAttempts: Story = {
  args: { errorCode: "TOO_MANY_ATTEMPTS" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Troppi tentativi");
  },
};
