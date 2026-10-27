import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { PhotoInput } from "./PhotoInput";
import { dishImage } from "./storyImages";

const meta = {
  component: PhotoInput,
  args: { label: "Foto del piatto", onSelect: fn(), onRemove: fn() },
} satisfies Meta<typeof PhotoInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("group", { name: "Foto del piatto" })).toBeVisible();
    await expect(canvas.queryByRole("img")).toBeNull();
    const file = new File(["jpeg"], "piatto.jpg", { type: "image/jpeg" });

    await userEvent.upload(canvas.getByLabelText("Foto del piatto: Aggiungi foto"), file);

    await expect(args.onSelect).toHaveBeenCalledWith(file);
  },
};

export const AcceptsPhoneFormatsAndAllowsGallery: Story = {
  play: async ({ canvas }) => {
    const input = await canvas.findByLabelText("Foto del piatto: Aggiungi foto");
    await expect(input).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp,image/heic,image/heif",
    );
    await expect(input).not.toHaveAttribute("capture");
  },
};

export const WithPhoto: Story = {
  args: { imageSrc: dishImage },
  play: async ({ args, canvas, userEvent }) => {
    await expect(await canvas.findByRole("img", { name: "Foto del piatto" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Cambia foto" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Rimuovi foto" }));

    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};

export const Uploading: Story = {
  args: { imageSrc: dishImage, progress: 0.4 },
  play: async ({ canvas }) => {
    const progress = await canvas.findByRole("progressbar", { name: "Caricamento della foto" });
    await expect(progress).toHaveAttribute("aria-valuenow", "40");
    await expect(canvas.getByRole("button", { name: "Cambia foto" })).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Rimuovi foto" })).toBeNull();
  },
};

export const TooLarge: Story = {
  args: { errorCode: "PHOTO_TOO_LARGE" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "La foto è troppo grande: il massimo è 10 MB.",
    );
  },
};

export const InvalidFormat: Story = {
  args: { errorCode: "PHOTO_INVALID" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Questo file non è una foto JPEG, PNG, WebP o HEIC valida.",
    );
  },
};

export const Disabled: Story = {
  args: { imageSrc: dishImage, disabled: true },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Cambia foto" })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Rimuovi foto" })).toBeDisabled();
  },
};
