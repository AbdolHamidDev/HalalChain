# 🎨 Dashboard & Certificates — UI/UX Improvement Proposals

_Analyse et recommandations d'amélioration du design et de l'interaction_
_Mai 2026_

---

## Architecture actuelle (résumé)

### Dashboard
- Layout: Sidebar collapsible + BottomTabBar mobile + DashboardShell
- KPI Cards: Grille 7 colonnes responsive (cartes statiques)
- Charts: 4 Area/Bar charts (Inventory, Orders, Shipment, Certificate) + 1 Donut (Shipment status)
- Operational Widgets: 4 cartes (Compliance, Low Stock, Expiring Certs, Shipment Delays)
- Activity Feed: Liste textuelle simple
- STAFF role: vue simplifiée avec lien vers Inventory

### Certificates
- Vue Table (desktop) + Card list (mobile) responsive
- CRUD via Sheet (slide-in panel)
- Status badges: VALID / EXPIRING_SOON / EXPIRED
- Upload zone pour documents PDF
- i18n, queries React Query, animations de page

---

## 1. 🏆 KPI Cards — Améliorations

### 1.1 Mini sparkline dans chaque carte KPI
**Problème**: Les KPIs sont statiques (texte + icône). Aucun indicateur de tendance.

**Solution**:
- Ajouter une mini sparkline (AreaChart miniature sans axes) dans le coin inférieur droit de chaque carte KPI
- Donner un aperçu visuel immédiat de l'évolution (↑ croissance, ↓ baisse)
- Utiliser `recharts` déjà présent dans le projet — pas de nouvelle dépendance

```
┌─────────────────────────┐
│ Active Certificates     │
│ 1,247                   │
│ ╱╲╱╲╱╲╱╲╱╲╱   ↑ +12%  │
└─────────────────────────┘
```

### 1.2 Barre de progression pour Compliance Score
**Problème**: Le score de conformité est affiché comme `87/100` sans contexte visuel.

**Solution**:
- Remplacer le texte par une jauge circulaire (radial progress) en SVG natif
- Couleur dynamique selon le seuil (vert ≥80, ambre ≥50, rouge <50)
- Animation `stroke-dashoffset` au montage pour l'effet "fill-up"

### 1.3 Tooltip enrichi au hover
**Problème**: Aucun détail supplémentaire sans naviguer.

**Solution**:
- Au hover d'un KPI, afficher un tooltip avec breakdown sur 3 mois
- Exemple: "Active Certificates → +23 ce mois-ci, +67 ce trimestre"
- Utiliser le composant `Tooltip` déjà présent dans le projet (sidebar)

---

## 2. 📊 Charts — Améliorations

### 2.1 Période de temps interactive avec slider date-range
**Problème**: Les dates `from`/`to` sont deux inputs date séparés.

**Solution**:
- Remplacer par un Date Range Picker "quick select" moderne
- Presets: "7d", "30d", "90d", "6m", "1y", "Custom"
- Style "pill" / segmented control pour les presets
- Garder les inputs date pour "Custom"

### 2.2 Crosshair synchronisé entre les charts
**Problème**: Chaque chart est indépendant, pas de corrélation visuelle.

**Solution**:
- Ajouter une crosshair verticale synchronisée qui apparaît sur TOUS les charts quand on survole l'un d'eux
- Indicateur de mois/trimestre commun
- Utiliser un `React.Context` partagé pour synchroniser le `activeIndex`

### 2.3 Mode comparaison (vs période précédente)
**Problème**: On voit les données absolues mais pas la tendance relative.

**Solution**:
- Ajouter un toggle "Show % change" dans chaque ChartCard
- Afficher une deuxième série en pointillés/transparente représentant la période précédente
- Badge Δ% dans le header de la carte

### 2.4 Annotations "milestone" sur les charts
**Problème**: Les événements importants (nouveau supplier, audit, etc.) ne sont pas visibles.

