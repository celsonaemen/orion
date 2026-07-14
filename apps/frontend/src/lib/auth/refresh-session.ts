import type { BackendAuthResponse } from "@/types/auth";

import { createKeyedRefreshCoordinator } from "@/features/auth/refresh-coordinator";

import type { BackendAuthResult } from "./backend";
import { refreshWithBackend } from "./backend";

const REFRESH_RESULT_REUSE_MS = 5_000;

const refreshCoordinated = createKeyedRefreshCoordinator<
  string,
  BackendAuthResult<BackendAuthResponse>
>(refreshWithBackend, {
  reuseForMs: REFRESH_RESULT_REUSE_MS,
  shouldReuse: (result) => result.ok,
});

export function refreshWithSingleFlight(refreshToken: string) {
  return refreshCoordinated(refreshToken);
}
