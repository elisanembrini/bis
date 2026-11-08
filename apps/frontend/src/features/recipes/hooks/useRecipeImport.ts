import { $api } from "../../../api/client";

export const useRecipeImport = () => $api.useMutation("post", "/recipes/import");
