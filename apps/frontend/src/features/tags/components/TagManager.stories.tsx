import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { availableTags } from "../../recipes/components/fixtures";
import { TagManager } from "./TagManager";

const meta = {
  component: TagManager,
  args: { tags: availableTags, onCreate: fn(), onDelete: fn() },
} satisfies Meta<typeof TagManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithPersonalTags: Story = {
  play: async ({ canvas }) => {
    const own = within(await canvas.findByRole("list", { name: "Le tue etichette" }));
    await expect(own.getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Natale"]);
    await expect(canvas.queryByRole("button", { name: "Elimina l'etichetta Primi" })).toBeNull();
  },
};

export const OnlyStarterTags: Story = {
  args: { tags: availableTags.filter((tag) => !tag.is_own) },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByText("Non hai ancora creato etichette personali."),
    ).toBeVisible();
  },
};

export const Create: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Nuova etichetta"), "  Estate ");
    await userEvent.click(canvas.getByRole("button", { name: "Aggiungi" }));

    await expect(args.onCreate).toHaveBeenCalledWith("Estate");
    await expect(canvas.getByLabelText("Nuova etichetta")).toHaveValue("");
  },
};

export const EmptyNameIsRejected: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Aggiungi" }));

    await expect(await canvas.findByText("Scrivi il nome dell'etichetta")).toBeVisible();
    await expect(args.onCreate).not.toHaveBeenCalled();
  },
};

export const DuplicateError: Story = {
  args: { errorCode: "TAG_ALREADY_EXISTS" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Esiste già un'etichetta con questo nome.",
    );
  },
};

export const DeleteWithConfirmation: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: "Elimina l'etichetta Natale" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Eliminare l'etichetta «Natale»?" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveTextContent("Le ricette restano.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Elimina" }));

    await expect(args.onDelete).toHaveBeenCalledWith(expect.objectContaining({ name: "Natale" }));
  },
};

export const Creating: Story = {
  args: { isCreating: true },
};
