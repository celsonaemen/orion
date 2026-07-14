"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getNextThemePreference,
  isThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/features/app-shell/theme";

function getSystemPreference(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = resolveThemePreference(preference, getSystemPreference());
  document.documentElement.dataset.theme = resolved;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
    const initialPreference = isThemePreference(storedPreference) ? storedPreference : "system";
    setPreference(initialPreference);
    applyTheme(initialPreference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if ((window.localStorage.getItem(THEME_STORAGE_KEY) ?? "system") === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, []);

  const Icon = preference === "light" ? Sun : preference === "dark" ? Moon : Monitor;

  return (
    <button
      aria-label={`Alternar tema. Preferencia atual: ${preference}`}
      className="inline-flex h-10 w-10 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none transition hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
      onClick={() => {
        const nextPreference = getNextThemePreference(preference);
        window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        setPreference(nextPreference);
        applyTheme(nextPreference);
      }}
      type="button"
      title="Tema"
    >
      <Icon aria-hidden="true" size={18} />
    </button>
  );
}
