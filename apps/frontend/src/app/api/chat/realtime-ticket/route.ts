import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

export function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return unsafeRequestResponse();
  if (!hasJsonContentType(request)) return unsupportedMediaTypeResponse();

  return proxyAuthenticatedBackend(request, "/chat/realtime-ticket", {
    body: {},
    method: "POST",
  });
}
