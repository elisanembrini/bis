import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

import { UnauthorizedRedirect } from "../features/auth/components/UnauthorizedRedirect";

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <UnauthorizedRedirect />
      <Outlet />
    </>
  );
}