**Solution**:
- Ajouter des `ReferenceLine` ou marqueurs (cercles) sur les charts
- Tooltip enrichi avec description de l'événement
- API endpoint fournissant les événements avec date

---

## 3. 🧩 Operational Widgets — Améliorations

### 3.1 Widgets draggable (réorganisation)
**Problème**: Ordre fixe des widgets.

**Solution**:
- Ajouter drag & drop pour réorganiser les 4 widgets
- Persister l'ordre dans `localStorage` ou préférences utilisateur
- Utiliser `@dnd-kit/core` (léger, accessible)

### 3.2 Expand / Collapse pour chaque widget
**Problème**: Les widgets prennent tous la même hauteur, même si vides.

**Solution**:
- Ajouter un état "collapsed" avec compteur de badge
- Exemple: "Compliance Issues (3) [▼]" → expand pour voir les détails
- Amélioration mobile: accordéon vertical

### 3.3 Lien "View all" vers la page dédiée
**Problème**: Pas de lien direct vers la gestion des certificats depuis le widget "Expiring Certificates".

**Solution**:
- Ajouter un lien "View all →" en bas de chaque widget
- Pointer vers `/dashboard/certificates`, `/dashboard/inventory`, etc.

---

## 4. 📜 Certificates Module — Améliorations

### 4.1 Filtres et recherche avancée
**Problème**: Pas de filtres dans la vue actuelle (juste liste brute avec pagination implicite).

**Solution**:
- Barre de filtres en "chips" (pill-shaped filters):
  - Statut: Valid | Expiring Soon | Expired
  - Issuer: JAKIM | MUI | IFANCA | ...
  - Date range pour issue/expiry
- Search bar avec debounce (300ms) sur `certificateNumber` et `supplier.name`
- "Active filters" bar with clear all

### 4.2 Vue calendrier pour expirations
**Problème**: La vue calendrier des expirations n'existe pas.

**Solution**:
- Ajouter un toggle "Calendar View" à côté de la vue Table/Cards
- Utiliser un mini calendrier mensuel avec points de couleur:
  - Vert: cert valide
  - Ambre: expire dans ≤90 jours
  - Rouge: expiré
- Click sur un jour → liste des certificats expirant ce jour-là

### 4.3 Color-coded timeline sur chaque ligne
**Problème**: L'information de risques est noyée dans le texte.

**Solution**:
- Ajouter une mini timeline horizontale dans chaque ligne de tableau:
  ```
  [Issue ●━━━━━━━━━━● Expiry]   → 65% used (35% remaining)
  ```
- Barre de progression avec couleur selon le ratio temps écoulé
- Danger si >80% du temps écoulé

### 4.4 Batch actions (admin)
**Problème**: Actions seulement individuelles (edit/delete un par un).

**Solution**:
- Ajouter checkboxes + "Select All" dans le header du tableau
- Actions batch: "Delete Selected", "Export Selected as CSV", "Mark as Renewed"
- Footer avec compteur "3 selected"

### 4.5 Amélioration du formulaire Sheet
**Problème**: Le formulaire est long, pas de validation en temps réel, pas de preview.

**Solution**:
- **Multi-step wizard** pour la création:
  - Step 1: Supplier & Certificate Info
  - Step 2: Dates & Issuer
  - Step 3: Upload Document & Review
- **Validation en temps réel** des champs (format date, issuer valide, etc.)
- **Preview** du badge de statut qui se met à jour pendant la saisie des dates
- **Auto-complete** amélioré avec recherche fuzzy sur les suppliers

### 4.6 Upload amélioré
**Problème**: Upload zone basique.

**Solution**:
- Drag & drop visuel avec zone highlightée
- Preview du PDF ou image directement dans le sheet
- Progress bar pour l'upload
- Support multiple files (certificate + supporting docs)
- Badge de statut "Document attached ✓"

---

## 5. 🌐 Navigation & Layout — Améliorations

