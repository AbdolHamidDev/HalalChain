"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TranslationKey, TranslationOptions } from "./types";
import {
  changeLanguage,
  getCurrentLanguage,
  loadLocale,
  t as translate,
} from "./index";
import { DEFAULT_LOCALE, LANGUAGE_COOKIE_NAME, SUPPORTED_LOCALES } from "./config";

// ─── Context ──────────────────────────────────────────────────────

export interface I18nContextValue {
  /** Current locale code (e.g. "en", "vi") */
  locale: string;
  /** Translation function — same API as the module-level `t()` */
  t: (key: TranslationKey | (string & {}), options?: TranslationOptions) => string;
  /** Switch language and persist the choice */
  setLanguage: (locale: string) => Promise<void>;
  /** Available locales */
  locales: readonly string[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Cookie helpers ────────────────────────────────────────────────

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match?.[2];
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── Provider ──────────────────────────────────────────────────────

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocaleState] = useState<string>(() => {
    // Priority: cookie → initialLocale (from server) → default
    const cookie = getCookie(LANGUAGE_COOKIE_NAME);
    if (cookie && (SUPPORTED_LOCALES as readonly string[]).includes(cookie)) {
      return cookie;
    }
    if (initialLocale && (SUPPORTED_LOCALES as readonly string[]).includes(initialLocale)) {
      return initialLocale;
    }
    return DEFAULT_LOCALE;
  });

  // Initialize the locale data and sync the global currentLocale
  useEffect(() => {
    changeLanguage(locale);
  }, [locale]);

  const setLanguage = useCallback(async (newLocale: string) => {
    if (!(SUPPORTED_LOCALES as readonly string[]).includes(newLocale)) return;
    await changeLanguage(newLocale);
    setCookie(LANGUAGE_COOKIE_NAME, newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: TranslationKey | (string & {}), options?: TranslationOptions) => {
      return translate(key as TranslationKey, { ...options, locale });
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, t, setLanguage, locales: SUPPORTED_LOCALES }),
    [locale, t, setLanguage]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

// ─── Re-export for convenience ─────────────────────────────────────
export { useI18n as useTranslation };