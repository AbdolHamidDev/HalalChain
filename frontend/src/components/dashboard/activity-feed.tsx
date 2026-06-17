"use client";

import { useQuery } from "@tanstack/react-query";
import { useActivityStream } from "@/lib/useActivityStream";
import { useState, useEffect } from "react";

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

  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  
  useActivityStream();

  useEffect(() => {
    if (!data?.activities) return;
    
    const currentIds = new Set(data.activities.map(a => a.id));
    const previousIds = new Set(data.activities.slice(1).map(a => a.id));
    
    const newIds = new Set([...currentIds].filter(id => !previousIds.has(id)));
    if (newIds.size > 0) {
      setNewActivityIds(newIds);
      const timer = setTimeout(() => setNewActivityIds(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [data?.activities]);

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
      {data.activities.map((activity) => {
        const isNew = newActivityIds.has(activity.id);
        return (
          <div
            key={activity.id}
            className={`text-sm text-muted-foreground transition-all duration-500 ${
              isNew ? "animate-in fade-in slide-in-from-top-2 bg-primary/5 -mx-2 px-2 py-1 rounded-md" : ""
            }`}
          >
            <span className="font-medium text-foreground">{activity.userName}</span>
            {" "}{activity.action.toLowerCase()}{" "}
            <span className="text-primary">{activity.entityType}</span>
            {isNew && <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">New</span>}
          </div>
        );
      })}
    </div>
  );
}