### 5.1 Mobile: Swipe gesture entre pages
**Problème**: Navigation mobile nécessite de cliquer sur le BottomTabBar.

**Solution**:
- Ajouter swipe left/right avec `framer-motion` (ou geste natif)
- Swipe entre Dashboard ↔ Inventory ↔ Products
- Indicateur visuel semi-transparent de la page suivante pendant le swipe

### 5.2 Sidebar: Nested sub-navigation
**Problème**: Pas de sous-menus dans la sidebar.

**Solution**:
- Ajouter chevron expand/collapse pour les sections avec sous-pages
- Exemple: "Supply Chain ▼" → [Suppliers, Purchase Orders, Shipments]
- Animation de hauteur avec `max-height` transition

### 5.3 Breadcrumbs contextuels
**Problème**: Pas de breadcrumbs pour les pages imbriquées.

**Solution**:
- Ajouter breadcrumbs auto-générés sous le PageHeader
- Exemple: Dashboard > Certificates > [Certificate Number]
- Cliquables, avec icône home

### 5.4 Command Palette (⌘K)
**Problème**: La navigation nécessite de cliquer manuellement à travers les menus.

**Solution**:
- Ajouter une command palette type ⌘K / Ctrl+K
- Recherche rapide de pages, actions, certificats, suppliers
- Utiliser `cmdk` (Radix UI) ou implémentation légère

---

## 6. ✨ Micro-interactions & Feedback

### 6.1 Pull-to-refresh mobile
**Problème**: Pas de refresh natif sur mobile.

**Solution**:
- Implémenter pull-to-refresh avec indicateur visuel (spinner déjà défini dans globals.css `.ptr-spinner`)
- Pour les pages Dashboard et Certificates
- Haptic feedback au threshold

### 6.2 Empty states améliorés
**Problème**: Les empty states sont statiques.

