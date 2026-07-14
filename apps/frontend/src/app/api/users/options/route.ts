import { NextRequest } from "next/server";

import { proxyAuthenticatedBackend } from "@/lib/api/backend-proxy";

export function GET(request: NextRequest) {
  return proxyAuthenticatedBackend(request, "/users/options", {
    method: "GET",
  });
}
