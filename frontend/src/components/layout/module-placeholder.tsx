import { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  features: string[];
}

export function ModulePlaceholder({
  icon: Icon,
  title,
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="mt-8 rounded-xl bg-card">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary)]">
            <Icon className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div>
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Sprint 2 · CRUD & workflow
            </p>
          </div>
        </div>
      </div>
      <ul className="grid gap-3 p-6 sm:grid-cols-2">
        {features.map((feature) => (
          <li
            key={feature}
            className="rounded-lg bg-[var(--color-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]"
          >
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
