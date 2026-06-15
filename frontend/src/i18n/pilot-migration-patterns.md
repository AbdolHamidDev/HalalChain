# Pilot Migration Patterns

## Pattern 1: Client Component with useTranslation

```tsx
"use client";
import { useTranslation } from "@/i18n/hooks";

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Button>{t("common.save")}</Button>
  );
}
```

## Pattern 2: Template literal replacements

```tsx
// Before
<span>Inventory ({count})</span>

// After
<span>{t("inventory.pageTitle")} ({count})</span>
```

## Pattern 3: Placeholder/interpolation

```tsx
// Before
toast.success(`${name} has been updated.`);

// After
toast.success(t("products.productUpdated", { values: { name } }));
```

## Pattern 4: Nav items with translations (navigation.ts)

Before:
```ts
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
];
```

After:
```ts
// Keep label as English default, but components will use t("navigation.dashboard")
// The label field is used as fallback for SSR/tooltip
```

## Pattern 5: Server Component translations

```tsx
import { t } from "@/i18n";

// In Server Component:
<h1>{t("landing.hero.title", { locale: "en" })}</h1>
```

## Pattern 6: Language switcher

```tsx
import { useTranslation } from "@/i18n/hooks";

function LanguageSwitcher() {
  const { locale, setLanguage, locales } = useTranslation();
  
  return (
    <select value={locale} onChange={(e) => setLanguage(e.target.value)}>
      {locales.map((l) => (
        <option key={l} value={l}>{l === "en" ? "English" : "Tiếng Việt"}</option>
      ))}
    </select>
  );
}