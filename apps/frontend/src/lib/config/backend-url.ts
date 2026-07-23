import "server-only";

const DEVELOPMENT_BACKEND_URL = "http://localhost:3001";

export function getBackendBaseUrl() {
  const configuredUrl = process.env.BACKEND_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BACKEND_URL is not configured.");
    }

    return DEVELOPMENT_BACKEND_URL;
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("BACKEND_URL must be a valid absolute URL.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("BACKEND_URL must use HTTP or HTTPS.");
  }

  return configuredUrl.replace(/\/+$/, "");
}
