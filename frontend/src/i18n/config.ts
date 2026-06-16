export const SUPPORTED_LOCALES = ["en", "vi", "ms", "id", "ar", "th"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  ms: "Bahasa Melayu",
  id: "Bahasa Indonesia",
  ar: "العربية",
  th: "ไทย",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  vi: "🇻🇳",
  ms: "🇲🇾",
  id: "🇮🇩",
  ar: "🇸🇦",
  th: "🇹🇭",
};

export const LOCALE_DIRECTIONS: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  vi: "ltr",
  ms: "ltr",
  id: "ltr",
  ar: "rtl",
  th: "ltr",
};

export const LANGUAGE_COOKIE_NAME = "halalchain_lang";

export const LOCALE_NAMESPACES = [
  "common",
  "navigation",
  "auth",
  "landing",
  "dashboard",
  "products",
  "suppliers",
  "inventory",
  "warehouses",
  "purchase-orders",
  "shipments",
  "certificates",
  "reports",
  "settings",
  "notifications",
  "traceability",
] as const;

export type Namespace = (typeof LOCALE_NAMESPACES)[number];