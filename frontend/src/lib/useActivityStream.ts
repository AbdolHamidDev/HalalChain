"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface ActivityItem {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

type ActivityEvent = "activity_created";

export function useActivityStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const source = new EventSource("/api/dashboard/activity/stream", {
      withCredentials: true,
    });

    const handleNewActivity = (event: MessageEvent<string>) => {
      try {
        const activity = JSON.parse(event.data) as ActivityItem;
        
        queryClient.setQueryData<{ activities: ActivityItem[] }>(
          ["dashboard", "activity"],
          (current) => {
            const activities = current?.activities ?? [];
            // Avoid duplicates
            if (activities.some((item) => item.id === activity.id)) {
              return current;
            }
            // Prepend new activity and keep only the latest 20
            return {
              ...current,
              activities: [activity, ...activities].slice(0, 20),
            };
          }
        );
      } catch (error) {
        console.error("Failed to parse activity event:", error);
      }
    };

    const eventNames: ActivityEvent[] = ["activity_created"];

    eventNames.forEach((eventName) => source.addEventListener(eventName, handleNewActivity));

    source.onerror = () => {
      // Silently handle errors - the query will refetch on next poll
      console.debug("Activity stream connection closed");
    };

    return () => {
      eventNames.forEach((eventName) => source.removeEventListener(eventName, handleNewActivity));
      source.close();
    };
  }, [enabled, queryClient]);
}