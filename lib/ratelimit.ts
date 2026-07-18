import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const MAX_CLAIMS_PER_IP = 3;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

let cachedRequestLimiter: Ratelimit | null | undefined;

// Blocks scripted bursts: max 5 submit attempts per minute per IP.
function getRequestLimiter(): Ratelimit | null {
  if (cachedRequestLimiter !== undefined) return cachedRequestLimiter;
  const redis = getRedis();
  cachedRequestLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        prefix: "waitlist:req",
      })
    : null;
  return cachedRequestLimiter;
}

// Not configured yet (no Upstash keys) → don't block signups, just skip
// this layer of protection until the keys are added.
export async function checkRequestRateLimit(ip: string): Promise<boolean> {
  const limiter = getRequestLimiter();
  if (!limiter) return true;
  const { success } = await limiter.limit(ip);
  return success;
}

// Caps how many *new* coupons a single IP can claim, ever. Only call this
// right before creating a brand-new row — duplicate-email lookups don't
// consume a slot.
export async function claimIpSlot(ip: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true;

  const key = `waitlist:claims:${ip}`;
  const count = await redis.incr(key);

  if (count > MAX_CLAIMS_PER_IP) {
    await redis.decr(key);
    return false;
  }
  return true;
}

// Give back a slot if the insert that followed claimIpSlot() ended up failing.
export async function releaseIpSlot(ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.decr(`waitlist:claims:${ip}`);
}
