"use client";

import { useQuery } from "@tanstack/react-query";

interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

async function fetchActivity(): Promise<{ activities: ActivityItem[] }> {
  const res = await fetch("/api/dashboard/activity");
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json();
}

export function ActivityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchActivity,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (!data?.activities.length) {
    return (
      <p className="text-sm text-muted-foreground">No recent activity.</p>
    );
  }

  return (
    <div className="space-y-2">
      {data.activities.map((activity) => (
        <p key={activity.id} className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{activity.userName}</span>
          {" "}{activity.action.toLowerCase()}{" "}
          <span className="text-primary">{activity.entityType}</span>
        </p>
      ))}
    </div>
  );
}
