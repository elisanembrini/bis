import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";

import type { paths } from "./generated/schema";
import { unauthorizedMiddleware } from "./unauthorized";

export const fetchClient = createFetchClient<paths>({ baseUrl: "/api" });

fetchClient.use(unauthorizedMiddleware);

export const $api = createClient(fetchClient);
