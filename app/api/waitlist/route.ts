import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRequestRateLimit, claimIpSlot, releaseIpSlot } from "@/lib/ratelimit";
import { verifyTurnstile } from "@/lib/turnstile";
import { helsinkiAreasFor } from "@/lib/helsinkiAreas";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^\d{5}$/;
const CURRENT_YEAR = new Date().getFullYear();

// Unambiguous characters only (no 0/O, 1/I/L).
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCouponCode() {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `CROSTA-${suffix}`;
}

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "23505";

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const fields = body as Record<string, unknown> | null;
  const ip = getClientIp(request);

  // Honeypot: real visitors never fill this hidden field. Bots that
  // auto-fill every input will. Pretend it worked so scrapers don't learn
  // the check exists, but never touch the database.
  if (typeof fields?.website === "string" && fields.website.trim() !== "") {
    return NextResponse.json({ couponCode: generateCouponCode() });
  }

  const withinRateLimit = await checkRequestRateLimit(ip);
  if (!withinRateLimit) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a minute." },
      { status: 429 }
    );
  }

  const rawEmail = fields?.email;
  if (typeof rawEmail !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const rawName = fields?.name;
  if (typeof rawName !== "string" || !rawName.trim() || rawName.trim().length > 100) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  const name = rawName.trim();

  const birthYear = Number(fields?.birthYear);
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > CURRENT_YEAR) {
    return NextResponse.json(
      { error: "Please enter a valid birth year." },
      { status: 400 }
    );
  }

  const rawPostal = fields?.postalCode;
  const postalCode = typeof rawPostal === "string" ? rawPostal.trim() : "";
  if (!POSTAL_RE.test(postalCode)) {
    return NextResponse.json(
      { error: "Please enter a valid postal code." },
      { status: 400 }
    );
  }
  const areas = helsinkiAreasFor(postalCode);
  if (!areas) {
    return NextResponse.json(
      {
        error:
          "We're launching in Helsinki first — this postal code isn't a Helsinki one yet.",
      },
      { status: 400 }
    );
  }

  const rawNeighborhood = fields?.neighborhood;
  if (typeof rawNeighborhood !== "string" || !areas.includes(rawNeighborhood)) {
    return NextResponse.json(
      { error: "Please choose your Helsinki neighborhood." },
      { status: 400 }
    );
  }
  const neighborhood = rawNeighborhood;

  if (fields?.consent !== true) {
    return NextResponse.json(
      { error: "Please agree to the data policy to continue." },
      { status: 400 }
    );
  }

  const turnstileOk = await verifyTurnstile(
    typeof fields?.turnstileToken === "string" ? fields.turnstileToken : undefined,
    ip
  );
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: lookupError } = await supabase
      .from("waitlist")
      .select("coupon_code")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error("waitlist lookup error:", lookupError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({ couponCode: existing.coupon_code });
    }

    const ipAllowed = await claimIpSlot(ip);
    if (!ipAllowed) {
      return NextResponse.json(
        {
          error:
            "This network has already claimed the maximum number of coupons.",
        },
        { status: 429 }
      );
    }

    // Try a few times in case a generated code collides with an existing one,
    // or a concurrent request grabs the same email first.
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const couponCode = generateCouponCode();

      const { data: inserted, error: insertError } = await supabase
        .from("waitlist")
        .insert({
          email,
          coupon_code: couponCode,
          name,
          birth_year: birthYear,
          // Every signup is Helsinki for now; keep the chosen neighborhood
          // visible in the same column ("Helsinki – Punavuori").
          city: `Helsinki – ${neighborhood}`,
          postal_code: postalCode,
          consented_at: new Date().toISOString(),
        })
        .select("coupon_code")
        .single();

      if (!insertError) {
        return NextResponse.json({ couponCode: inserted.coupon_code });
      }

      if (isUniqueViolation(insertError)) {
        // If it was the email that collided, someone else just signed up
        // with it concurrently — return their coupon instead of erroring.
        const { data: raceWinner } = await supabase
          .from("waitlist")
          .select("coupon_code")
          .eq("email", email)
          .maybeSingle();

        if (raceWinner) {
          await releaseIpSlot(ip);
          return NextResponse.json({ couponCode: raceWinner.coupon_code });
        }
        // Otherwise it was the coupon code that collided — loop and retry.
        continue;
      }

      console.error("waitlist insert error:", insertError);
      await releaseIpSlot(ip);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    await releaseIpSlot(ip);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  } catch (err) {
    console.error("waitlist route crashed:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
