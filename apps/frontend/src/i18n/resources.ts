import { it } from "./it";
import type { Language } from "./languages";

export const defaultNamespace = "common";

export type Resources = typeof it;

export const resources = { it } satisfies Record<Language, Resources>;
