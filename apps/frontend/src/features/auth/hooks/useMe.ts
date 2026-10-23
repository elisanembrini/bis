import { $api } from "../../../api/client";

export const useMe = () => $api.useQuery("get", "/me");
