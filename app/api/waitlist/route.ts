import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const rawEmail = (body as { email?: unknown } | null)?.email;
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

    // Try a few times in case a generated code collides with an existing one,
    // or a concurrent request grabs the same email first.
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const couponCode = generateCouponCode();

      const { data: inserted, error: insertError } = await supabase
        .from("waitlist")
        .insert({ email, coupon_code: couponCode })
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
          return NextResponse.json({ couponCode: raceWinner.coupon_code });
        }
        // Otherwise it was the coupon code that collided — loop and retry.
        continue;
      }

      console.error("waitlist insert error:", insertError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

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
