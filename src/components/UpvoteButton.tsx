"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVote } from "@/actions/votes";

export function UpvoteButton({
  targetType,
  targetId,
  count,
  voted,
  loggedIn,
  size = "md",
}: {
  targetType: "milestone" | "entity";
  targetId: string;
  count: number;
  voted: boolean;
  loggedIn: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic({ count, voted });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      setOptimistic({ voted: !voted, count: Math.max(0, count + (voted ? -1 : 1)) });
      try {
        const res = await toggleVote(targetType, targetId);
        if (res.ok) setOptimistic({ voted: res.voted, count: res.count });
        else if (res.reason === "login") router.push("/login");
        else setError(res.message ?? "Could not save your vote");
      } catch {
        setError("Could not save your vote. Please try again.");
      }
    });
  }

  const pad = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic.voted}
      aria-busy={pending}
      title={error ?? (loggedIn ? (optimistic.voted ? "Remove upvote" : "Upvote") : "Log in to upvote")}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border font-semibold tabular-nums transition ${pad} ${
        optimistic.voted
          ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
          : "border-line bg-white text-slate-700 hover:border-brand-500 hover:text-brand-700"
      } ${error ? "ring-2 ring-rose-300" : ""}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden>
        <path d="M10 3.5 3.5 11h4v5.5h5V11h4L10 3.5Z" />
      </svg>
      {optimistic.count}
    </button>
  );
}
