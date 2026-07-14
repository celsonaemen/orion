import type { BackendAuthResponse } from "@/types/auth";

import type { BackendAuthResult } from "./backend";
import { refreshWithBackend } from "./backend";

const refreshesInFlight = new Map<string, Promise<BackendAuthResult<BackendAuthResponse>>>();

export function refreshWithSingleFlight(refreshToken: string) {
  const current = refreshesInFlight.get(refreshToken);

  if (current) {
    return current;
  }

  const refresh = refreshWithBackend(refreshToken).finally(() => {
    refreshesInFlight.delete(refreshToken);
  });

  refreshesInFlight.set(refreshToken, refresh);
  return refresh;
}
