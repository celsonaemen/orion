import assert from "node:assert/strict";
import test from "node:test";

import { apiRequest } from "./api.ts";
import {
  canChangeUserStatus,
  canCreateSectors,
  canCreateUsers,
  canReadUsers,
} from "./permissions.ts";
import { buildSectorsQuery, buildUsersQuery } from "./query.ts";
import {
  createSectorPayload,
  createUserPayload,
  normalizeEmail,
  normalizeSlug,
  updateSectorPayload,
  updateUserPayload,
  validateCreateUserForm,
  validateSectorForm,
} from "./validation.ts";

const adminPermissions = {
  permissions: ["users.read", "users.create", "users.change-status", "sectors.create"],
};

test("admin permission helpers expose allowed actions", () => {
  assert.equal(canReadUsers(adminPermissions), true);
  assert.equal(canCreateUsers(adminPermissions), true);
  assert.equal(canChangeUserStatus(adminPermissions), true);
  assert.equal(canCreateSectors(adminPermissions), true);
  assert.equal(canCreateUsers({ permissions: ["users.read"] }), false);
});

test("user filters are normalized into safe query parameters", () => {
  const query = buildUsersQuery({
    page: 2,
    pageSize: 10,
    roleId: "role-1",
    search: "  Admin ",
    status: "ACTIVE",
  });

  assert.equal(query, "page=2&pageSize=10&search=Admin&status=ACTIVE&roleId=role-1");
});

test("sector filters include ordering and optional active state", () => {
  const query = buildSectorsQuery({
    isActive: false,
    page: 1,
    pageSize: 20,
    search: "Fiscal",
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  assert.equal(
    query,
    "page=1&pageSize=20&search=Fiscal&isActive=false&sortBy=createdAt&sortDirection=desc",
  );
});

test("user form validation normalizes e-mail and rejects weak input", () => {
  const valid = validateCreateUserForm({
    email: " New.User@Orion.Local ",
    name: " Usuario Teste ",
    password: "OrionDev123!",
    roleId: "role-1",
    sectorId: "",
    status: "ACTIVE",
  });
  const invalid = validateCreateUserForm({
    email: "invalid",
    name: "A",
    password: "short",
    roleId: "",
    sectorId: "",
    status: "ACTIVE",
  });

  assert.equal(valid.isValid, true);
  assert.equal(valid.values.email, "new.user@orion.local");
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.errors.email, "Informe um e-mail valido.");
});

test("user payloads include only allowed fields", () => {
  const createPayload = createUserPayload({
    email: " Person@Orion.Local ",
    name: " Pessoa ",
    password: "OrionDev123!",
    roleId: "role-1",
    sectorId: "",
    status: "ACTIVE",
  });
  const updatePayload = updateUserPayload({
    email: " Person@Orion.Local ",
    name: " Pessoa ",
    roleId: "role-1",
    sectorId: "",
    status: "INACTIVE",
  });

  assert.deepEqual(Object.keys(createPayload).sort(), [
    "email",
    "name",
    "password",
    "roleId",
    "sectorId",
    "status",
  ]);
  assert.equal("passwordHash" in createPayload, false);
  assert.equal("password" in updatePayload, false);
  assert.equal(updatePayload.sectorId, null);
});

test("sector validation normalizes slug and payloads avoid slug updates", () => {
  const valid = validateSectorForm({
    description: " Area fiscal ",
    isActive: true,
    name: " Área Fiscal ",
    slug: "",
  });
  const createPayload = createSectorPayload(valid.values);
  const updatePayload = updateSectorPayload(valid.values);

  assert.equal(valid.isValid, true);
  assert.equal(normalizeEmail(" Admin@Orion.Local "), "admin@orion.local");
  assert.equal(normalizeSlug("Área Fiscal"), "area-fiscal");
  assert.equal(createPayload.slug, "area-fiscal");
  assert.equal("slug" in updatePayload, false);
});

test("apiRequest converts network failures into a controlled result", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;

  try {
    const result = await apiRequest("/api/users");

    assert.equal(result.ok, false);
    assert.equal(result.status, 503);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
