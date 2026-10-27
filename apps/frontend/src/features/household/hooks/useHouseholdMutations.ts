import { useQueryClient } from "@tanstack/react-query";

import { $api } from "../../../api/client";
import { meQueryOptions } from "../../auth/queries";
import { householdQueryOptions } from "../queries";

export const useHouseholdMutations = () => {
  const queryClient = useQueryClient();
  const refreshHousehold = () =>
    queryClient.invalidateQueries({ queryKey: householdQueryOptions().queryKey });

  const createInvite = $api.useMutation("post", "/household/invites");
  const removeMember = $api.useMutation("delete", "/household/members/{user_id}", {
    onSuccess: refreshHousehold,
  });
  const leave = $api.useMutation("post", "/household/leave", {
    onSuccess: async (me) => {
      queryClient.setQueryData(meQueryOptions().queryKey, me);
      await refreshHousehold();
    },
  });

  return { createInvite, removeMember, leave };
};
