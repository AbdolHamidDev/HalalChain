import {
  Award,
  BarChart3,
  Building2,
  LayoutDashboard,
  LineChart,
  Package,
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

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    translationKey: "navigation.dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
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
    href: "/dashboard/inventory",
    label: "Inventory",
    translationKey: "navigation.inventory",
    icon: Warehouse,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/warehouses",
    label: "Warehouses",
    translationKey: "navigation.warehouses",
    icon: Building2,
    roles: ["ADMIN", "MANAGER"],
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
  {
    href: "/dashboard/users",
    label: "User Management",
    translationKey: "navigation.userManagement",
    icon: UserCheck,
    roles: ["ADMIN"],
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
