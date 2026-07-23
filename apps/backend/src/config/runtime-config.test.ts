import { describe, expect, it } from "vitest";

import { getAllowedFrontendOrigins, readRuntimeConfig } from "./runtime-config";

const productionEnvironment = {
  BACKEND_PORT: "3001",
  DATABASE_URL: "postgresql://orion:placeholder@postgres:5432/orion",
  FRONTEND_ORIGIN: "https://orion.example.com",
  JWT_REFRESH_SECRET: "refresh-secret-with-at-least-32-characters",
  JWT_SECRET: "access-secret-with-at-least-32-characters",
  NODE_ENV: "production",
} satisfies NodeJS.ProcessEnv;

describe("runtime configuration", () => {
  it("accepts a complete production environment", () => {
    expect(readRuntimeConfig(productionEnvironment)).toEqual({ host: "0.0.0.0", port: 3001 });
    expect(getAllowedFrontendOrigins(productionEnvironment)).toEqual([
      "https://orion.example.com",
    ]);
  });

  it("rejects missing production origins", () => {
    expect(() =>
      readRuntimeConfig({ ...productionEnvironment, FRONTEND_ORIGIN: undefined }),
    ).toThrow("FRONTEND_ORIGIN");
  });

  it("rejects insecure production origins", () => {
    expect(() =>
      readRuntimeConfig({ ...productionEnvironment, FRONTEND_ORIGIN: "http://orion.example.com" }),
    ).toThrow("HTTPS");
  });

  it("rejects equal signing secrets", () => {
    expect(() =>
      readRuntimeConfig({
        ...productionEnvironment,
        JWT_REFRESH_SECRET: productionEnvironment.JWT_SECRET,
      }),
    ).toThrow("must be different");
  });
});
