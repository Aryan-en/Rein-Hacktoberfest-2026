export interface RateDecision {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: "rate" | "daily_cap";
}

interface Bucket {
  tokens: number;
  updated: number;
}

/**
 * In-memory token bucket per client key plus a global daily cap.
 * Per-instance only (resets on restart); the daily cap is the backstop. See Architecture §8 #7.
 */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private day = "";
  private dayCount = 0;

  constructor(
    private opts: { perMinute: number; dailyCap: number; now?: () => number; maxKeys?: number },
  ) {}

  private now(): number {
    return (this.opts.now ?? Date.now)();
  }

  check(key: string): RateDecision {
    const now = this.now();
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.dayCount = 0;
    }
    if (this.dayCount >= this.opts.dailyCap) {
      const next = Date.parse(today + "T00:00:00Z") + 86_400_000;
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((next - now) / 1000)), reason: "daily_cap" };
    }

    const cap = this.opts.perMinute;
    const ratePerMs = cap / 60_000;
    const b = this.buckets.get(key) ?? { tokens: cap, updated: now };
    b.tokens = Math.min(cap, b.tokens + (now - b.updated) * ratePerMs);
    b.updated = now;
    if (b.tokens < 1) {
      this.buckets.set(key, b);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((1 - b.tokens) / ratePerMs / 1000)), reason: "rate" };
    }
    b.tokens -= 1;
    this.buckets.set(key, b);
    this.dayCount++;
    this.evict(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private evict(now: number): void {
    const max = this.opts.maxKeys ?? 10_000;
    if (this.buckets.size <= max) return;
    for (const [k, b] of this.buckets) {
      // Buckets idle for > 2 minutes are full again; safe to drop.
      if (now - b.updated > 120_000) this.buckets.delete(k);
    }
    // Still too large (attack with many fresh keys): drop oldest entries.
    if (this.buckets.size > max) {
      const keys = [...this.buckets.keys()].slice(0, this.buckets.size - max);
      for (const k of keys) this.buckets.delete(k);
    }
  }
}

/**
 * Derives the client key. `hops` = number of trusted proxies in front of us; the client IP is the
 * Nth entry from the right of X-Forwarded-For (entries to its left are attacker-controlled).
 * hops=0 ignores the header entirely.
 */
export function clientKey(headers: Record<string, string | string[] | undefined>, socketAddr: string | undefined, hops: number): string {
  if (hops > 0) {
    const raw = headers["x-forwarded-for"];
    const v = Array.isArray(raw) ? raw.join(",") : raw;
    if (v) {
      const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
      const ip = parts[parts.length - hops];
      if (ip) return ip.slice(0, 64);
    }
  }
  return (socketAddr ?? "unknown").slice(0, 64);
}
