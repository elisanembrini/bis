import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { $api } from "../../../api/client";
import { removeDraftsOf } from "../../recipes/draft";
import { useMe } from "./useMe";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const me = useMe();

  return $api.useMutation("post", "/auth/logout", {
    onSettled: () => {
      if (me.data !== undefined) {
        removeDraftsOf(me.data.id);
      }
      queryClient.clear();
      void navigate({ to: "/login" });
    },
  });
};
