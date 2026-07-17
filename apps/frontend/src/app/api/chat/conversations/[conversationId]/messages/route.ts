import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";
import {
  hasJsonContentType,
  isSameOriginPost,
  unsafeRequestResponse,
  unsupportedMediaTypeResponse,
} from "@/lib/auth/request-safety";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { conversationId } = await context.params;

  return proxyAuthenticatedBackend(
    request,
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages${request.nextUrl.search}`,
    { method: "GET" },
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginPost(request)) return unsafeRequestResponse();
  if (!hasJsonContentType(request)) return unsupportedMediaTypeResponse();

  const { conversationId } = await context.params;
  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(
    request,
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { body, method: "POST" },
  );
}
