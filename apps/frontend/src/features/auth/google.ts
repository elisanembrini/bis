import type { paths } from "../../api/generated/schema";

const GOOGLE_AUTHORIZE_PATH = "/auth/google/authorize" satisfies keyof paths;

export const googleAuthorizeHref = (redirect: string | undefined): string => {
  const query = redirect === undefined ? "" : `?${new URLSearchParams({ redirect }).toString()}`;
  return `/api${GOOGLE_AUTHORIZE_PATH}${query}`;
};
