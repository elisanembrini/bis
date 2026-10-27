import { $api } from "../../api/client";

export const tagsQueryOptions = () => $api.queryOptions("get", "/tags");
