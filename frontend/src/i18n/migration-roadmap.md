# Phase 5 — Large Scale Migration Roadmap

## Migration Order

Each group should be migrated one at a time. After each module:

1. Run `npx tsc --noEmit` (type check)
2. Verify no missing translation keys
3. Run `next build` (build check)

---

## Batch 1: Auth (login-form.tsx, register-form.tsx, auth pages)

**Files:**
- `frontend/src/components/auth/login-form.tsx`
- `frontend/src/components/auth/register-form.tsx`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`

**Migration:**
- Replace all hardcoded labels, validation messages, button text, and links
- Use `auth.*` and `common.*` namespaces

**Translation keys used:**
```
auth.signIn, auth.signingIn, auth.email, auth.password, ...
```

---

## Batch 2: User Menu (user-menu.tsx)

**Files:**
- `frontend/src/components/layout/user-menu.tsx`
- `frontend/src/app/settings/*`

**Migration:**
- Dropdown items (My Profile, Account Settings, Change Password, Sign Out)
- Role badge labels → use `userMenu.roles.*`
- Replace roleLabels Record with `t("userMenu.roles." + role.toLowerCase())`

**Translation keys used:**
```
userMenu.myProfile, userMenu.accountSettings, userMenu.changePassword, userMenu.signOut, userMenu.roles.*
```

---

## Batch 3: Landing Page (hero.tsx, features.tsx, workflow.tsx, stats.tsx, tech-stack.tsx, cta.tsx, footer.tsx, screenshots.tsx, architecture.tsx, verification-demo.tsx)

**Files:**
- All files in `frontend/src/components/landing/`
- `frontend/src/app/page.tsx`

**Migration:**
- Hero section badge, title, subtitle, buttons, dashboard preview mockup text
- Features section title, subtitle, all 6 feature cards
- Workflow section title, subtitle, all 6 steps, explanation paragraphs
- Stats section title, subtitle, all 6 stat labels
- CTA section title, subtitle, buttons
- Footer all links, copyright, description
- Other sections as available

**Translation keys used:**
```
landing.hero.*, landing.features.*, landing.workflow.*, landing.stats.*, landing.cta.*, landing.footer.*
```

---

## Batch 4: Notifications (notification-dropdown.tsx)

**Files:**
- `frontend/src/components/layout/notification-dropdown.tsx`

**Migration:**
- Title, unread count, mark all as read button, empty state
- Type labels (LOW_STOCK, CERTIFICATE_EXPIRING, etc.)

**Translation keys used:**
```
notifications.title, notifications.unread, notifications.markAllRead, notifications.noNotifications, notifications.types.*
```

---

## Batch 5: Dashboard (dashboard-content.tsx, kpi-cards.tsx, activity-feed.tsx, page-header.tsx)

**Files:**
- `frontend/src/components/dashboard/dashboard-content.tsx`
- `frontend/src/components/dashboard/kpi-cards.tsx`
- `frontend/src/components/dashboard/charts.tsx`
- `frontend/src/components/dashboard/activity-feed.tsx`
- `frontend/src/components/layout/page-header.tsx`

**Translation keys used:**
```
dashboard.*, common.*
```

---

## Batch 6: Products Module (products-module.tsx)

**Files:**
- `frontend/src/components/modules/products-module.tsx`
- `frontend/src/app/dashboard/products/*`

**Migration:**
- Page title, description
- Add/Edit/Delete product buttons and dialogs
- Form labels, placeholders, validation
- Table headers
- Empty state
- Toast messages
- QR dialog

**Translation keys used:**
```
products.*, common.*
```

---

## Batch 7: Suppliers Module (suppliers-module.tsx)

**Files:**
- `frontend/src/components/modules/suppliers-module.tsx`
- `frontend/src/app/dashboard/suppliers/*`

**Translation keys used:**
```
suppliers.*, common.*
```

---

## Batch 8: Inventory Module (inventory-module.tsx)

**Files:**
- `frontend/src/components/modules/inventory-module.tsx`
- `frontend/src/app/dashboard/inventory/*`

**Translation keys used:**
```
inventory.*, common.*
```

---

## Batch 9: Warehouses Module (warehouses-module.tsx)

**Files:**
- `frontend/src/components/modules/warehouses-module.tsx`
- `frontend/src/app/dashboard/warehouses/*`

**Translation keys used:**
```
warehouses.*, common.*
```

---

## Batch 10: Purchase Orders Module (purchase-orders-module.tsx)

**Files:**
- `frontend/src/components/modules/purchase-orders-module.tsx`
- `frontend/src/app/dashboard/purchase-orders/*`

**Translation keys used:**
```
purchase-orders.*, common.*
```

---

## Batch 11: Shipments Module (shipments-module.tsx)

**Files:**
- `frontend/src/components/modules/shipments-module.tsx`
- `frontend/src/app/dashboard/shipments/*`

**Translation keys used:**
```
shipments.*, common.*
```

---

## Batch 12: Certificates Module (certificates-module.tsx)

**Files:**
- `frontend/src/components/modules/certificates-module.tsx`
- `frontend/src/app/dashboard/certificates/*`

**Translation keys used:**
```
certificates.*, common.*
```

---

## Batch 13: Reports Module (reports-module.tsx)

**Files:**
- `frontend/src/components/modules/reports-module.tsx`
- `frontend/src/app/dashboard/reports/*`

**Translation keys used:**
```
reports.*, common.*
```

---

## Batch 14: Settings (all settings files)

**Files:**
- `frontend/src/components/settings/*`
- `frontend/src/app/settings/*`

**Translation keys used:**
```
settings.*, common.*
```

---

## Batch 15: Shared Components (state-blocks.tsx)

**Files:**
- `frontend/src/components/shared/state-blocks.tsx`

**Migration:**
- LoadingState text
- ErrorState text (retry button)
- EmptyState configs (10 variants with title + description + ctaLabel)

**Translation keys used:**
```
common.loading, common.retry, products.empty.*, suppliers.empty.*, etc.
```

---

## Batch 16: Other Pages (demo, traceability, accept-invite, settings layouts)

**Files:**
- `frontend/src/app/demo/page.tsx`
- `frontend/src/app/traceability/*`
- `frontend/src/app/accept-invite/*`
- `frontend/src/components/traceability/*`
- `frontend/src/app/settings/layout.tsx`

**Translation keys used:**
```
demo.*, traceability.*, acceptInvite.*, settings.navigation.*
```

---

## Verification Checklist (per batch)

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All hardcoded strings in the batch are replaced with `t()` calls
- [ ] No new translation keys added without corresponding entry in `en.json` and `vi.json`
- [ ] Interpolation placeholders `{{key}}` match between translations
- [ ] Fallback keys work (missing key → returns key path)
- [ ] Dynamic/mock data labels not translated (e.g., product names, supplier names)

---

## Adding a New Language

1. Create `src/i18n/locales/{lang}.json`
2. Add to `SUPPORTED_LOCALES` in `config.ts`
3. Add to `LOCALE_LABELS` in `config.ts`
4. Add to `LOCALE_DIRECTIONS` in `config.ts` (if RTL)

No other code changes needed.