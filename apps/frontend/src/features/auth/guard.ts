import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";

import { errorCodeOf } from "../../api/errors";
import { meQueryOptions } from "./queries";

export const requireAuthentication = async (queryClient: QueryClient, currentHref: string) => {
  try {
    return await queryClient.ensureQueryData(meQueryOptions());
  } catch (error) {
    if (errorCodeOf(error) === "UNAUTHENTICATED") {
      throw redirect({ to: "/login", search: { redirect: currentHref } });
    }
    throw error;
  }
};