**Solution**:
- Ajouter une animation CSS subtile (flottement doux de l'icône)
- CTA "Quick Start" guide pour les nouveaux utilisateurs
- Suggestion contextuelle: "Ajoutez votre premier certificat ou importez depuis un fichier CSV"

### 6.3 Skeleton loading animé
**Problème**: Les skeletons sont simples (blocs gris).

**Solution**:
- Animer avec un shimmer effect (gradient animé)
- Cards skeleton qui ressemblent aux vraies cards (même structure visuelle)
- Utiliser `animate-pulse` amélioré avec un dégradé mobile

### 6.4 Toast avec action undo
**Problème**: Les toasts sont informatifs mais pas actionnables.

**Solution**:
- Ajouter bouton "Undo" dans les toasts de suppression
- Délai de 5 secondes avant exécution réelle (optimistic delete)
- Exemple: "Certificate #HC-001 deleted [Undo ✗]"

---

## 7. 📱 Mobile Responsive — Améliorations

### 7.1 Full-screen sheet sur mobile (déjà partiel)
**Problème**: Le sheet desktop "side panel" devient bottom sheet sur mobile, mais n'utilise pas tout l'écran.

**Solution**:
- Sur mobile (<640px), le sheet devrait être `inset-0` (full screen) plutôt que `max-h-[90vh]`
- Ajouter un drag handle plus visible avec haptic feedback
- Ajouter un "snap point" à 50% pour les formulaires longs

### 7.2 Floating Action Button (FAB)
**Problème**: Le bouton "Add Certificate" est dans le PageHeader, pas facilement accessible sur mobile.

**Solution**:
- Ajouter un FAB en bas à droite (au-dessus du BottomTabBar)
- Animer avec entrée/sortie selon le scroll (appear quand on scroll up, hide quand on scroll down)
- Ombre portée, arrondi, icône "+"

### 7.3 Sticky table headers sur mobile
**Problème**: Le tableau est remplacé par des cards sur mobile, mais les cards n'ont pas d'en-tête sticky.

**Solution**:
- Pour la vue mobile, ajouter un sticky header de section
- Exemple: quand on scroll, voir toujours "Status" et les filtres actifs

---

## 8. 🎯 Quick Wins (Facile à implémenter)

| # | Amélioration | Effort | Impact | Fichier(s) concerné(s) |
|---|-------------|--------|--------|----------------------|
| 1 | **Search bar** dans Certificates | 2h | 🔥🔥🔥 | `certificates-module.tsx` |
| 2 | **Filtres statut** (chips) | 1h | 🔥🔥🔥 | `certificates-module.tsx` |
| 3 | **Barre de progression temps restant** | 2h | 🔥🔥 | `certificates-module.tsx` |
| 4 | **Breadcrumbs** | 1h | 🔥🔥 | Nouveau composant `<Breadcrumbs />` |
| 5 | **Pull-to-refresh mobile** | 3h | 🔥🔥🔥 | `dashboard-content.tsx`, `certificates-module.tsx` |
| 6 | **Empty state animation** | 1h | 🔥🔥 | `state-blocks.tsx` |
| 7 | **"View all" links** dans widgets | 30min | 🔥🔥 | `dashboard-content.tsx` |
| 8 | **Date presets** pour charts | 2h | 🔥🔥🔥 | `dashboard-content.tsx` |
| 9 | **Skeleton shimmer** | 45min | 🔥🔥 | `state-blocks.tsx` |
| 10 | **Toast avec Undo** | 1h30 | 🔥🔥🔥 | `certificates-module.tsx` |

---

## 9. 🚀 Strategic Improvements (High Effort, High Impact)

| # | Amélioration | Effort estimé | Impact |
|---|-------------|---------------|--------|
| 1 | **Calendar View** pour certificats | 2-3 jours | 🔥🔥🔥🔥 |
| 2 | **Command Palette** (⌘K) | 2 jours | 🔥🔥🔥🔥 |
| 3 | **Swipe navigation mobile** | 3 jours | 🔥🔥🔥🔥 |
| 4 | **Batch actions** | 2 jours | 🔥🔥🔥 |
| 5 | **Multi-step wizard** formulaire | 3 jours | 🔥🔥🔥🔥 |
| 6 | **Sparklines dans KPIs** | 1-2 jours | 🔥🔥🔥 |
| 7 | **Crosshair synchronisé** | 2 jours | 🔥🔥🔥 |

---

## 10. 📋 Technical Notes

### Dépendances existantes (réutilisables):
- `recharts` → charts, sparklines
- `lucide-react` → icônes
- `@tanstack/react-query` → data fetching, cache
- `framer-motion` / CSS transitions → animations (CSS natif déjà solide)
- `date-fns` → manipulation de dates (à vérifier si présent)

### Dépendances à ajouter (recommandé):
- `@dnd-kit/core` → drag & drop widgets
- `cmdk` → command palette
- `@radix-ui/react-collapsible` → nested sidebar

### Considérations de performance:
- Les sparklines doivent être virtuelles (limiter à 12-24 points de données max)
- Les filtres/search sur certificats doivent utiliser le `debounce` + server-side filtering
- Le Calendar View doit lazy-load les mois (10 certificats par mois initialement)

---

## Priorité recommandée pour le prochain sprint

1. 🔥 **Search + Filters** (Certificates) — besoin utilisateur immédiat
2. 🔥 **Barre progression temps restant** — valeur ajoutée forte
3. 🔥 **Breadcrumbs** — navigation améliorée, low effort
4. 🔥 **Date presets charts** — UX analytics améliorée
5. 🔥 **Toast Undo** — safety net pour les admins
6. 🔥 **FAB mobile** — accessibilité améliorée
7. 🔥 **Pull-to-refresh** — mobile parity
8. 🚀 **Calendar View** — différenciateur produit
9. 🚀 **Command Palette** — power user feature

---

_Fin du document_