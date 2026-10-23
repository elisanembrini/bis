import { $api } from "../../../api/client";

export const healthQueryOptions = () => $api.queryOptions("get", "/health");

export const useHealth = () => $api.useQuery("get", "/health");
