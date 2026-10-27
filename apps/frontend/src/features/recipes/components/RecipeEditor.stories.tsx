import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

import { emptyRecipeForm, recipeToForm } from "../form";
import { availableTags, pastaRecipe } from "./fixtures";
import { RecipeEditor } from "./RecipeEditor";

let counter = 0;
const newKey = () => {
  counter += 1;
  return `story-key-${counter}`;
};

const meta = {
  component: RecipeEditor,
  args: {
    heading: "Nuova ricetta",
    initialValues: emptyRecipeForm(newKey),
    availableTags,
    newKey,
    onSubmit: fn(),
    onCancel: fn(),
    onChange: fn(),
  },
} satisfies Meta<typeof RecipeEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const CreateRecipe: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(await canvas.findByLabelText("Titolo"), "Frittata");
    const first = within(canvas.getByRole("group", { name: "Ingrediente 1" }));
    await userEvent.type(first.getByLabelText("Quantità"), "1,5");
    await userEvent.selectOptions(first.getByLabelText("Unità"), "cucchiaio");
    await userEvent.type(first.getByLabelText("Ingrediente"), "olio");

    await userEvent.click(canvas.getByRole("button", { name: "Aggiungi ingrediente" }));
    const second = within(canvas.getByRole("group", { name: "Ingrediente 2" }));
    await userEvent.type(second.getByLabelText("Ingrediente"), "sale");

    const step = within(canvas.getByRole("group", { name: "Passaggio 1" }));
    await userEvent.type(step.getByLabelText("Descrizione"), "Sbatti le uova.");
    await userEvent.type(step.getByLabelText("secondi"), "30");

    const tags = within(canvas.getByRole("group", { name: "Etichette" }));
    await userEvent.click(tags.getByRole("checkbox", { name: "Vegetariano" }));
    await userEvent.click(tags.getByRole("checkbox", { name: "Natale" }));

    await userEvent.click(canvas.getByRole("button", { name: "Salva ricetta" }));

    await expect(args.onSubmit).toHaveBeenCalledWith({
      title: "Frittata",
      notes: null,
      prep_minutes: null,
      cook_minutes: null,
      servings: 4,
      cover_photo_id: null,
      tag_ids: ["6f1d5a10-0000-4000-8000-000000000006", "aaaaaaaa-0000-4000-8000-000000000001"],
      ingredients: [
        { quantity: "1.5", unit: "cucchiaio", name: "olio" },
        { quantity: null, unit: null, name: "sale" },
      ],
      steps: [{ text: "Sbatti le uova.", timer_seconds: 30, photo_id: null }],
    });
  },
};

export const ReorderAndRemove: Story = {
  args: { heading: "Modifica ricetta", initialValues: recipeToForm(pastaRecipe) },
  play: async ({ args, canvas, userEvent }) => {
    const third = within(await canvas.findByRole("group", { name: "Passaggio 3" }));
    await userEvent.click(third.getByRole("button", { name: "Sposta su" }));
    const first = within(canvas.getByRole("group", { name: "Ingrediente 1" }));
    await userEvent.click(first.getByRole("button", { name: "Rimuovi" }));
    await userEvent.click(canvas.getByRole("button", { name: "Salva ricetta" }));

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        ingredients: [
          { quantity: "1.5", unit: "cucchiaio", name: "olio extravergine" },
          { quantity: "1", unit: "spicchio", name: "aglio" },
          { quantity: null, unit: null, name: "sale" },
        ],
        steps: [
          { text: "Porta a bollore l'acqua e sala.", timer_seconds: null, photo_id: null },
          { text: "Condisci con il sugo.", timer_seconds: null, photo_id: null },
          { text: "Cuoci la pasta.", timer_seconds: 570, photo_id: null },
        ],
      }),
    );
  },
};

export const ExistingTagsAreSelected: Story = {
  args: { initialValues: recipeToForm(pastaRecipe) },
  play: async ({ canvas }) => {
    const tags = within(await canvas.findByRole("group", { name: "Etichette" }));
    await expect(tags.getByRole("checkbox", { name: "Primi" })).toBeChecked();
    await expect(tags.getByRole("checkbox", { name: "Veloce" })).toBeChecked();
    await expect(tags.getByRole("checkbox", { name: "Dolci" })).not.toBeChecked();
  },
};

export const FirstAndLastRowLimits: Story = {
  args: { initialValues: recipeToForm(pastaRecipe) },
  play: async ({ canvas }) => {
    const first = within(await canvas.findByRole("group", { name: "Passaggio 1" }));
    await expect(first.getByRole("button", { name: "Sposta su" })).toBeDisabled();
    const last = within(canvas.getByRole("group", { name: "Passaggio 3" }));
    await expect(last.getByRole("button", { name: "Sposta giù" })).toBeDisabled();
  },
};

export const ValidationErrors: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const ingredient = within(await canvas.findByRole("group", { name: "Ingrediente 1" }));
    await userEvent.type(ingredient.getByLabelText("Quantità"), "un po'");
    await userEvent.click(canvas.getByRole("button", { name: "Salva ricetta" }));

    await expect(await canvas.findByText("Inserisci un titolo")).toBeVisible();
    await expect(canvas.getByText("Usa un numero, ad esempio 1,5")).toBeVisible();
    await expect(canvas.getByText("Scrivi il nome dell'ingrediente")).toBeVisible();
    await expect(canvas.getByText("Descrivi il passaggio")).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const OnlyRowCannotBeRemoved: Story = {
  play: async ({ canvas }) => {
    const ingredient = within(await canvas.findByRole("group", { name: "Ingrediente 1" }));
    await expect(ingredient.getByRole("button", { name: "Rimuovi" })).toBeDisabled();
  },
};

export const Submitting: Story = {
  args: { initialValues: recipeToForm(pastaRecipe), isSubmitting: true },
};

export const ServerError: Story = {
  args: { initialValues: recipeToForm(pastaRecipe), errorCode: "UNKNOWN" },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Qualcosa è andato storto");
  },
};

export const WithPendingDraft: Story = {
  args: {
    pendingDraft: {
      savedAt: "2026-10-26T20:15:00Z",
      values: { ...recipeToForm(pastaRecipe), title: "Pasta della bozza" },
    },
    onRestoreDraft: fn(),
    onDiscardDraft: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      await canvas.findByText("Hai una bozza non salvata del 26 ottobre 2026."),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Ripristina" }));

    await expect(canvas.getByLabelText("Titolo")).toHaveValue("Pasta della bozza");
    await expect(args.onRestoreDraft).toHaveBeenCalledOnce();
  },
};
