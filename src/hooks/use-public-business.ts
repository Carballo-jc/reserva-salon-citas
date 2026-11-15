import { useEffect, useState } from "react";
import { fetchPublicBusiness, type PublicBusiness } from "@/lib/public-business";

export type PublicBusinessState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  /** `business` is null when the slug does not exist. */
  | { status: "ready"; business: PublicBusiness | null };

/** Outcome of one request, tagged with the slug and attempt it belongs to. */
type LoadResult = {
  requestKey: string;
  outcome: { ok: true; business: PublicBusiness | null } | { ok: false };
};

/**
 * Loads the public data of a business by slug.
 * A result only counts for the request it was made with, so changing the slug
 * or retrying goes back to "loading" without resetting state in the effect.
 */
export function usePublicBusiness(slug: string): PublicBusinessState {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const requestKey = `${slug}:${attempt}`;

  useEffect(() => {
    let isCurrent = true;
    fetchPublicBusiness(slug).then(
      (business) => {
        if (isCurrent) setResult({ requestKey, outcome: { ok: true, business } });
      },
      () => {
        if (isCurrent) setResult({ requestKey, outcome: { ok: false } });
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [slug, requestKey]);

  const isStale = result?.requestKey !== requestKey;
  if (isStale) return { status: "loading" };
  if (!result.outcome.ok) {
    return {
      status: "error",
      retry: () => setAttempt((current) => current + 1),
    };
  }
  return { status: "ready", business: result.outcome.business };
}
