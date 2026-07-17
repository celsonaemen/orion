import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

export function GET(request: NextRequest) {
  return proxyAuthenticatedBackend(request, "/chat/channels", { method: "GET" });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(request, "/chat/channels", {
    body,
    method: "POST",
  });
}
