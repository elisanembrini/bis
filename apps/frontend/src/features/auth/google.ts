import type { paths } from "../../api/generated/schema";

const GOOGLE_AUTHORIZE_PATH = "/auth/google/authorize" satisfies keyof paths;

type GoogleAuthorizeOptions = {
  redirect?: string | undefined;
  inviteToken?: string | undefined;
};

export const googleAuthorizeHref = ({
  redirect,
  inviteToken,
}: GoogleAuthorizeOptions = {}): string => {
  const params = new URLSearchParams();
  if (redirect !== undefined) {
    params.set("redirect", redirect);
  }
  if (inviteToken !== undefined) {
    params.set("invite_token", inviteToken);
  }
  const query = params.toString();
  return `/api${GOOGLE_AUTHORIZE_PATH}${query === "" ? "" : `?${query}`}`;
};
