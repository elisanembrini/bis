import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "./generated/schema";

export const fetchClient = createFetchClient<paths>({ baseUrl: "/api" });

export const $api = createClient(fetchClient);
