export function createRefreshCoordinator<T>(refresh: () => Promise<T>) {
  let inFlight: Promise<T> | null = null;

  return function refreshOnce() {
    if (!inFlight) {
      inFlight = refresh().finally(() => {
        inFlight = null;
      });
    }

    return inFlight;
  };
}
