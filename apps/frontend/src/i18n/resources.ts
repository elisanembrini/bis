import auth from "./it/auth.json";
import common from "./it/common.json";
import cooking from "./it/cooking.json";
import health from "./it/health.json";
import household from "./it/household.json";
import recipes from "./it/recipes.json";
import tags from "./it/tags.json";

export const defaultNamespace = "common";

export const resources = {
  it: {
    auth,
    common,
    cooking,
    health,
    household,
    recipes,
    tags,
  },
} as const;
