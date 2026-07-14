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

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return proxyAuthenticatedBackend(request, `/users/${encodeURIComponent(id)}`, {
    method: "GET",
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(request, `/users/${encodeURIComponent(id)}`, {
    body,
    method: "PATCH",
  });
}
