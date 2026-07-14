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

type KeyedRefreshOptions<T> = {
  reuseForMs: number;
  shouldReuse: (value: T) => boolean;
};

export function createKeyedRefreshCoordinator<Key, T>(
  refresh: (key: Key) => Promise<T>,
  options: KeyedRefreshOptions<T>,
) {
  const entries = new Map<
    Key,
    {
      expiresAt: number;
      promise: Promise<T>;
    }
  >();

  return function refreshOnce(key: Key) {
    const current = entries.get(key);

    if (current && current.expiresAt > Date.now()) {
      return current.promise;
    }

    if (current) {
      entries.delete(key);
    }

    const promise = Promise.resolve().then(() => refresh(key));
    const entry = {
      expiresAt: Number.POSITIVE_INFINITY,
      promise,
    };
    entries.set(key, entry);

    void promise.then(
      (value) => {
        if (!options.shouldReuse(value)) {
          if (entries.get(key) === entry) {
            entries.delete(key);
          }
          return;
        }

        entry.expiresAt = Date.now() + options.reuseForMs;
        setTimeout(() => {
          if (entries.get(key) === entry) {
            entries.delete(key);
          }
        }, options.reuseForMs);
      },
      () => {
        if (entries.get(key) === entry) {
          entries.delete(key);
        }
      },
    );

    return promise;
  };
}
