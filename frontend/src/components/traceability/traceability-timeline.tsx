import { format } from "date-fns";
import {
  Building2,
  ShieldCheck,
  Package,
  ClipboardList,
  Truck,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TimelineEventType =
  | "SUPPLIER"
  | "CERTIFICATE"
  | "PRODUCT"
  | "PURCHASE_ORDER"
  | "SHIPMENT"
  | "INVENTORY";

export interface TimelineEvent {
  type: TimelineEventType;
  date: string; // ISO 8601
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

interface TraceabilityTimelineProps {
  timeline: TimelineEvent[];
}

// ─── Icon & Color mapping ─────────────────────────────────────────────────────

interface EventConfig {
  icon: LucideIcon;
  /** Tailwind text-color class for the icon */
  iconColor: string;
  /** Tailwind bg-color class for the icon container */
  bgColor: string;
  /** Tailwind border-color class for the connector line */
  borderColor: string;
}

const EVENT_CONFIG: Record<TimelineEventType, EventConfig> = {
  SUPPLIER: {
    icon: Building2,
    iconColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  CERTIFICATE: {
    icon: ShieldCheck,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  PRODUCT: {
    icon: Package,
    iconColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  PURCHASE_ORDER: {
    icon: ClipboardList,
    iconColor: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  SHIPMENT: {
    icon: Truck,
    iconColor: "text-yellow-600 dark:text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  INVENTORY: {
    icon: Warehouse,
    iconColor: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-100 dark:bg-gray-800",
    borderColor: "border-gray-200 dark:border-gray-700",
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatEventDate(isoDate: string): string {
  try {
    return format(new Date(isoDate), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return isoDate;
  }
}

// ─── Sub-component ────────────────────────────────────────────────────────────

interface TimelineRowProps {
  event: TimelineEvent;
  isLast: boolean;
}

function TimelineRow({ event, isLast }: TimelineRowProps) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <li className="relative flex gap-4">
      {/* Vertical connector line */}
      {!isLast && (
        <span
          className="absolute left-5 top-10 bottom-0 w-px bg-border"
          aria-hidden="true"
        />
      )}

      {/* Icon bubble */}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${config.bgColor} ${config.borderColor}`}
        aria-hidden="true"
      >
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
      </div>

      {/* Event content */}
      <div className="flex-1 pb-8">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold leading-snug text-foreground">
            {event.title}
          </p>
          <p className="text-xs text-muted-foreground">{event.description}</p>
          <time
            dateTime={event.date}
            className="mt-1 text-[11px] text-muted-foreground/70"
          >
            {formatEventDate(event.date)}
          </time>
        </div>
      </div>
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TraceabilityTimeline({ timeline }: TraceabilityTimelineProps) {
  if (timeline.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No traceability events found for this product.
      </p>
    );
  }

  return (
    <ol aria-label="Traceability timeline" className="list-none space-y-0 p-0">
      {timeline.map((event, index) => (
        <TimelineRow
          key={`${event.type}-${event.date}-${index}`}
          event={event}
          isLast={index === timeline.length - 1}
        />
      ))}
    </ol>
  );
}
