import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { $api } from "../../../api/client";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return $api.useMutation("post", "/auth/logout", {
    onSettled: () => {
      queryClient.clear();
      void navigate({ to: "/login" });
    },
  });
};
