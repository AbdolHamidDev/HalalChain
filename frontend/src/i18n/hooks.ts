/**
 * i18n Hooks
 *
 * Re-exports from provider.tsx for convenient importing:
 *
 *   import { useTranslation } from "@/i18n/hooks";
 *
 * Instead of:
 *   import { useTranslation } from "@/i18n/provider";
 */

export { useTranslation, useI18n } from "./provider";
export type { I18nContextValue } from "./provider";
