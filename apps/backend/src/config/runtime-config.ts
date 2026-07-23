const DEFAULT_BACKEND_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
const MINIMUM_PRODUCTION_SECRET_LENGTH = 32;

type RuntimeConfig = {
  host: string;
  port: number;
};

function requiredEnvironmentValue(environment: NodeJS.ProcessEnv, name: string) {
  const value = environment[name]?.trim();

  if (!value || value.startsWith("replace_in")) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function positivePort(environment: NodeJS.ProcessEnv) {
  const rawPort = environment.BACKEND_PORT?.trim();
  if (!rawPort) return DEFAULT_BACKEND_PORT;

  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("BACKEND_PORT must be an integer between 1 and 65535.");
  }

  return port;
}

function assertDatabaseUrl(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use the postgres or postgresql protocol.");
  }
}

function assertProductionSecret(name: string, value: string) {
  if (value.length < MINIMUM_PRODUCTION_SECRET_LENGTH) {
    throw new Error(`${name} must contain at least ${MINIMUM_PRODUCTION_SECRET_LENGTH} characters.`);
  }
}

export function getAllowedFrontendOrigins(environment: NodeJS.ProcessEnv = process.env) {
  const rawOrigins = environment.FRONTEND_ORIGIN?.trim();
  const isProduction = environment.NODE_ENV === "production";

  if (!rawOrigins) {
    if (isProduction) throw new Error("FRONTEND_ORIGIN is not configured.");
    return [DEFAULT_FRONTEND_ORIGIN];
  }

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (origins.length === 0) throw new Error("FRONTEND_ORIGIN is not configured.");

  for (const origin of origins) {
    let url: URL;

    try {
      url = new URL(origin);
    } catch {
      throw new Error("FRONTEND_ORIGIN must contain valid absolute origins.");
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error("FRONTEND_ORIGIN must contain valid HTTP origins without paths.");
    }

    if (isProduction && url.protocol !== "https:") {
      throw new Error("FRONTEND_ORIGIN must use HTTPS in production.");
    }
  }

  return origins;
}

export function readRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const databaseUrl = requiredEnvironmentValue(environment, "DATABASE_URL");
  const accessSecret = requiredEnvironmentValue(environment, "JWT_SECRET");
  const refreshSecret = requiredEnvironmentValue(environment, "JWT_REFRESH_SECRET");

  assertDatabaseUrl(databaseUrl);
  getAllowedFrontendOrigins(environment);

  if (environment.NODE_ENV === "production") {
    assertProductionSecret("JWT_SECRET", accessSecret);
    assertProductionSecret("JWT_REFRESH_SECRET", refreshSecret);

    if (accessSecret === refreshSecret) {
      throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different.");
    }
  }

  return {
    host: environment.BACKEND_HOST?.trim() || "0.0.0.0",
    port: positivePort(environment),
  };
}
