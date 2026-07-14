import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(request, `/users/${encodeURIComponent(id)}/status`, {
    body,
    method: "PATCH",
  });
}
