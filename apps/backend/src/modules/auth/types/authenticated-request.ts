import type { AuthenticatedUser } from "./authenticated-user";
import type { HttpRequest } from "./http-request";

export type AuthenticatedRequest = HttpRequest & {
  user?: AuthenticatedUser;
};
