import assert from "node:assert/strict";
import test from "node:test";

import {
  findNavigationItem,
  flattenNavigationItems,
  isNavigationItemActive,
  navigationItems,
} from "./navigation.ts";
import { homeRoute, protectedRoutes } from "./routes.ts";
import { getNextThemePreference, resolveThemePreference } from "./theme.ts";
import { getUserInitials, getUserSectorName } from "./user-display.ts";

const user = {
  email: "admin@orion.local",
  name: "Admin Orion",
  sector: {
    id: "sector-1",
    name: "Gerencia",
    slug: "gerencia",
  },
};

test("navigation exposes expected app shell items", () => {
  const labels = navigationItems.map((item) => item.label);

  assert.deepEqual(labels, [
    "Dashboard",
    "Comunicacao",
    "Empresas",
    "Usuarios",
    "Setores",
    "Notificacoes",
    "Administracao",
    "Configuracoes",
  ]);
});

test("navigation marks active dashboard and communication routes", () => {
  const dashboard = navigationItems[0];
  const communication = navigationItems[1];

  assert.ok(dashboard);
  assert.ok(communication);
  assert.equal(isNavigationItemActive(dashboard, "/dashboard"), true);
  assert.equal(isNavigationItemActive(dashboard, "/dashboard/extra"), false);
  assert.equal(isNavigationItemActive(communication, "/chat/groups"), true);
  assert.equal(findNavigationItem("/chat/private")?.label, "Comunicacao");
});

test("navigation prepares permissions and coming soon placeholders", () => {
  const flatItems = flattenNavigationItems();
  const protectedRouteSet = new Set(protectedRoutes);
  const chat = flatItems.find((item) => item.href === "/chat" && item.label === "Comunicacao");

  assert.equal(
    flatItems.some((item) => item.permission === "users.read"),
    true,
  );
  assert.equal(
    flatItems.some((item) => item.soon),
    true,
  );
  assert.equal(chat?.permission, undefined);
  assert.equal(chat?.soon, undefined);
  assert.equal(protectedRouteSet.has("/dashboard"), true);
  assert.equal(protectedRouteSet.has("/settings"), true);
});

test("root entry targets the authenticated dashboard", () => {
  assert.equal(homeRoute, "/dashboard");
  assert.equal(protectedRoutes.includes(homeRoute), true);
});

test("user display helpers return initials and sector safely", () => {
  assert.equal(getUserInitials(user), "AO");
  assert.equal(getUserSectorName(user), "Gerencia");
  assert.equal(getUserSectorName({ sector: null }), "Sem setor");
});

test("theme preference resolves system and cycles options", () => {
  assert.equal(resolveThemePreference("system", "dark"), "dark");
  assert.equal(resolveThemePreference("light", "dark"), "light");
  assert.equal(getNextThemePreference("light"), "dark");
  assert.equal(getNextThemePreference("dark"), "system");
  assert.equal(getNextThemePreference("system"), "light");
});
