/**
 * i18n Public API
 *
 * This is the main entry point for all translation needs.
 *
 * Usage (Client Components):
 *   const { t } = useTranslation();
 *   t("common.save")  // → "Save"
 *
 * Usage (Server Components):
 *   import { t } from "@/i18n";
 *   t("common.save", { locale: "en" })
 */

import type { TranslationKey, TranslationOptions } from "./types";
import en from "./locales/en.json";

// ─── Loaded locale cache ───────────────────────────────────────────
// Loaded on demand to avoid importing all locales at build time.
const loadedLocales: Record<string, Record<string, unknown>> = {
  en: en as unknown as Record<string, unknown>,
};

let currentLocale = "en";

// ─── Deep get helper ────────────────────────────────────────────────
function deepGet(
  obj: Record<string, unknown>,
  path: string
): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

// ─── Interpolation helper ──────────────────────────────────────────
function interpolate(
  text: string,
  values?: Record<string, string | number>
): string {
  if (!values) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = values[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

// ─── Translation function ──────────────────────────────────────────
export function t(
  key: TranslationKey | (string & {}),
  options?: TranslationOptions & { locale?: string }
): string {
  const locale = options?.locale ?? currentLocale;
  const dict = loadedLocales[locale];

  // Try the requested locale first
  let text = dict ? deepGet(dict, key) : undefined;

  // Fallback to English
  if (text === undefined && locale !== "en") {
    text = deepGet(loadedLocales["en"] as Record<string, unknown>, key);
  }

  // Final fallback: return the key itself
  if (text === undefined) {
    return options?.fallback ?? key;
  }

  // Interpolation
  text = interpolate(text, options?.values);

  return text;
}

// ─── Load a locale dynamically ─────────────────────────────────────
export async function loadLocale(locale: string): Promise<void> {
  if (loadedLocales[locale]) return;

  try {
    const data = await import(`./locales/${locale}.json`);
    loadedLocales[locale] = data.default as Record<string, unknown>;
  } catch {
    // If loading fails, fallback to English
    console.warn(`[i18n] Failed to load locale: ${locale}`);
  }
}

// ─── Change current language ───────────────────────────────────────
export async function changeLanguage(locale: string): Promise<void> {
  await loadLocale(locale);
  currentLocale = locale;
}

// ─── Get current language ─────────────────────────────────────────
export function getCurrentLanguage(): string {
  return currentLocale;
}

// ─── Get all loaded locales ────────────────────────────────────────
export function getLoadedLocales(): string[] {
  return Object.keys(loadedLocales);
}

// ─── Preload a locale (for SSR / Server Components) ───────────────
export function setLocale(locale: string): void {
  if (loadedLocales[locale]) {
    currentLocale = locale;
  }
}