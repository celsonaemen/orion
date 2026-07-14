export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "orion-theme";

export function resolveThemePreference(
  preference: ThemePreference,
  systemPreference: ResolvedTheme,
): ResolvedTheme {
  return preference === "system" ? systemPreference : preference;
}

export function getNextThemePreference(preference: ThemePreference): ThemePreference {
  if (preference === "light") {
    return "dark";
  }

  if (preference === "dark") {
    return "system";
  }

  return "light";
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}
