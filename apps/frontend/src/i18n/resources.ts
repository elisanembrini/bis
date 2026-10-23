import auth from "./it/auth.json";
import common from "./it/common.json";
import health from "./it/health.json";
import home from "./it/home.json";

export const defaultNamespace = "common";

export const resources = {
  it: {
    auth,
    common,
    health,
    home,
  },
} as const;
