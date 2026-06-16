"use client";

import { useEffect, useState } from "react";

export function GitHubCommitBadge() {
  const [commitCount, setCommitCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCommitCount() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/AbdolHamidDev/HalalChain/commits?per_page=1"
        );
        const linkHeader = res.headers.get("Link");
        if (linkHeader) {
          const match = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
          if (match) {
            setCommitCount(parseInt(match[1], 10));
          }
        }
      } catch {
        // silently ignore
      }
    }
    fetchCommitCount();
  }, []);

  if (commitCount === null) return null;

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      {commitCount.toLocaleString()} commits
    </span>
  );
}
