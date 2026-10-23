import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { UNAUTHORIZED_EVENT, authEvents } from "../../../api/unauthorized";

export const useUnauthorizedRedirect = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const handleUnauthorized = () => {
      queryClient.clear();
      void navigate({ to: "/login", search: { redirect: router.state.location.href } });
    };
    authEvents.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => authEvents.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [queryClient, navigate, router]);
};
