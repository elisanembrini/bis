import { useUnauthorizedRedirect } from "../hooks/useUnauthorizedRedirect";

export function UnauthorizedRedirect() {
  useUnauthorizedRedirect();
  return null;
}
