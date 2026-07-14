import assert from "node:assert/strict";
import test from "node:test";

import { createRefreshCoordinator } from "./refresh-coordinator.ts";
import { validateLoginFields } from "./validation.ts";
import {
  hasJsonContentTypeHeader,
  isSameOriginHeaders,
} from "../../lib/auth/request-safety-core.ts";

test("validateLoginFields normalizes valid credentials", () => {
  const result = validateLoginFields({
    email: " Admin@Orion.Local ",
    password: "OrionDev123!",
  });

  assert.equal(result.isValid, true);
  assert.equal(result.values.email, "admin@orion.local");
  assert.equal(result.values.password, "OrionDev123!");
  assert.deepEqual(result.errors, {});
});

test("validateLoginFields rejects invalid input safely", () => {
  const result = validateLoginFields({
    email: "not-an-email",
    password: "",
  });

  assert.equal(result.isValid, false);
  assert.equal(result.errors.email, "Informe um e-mail valido.");
  assert.equal(result.errors.password, "Informe a senha.");
});

test("createRefreshCoordinator reuses a refresh already in flight", async () => {
  let calls = 0;
  const refresh = createRefreshCoordinator(async () => {
    calls += 1;
    await new Promise((resolve) => {
      setTimeout(resolve, 5);
    });
    return "new-session";
  });

  const [first, second] = await Promise.all([refresh(), refresh()]);

  assert.equal(first, "new-session");
  assert.equal(second, "new-session");
  assert.equal(calls, 1);
});

test("isSameOriginHeaders rejects cross-site POST metadata", () => {
  const headers = new Headers({
    origin: "https://evil.example",
    "sec-fetch-site": "cross-site",
  });

  assert.equal(isSameOriginHeaders(headers, "https://orion.example"), false);
});

test("hasJsonContentType accepts application/json requests", () => {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
  });

  assert.equal(hasJsonContentTypeHeader(headers), true);
});
