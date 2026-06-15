import type en from "./locales/en.json";

/**
 * Recursive type that flattens a nested object into dot-notation keys.
 * E.g. { common: { save: "Save", cancel: "Cancel" } }
 * → "common.save" | "common.cancel"
 */
type DotNotation<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends object
      ? DotNotation<T[K], `${Prefix}${K}.`>
      : `${Prefix}${K}`;
}[keyof T & string];

/**
 * A TranslationKey is any dot-notation path into the English JSON.
 * Example: "common.save" | "navigation.dashboard" | "landing.hero.title"
 */
export type TranslationKey = DotNotation<typeof en>;

/**
 * Represents the structure of a single locale's translation file.
 * The full translations object is typed from the English source.
 */
export type Translations = typeof en;

/**
 * Generic dictionary type for storing loaded locale data.
 */
export type LocaleDictionary = Record<string, string | Record<string, unknown>>;

/**
 * Options for the `t()` translation function.
 */
export interface TranslationOptions {
  /** Fallback value if key is missing */
  fallback?: string;
  /** Interpolation values, e.g. { name: "John" } for "Hello {{name}}" */
  values?: Record<string, string | number>;
  /** Plural count */
  count?: number;
}