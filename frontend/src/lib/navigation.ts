import {
  Award,
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  UserCheck,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/api";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/suppliers",
    label: "Suppliers",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/products",
    label: "Products",
    icon: Package,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/inventory",
    label: "Inventory",
    icon: Warehouse,
    roles: ["ADMIN", "MANAGER", "STAFF"],
  },
  {
    href: "/dashboard/purchase-orders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/shipments",
    label: "Shipments",
    icon: Truck,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/certificates",
    label: "Certificates",
    icon: Award,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/users",
    label: "User Management",
    icon: UserCheck,
    roles: ["ADMIN"],
  },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return navItems.filter((item) => item.roles.includes(role));
}
