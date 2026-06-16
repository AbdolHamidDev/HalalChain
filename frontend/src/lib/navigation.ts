import {
  Award,
  BarChart3,
  Building2,
  LayoutDashboard,
  LineChart,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import type { TranslationKey } from "@/i18n/types";

export interface NavItem {
  href: string;
  label: string;
  /** Translation key for i18n — maps to navigation.{key} */
  translationKey: TranslationKey;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavGroup {
  /** Translation key for the group label */
  groupLabel: TranslationKey;
  /** Visible label fallback */
  groupFallback: string;
  items: NavItem[];
}

/**
 * Navigation items organised into SaaS-style groups.
 * Each group is rendered under a section heading in the sidebar.
 */
export const navGroups: NavGroup[] = [
  {
    groupLabel: "sidebar.groups.overview",
    groupFallback: "Overview",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        translationKey: "navigation.dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },
  {
    groupLabel: "sidebar.groups.supplyChain",
    groupFallback: "Supply Chain",
    items: [
      {
        href: "/dashboard/suppliers",
        label: "Suppliers",
        translationKey: "navigation.suppliers",
        icon: Users,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/dashboard/products",
        label: "Products",
        translationKey: "navigation.products",
        icon: Package,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/dashboard/warehouses",
        label: "Warehouses",
        translationKey: "navigation.warehouses",
        icon: Building2,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    groupLabel: "sidebar.groups.operations",
    groupFallback: "Operations",
    items: [
      {
        href: "/dashboard/inventory",
        label: "Inventory",
        translationKey: "navigation.inventory",
        icon: Warehouse,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
      {
        href: "/dashboard/purchase-orders",
        label: "Purchase Orders",
        translationKey: "navigation.purchaseOrders",
        icon: ShoppingCart,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/dashboard/shipments",
        label: "Shipments",
        translationKey: "navigation.shipments",
        icon: Truck,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/dashboard/certificates",
        label: "Certificates",
        translationKey: "navigation.certificates",
        icon: Award,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    groupLabel: "sidebar.groups.insights",
    groupFallback: "Insights",
    items: [
      {
        href: "/dashboard/reports",
        label: "Reports",
        translationKey: "navigation.reports",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        href: "/dashboard/analytics",
        label: "Analytics",
        translationKey: "navigation.analytics",
        icon: LineChart,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    groupLabel: "sidebar.groups.administration",
    groupFallback: "Administration",
    items: [
      {
        href: "/dashboard/users",
        label: "User Management",
        translationKey: "navigation.userManagement",
        icon: UserCheck,
        roles: ["ADMIN"],
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        translationKey: "navigation.settings",
        icon: Settings,
        roles: ["ADMIN", "MANAGER", "STAFF"],
      },
    ],
  },
];

/**
 * Flatten all nav items across every group (for consumers that don't
 * need grouping, e.g. breadcrumbs).
 */
export const navItems: NavItem[] = navGroups.flatMap((g) => g.items);

/**
 * Flatten groups back into a simple list filtered by role (used for
 * consumers that don't need grouping).
 */
export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}

/**
 * Return only groups that have at least one item visible for the given role.
 */
export function getNavGroupsForRole(role: UserRole): NavGroup[] {
  return navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);
}