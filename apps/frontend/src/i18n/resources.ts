import auth from "./it/auth.json";
import common from "./it/common.json";
import health from "./it/health.json";
import household from "./it/household.json";
import recipes from "./it/recipes.json";

export const defaultNamespace = "common";

export const resources = {
  it: {
    auth,
    common,
    health,
    household,
    recipes,
  },
} as const;
