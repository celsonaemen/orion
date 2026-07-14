import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

export function GET(request: NextRequest) {
  return proxyAuthenticatedBackend(request, `/sectors${request.nextUrl.search}`, {
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(request, "/sectors", {
    body,
    method: "POST",
  });
}
