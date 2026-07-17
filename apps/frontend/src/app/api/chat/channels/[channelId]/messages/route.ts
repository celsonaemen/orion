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
    channelId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { channelId } = await context.params;

  return proxyAuthenticatedBackend(
    request,
    `/chat/channels/${encodeURIComponent(channelId)}/messages${request.nextUrl.search}`,
    { method: "GET" },
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSameOriginPost(request)) {
    return unsafeRequestResponse();
  }

  if (!hasJsonContentType(request)) {
    return unsupportedMediaTypeResponse();
  }

  const { channelId } = await context.params;
  const body = await request.json().catch(() => null);

  return proxyAuthenticatedBackend(
    request,
    `/chat/channels/${encodeURIComponent(channelId)}/messages`,
    {
      body,
      method: "POST",
    },
  );
}
