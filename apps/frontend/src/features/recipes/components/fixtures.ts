import type { RecipeResponse, RecipeSummary, ShareCandidate, TagResponse } from "../types";

export const anna = { id: "11111111-1111-4111-8111-111111111111", display_name: "Anna" };

export const pastaRecipe: RecipeResponse = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "Pasta al pomodoro",
  is_own: true,
  author: anna,
  notes: "Meglio con il basilico fresco.\nSe avanza, il giorno dopo è ancora più buona.",
  prep_minutes: 10,
  cook_minutes: 15,
  servings: 4,
  cover_photo_id: null,
  tags: [
    { id: "6f1d5a10-0000-4000-8000-000000000002", name: "Primi" },
    { id: "6f1d5a10-0000-4000-8000-000000000007", name: "Veloce" },
  ],
  created_at: "2026-10-20T18:00:00Z",
  updated_at: "2026-10-20T18:00:00Z",
  ingredients: [
    { id: "i1", quantity: "320.000", unit: "g", name: "spaghetti" },
    { id: "i2", quantity: "1.500", unit: "tablespoon", name: "olio extravergine" },
    { id: "i3", quantity: "1.000", unit: "clove", name: "aglio" },
    { id: "i4", quantity: null, unit: null, name: "sale" },
  ],
  steps: [
    { id: "s1", text: "Porta a bollore l'acqua e sala.", timer_seconds: null, photo_id: null },
    { id: "s2", text: "Cuoci la pasta.", timer_seconds: 570, photo_id: null },
    { id: "s3", text: "Condisci con il sugo.", timer_seconds: null, photo_id: null },
  ],
};

export const minimalRecipe: RecipeResponse = {
  ...pastaRecipe,
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  title: "Uovo sodo",
  notes: null,
  prep_minutes: null,
  cook_minutes: null,
  servings: 1,
  tags: [],
  ingredients: [{ id: "i5", quantity: null, unit: null, name: "uovo" }],
  steps: [{ id: "s4", text: "Cuoci in acqua bollente.", timer_seconds: 540, photo_id: null }],
};

export const recipeSummaries: RecipeSummary[] = [pastaRecipe, minimalRecipe].map(
  ({
    id,
    title,
    is_own,
    author,
    servings,
    prep_minutes,
    cook_minutes,
    cover_photo_id,
    tags,
    created_at,
    updated_at,
  }) => ({
    id,
    title,
    is_own,
    author,
    servings,
    prep_minutes,
    cook_minutes,
    cover_photo_id,
    tags,
    created_at,
    updated_at,
  }),
);

export const pastaWithPhotos: RecipeResponse = {
  ...pastaRecipe,
  cover_photo_id: "cover-photo",
  steps: [
    { id: "s1", text: "Porta a bollore l'acqua e sala.", timer_seconds: null, photo_id: null },
    { id: "s2", text: "Cuoci la pasta.", timer_seconds: 570, photo_id: "step-photo" },
    { id: "s3", text: "Condisci con il sugo.", timer_seconds: null, photo_id: null },
  ],
};

export const summariesWithThumbnail: RecipeSummary[] = [
  {
    id: pastaRecipe.id,
    title: pastaRecipe.title,
    is_own: true,
    author: anna,
    servings: pastaRecipe.servings,
    prep_minutes: pastaRecipe.prep_minutes,
    cook_minutes: pastaRecipe.cook_minutes,
    cover_photo_id: "cover-photo",
    tags: pastaRecipe.tags,
    created_at: pastaRecipe.created_at,
    updated_at: pastaRecipe.updated_at,
  },
  ...recipeSummaries.slice(1),
];

export const availableTags: TagResponse[] = [
  { id: "6f1d5a10-0000-4000-8000-000000000001", name: "Antipasti", is_own: false },
  { id: "6f1d5a10-0000-4000-8000-000000000002", name: "Primi", is_own: false },
  { id: "6f1d5a10-0000-4000-8000-000000000005", name: "Dolci", is_own: false },
  { id: "6f1d5a10-0000-4000-8000-000000000006", name: "Vegetariano", is_own: false },
  { id: "6f1d5a10-0000-4000-8000-000000000007", name: "Veloce", is_own: false },
  { id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Natale", is_own: true },
];

export const sharedRecipe: RecipeResponse = {
  ...pastaRecipe,
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  title: "Tiramisù di Bruno",
  is_own: false,
  author: { id: "22222222-2222-4222-8222-222222222222", display_name: "Bruno" },
  tags: [{ id: "6f1d5a10-0000-4000-8000-000000000005", name: "Dolci" }],
};

export const sharedSummary: RecipeSummary = {
  id: sharedRecipe.id,
  title: sharedRecipe.title,
  is_own: false,
  author: sharedRecipe.author,
  servings: sharedRecipe.servings,
  prep_minutes: sharedRecipe.prep_minutes,
  cook_minutes: sharedRecipe.cook_minutes,
  cover_photo_id: null,
  tags: sharedRecipe.tags,
  created_at: sharedRecipe.created_at,
  updated_at: sharedRecipe.updated_at,
};

export const shareCandidates: ShareCandidate[] = [
  { user_id: "22222222-2222-4222-8222-222222222222", display_name: "Bruno", shared: true },
  { user_id: "33333333-3333-4333-8333-333333333333", display_name: "Carla", shared: false },
];
