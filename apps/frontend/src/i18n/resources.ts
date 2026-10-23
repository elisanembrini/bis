import common from "./it/common.json";
import health from "./it/health.json";

export const defaultNamespace = "common";

export const resources = {
  it: {
    common,
    health,
  },
} as const;
