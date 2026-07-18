"use client";

import { useState, FormEvent, useEffect } from "react";
import Script from "next/script";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  Gift,
  Copy,
  Check,
} from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";
import { FINLAND_CITIES } from "@/lib/finlandCities";

type Status = "idle" | "loading" | "success" | "error";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const CURRENT_YEAR = new Date().getFullYear();

declare global {
  interface Window {
    onTurnstileVerified?: (token: string) => void;
  }
}

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot — real users leave this blank
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    window.onTurnstileVerified = (token: string) => setTurnstileToken(token);
    return () => {
      delete window.onTurnstileVerified;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    if (!email.trim() || !name.trim() || !birthYear || !city || !consent) return;

    setStatus("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          birthYear: Number(birthYear),
          city,
          consent,
          website,
          turnstileToken,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.couponCode) {
        setErrorMessage(
          data?.error || "Something went wrong. Please try again."
        );
        setStatus("error");
        return;
      }

      setCode(data.couponCode);
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the code is still visible to copy by hand.
    }
  };

  return (
    <section id="signup" className="relative px-6 py-24 sm:px-8 sm:py-32">
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
      )}
      <RevealOnScroll>
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-5xl border border-white/10 bg-card px-6 py-14 text-center shadow-soft-lg sm:px-14">
          <div className="pointer-events-none absolute inset-0 bg-radial-fade opacity-70" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-gold-light">
              <Gift className="h-3.5 w-3.5" strokeWidth={1.75} />
              Waitlist Perk — 2-for-1 First Order
            </span>

            <h2 className="text-balance mt-6 font-serif text-3xl font-medium leading-tight sm:text-4xl">
              Be the first to taste{" "}
              <span className="text-gradient-gold italic">CROSTA</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/60 sm:text-base">
              Join the waitlist and get 2-for-1 on your first order — plus
              early access, launch pricing, and news from the kitchen.
              Delivered anywhere in Finland.
            </p>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8"
                >
                  <div className="flex items-center justify-center gap-2 text-gold-light">
                    <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                    <span className="text-sm font-medium">
                      🎉 Welcome to the Crosta Chips waitlist!
                    </span>
                  </div>

                  <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-dashed border-gold/40 bg-background/50 px-6 py-5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/50">
                      Your exclusive 2-for-1 launch coupon
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      <span className="font-mono text-lg tracking-[0.14em] text-gold-light">
                        {code}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        aria-label={copied ? "Code copied" : "Copy code"}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-foreground/60 transition-colors duration-300 hover:border-gold/40 hover:text-gold-light"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-gold-light" strokeWidth={2} />
                        ) : (
                          <Copy className="h-4 w-4" strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-foreground/40">
                      Save it — you&apos;ll apply it at checkout on launch day.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSubmit}
                  className="mx-auto mt-8 flex max-w-md flex-col gap-3 text-left"
                >
                  {/* Honeypot — hidden from real visitors, bots tend to fill every field */}
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute left-[-9999px] h-0 w-0 opacity-0"
                  />

                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
                      strokeWidth={1.75}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full rounded-full border border-white/10 bg-background/60 py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors duration-300 focus:border-gold/50"
                    />
                  </div>

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    maxLength={100}
                    className="w-full rounded-full border border-white/10 bg-background/60 px-5 py-3.5 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors duration-300 focus:border-gold/50"
                  />

                  <div className="flex gap-3">
                    <input
                      type="number"
                      required
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      placeholder="Birth year"
                      min={1900}
                      max={CURRENT_YEAR}
                      className="w-1/2 rounded-full border border-white/10 bg-background/60 px-5 py-3.5 text-sm text-foreground placeholder:text-foreground/35 outline-none transition-colors duration-300 focus:border-gold/50"
                    />
                    <select
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-1/2 rounded-full border border-white/10 bg-background/60 px-5 py-3.5 text-sm text-foreground outline-none transition-colors duration-300 focus:border-gold/50"
                    >
                      <option value="" disabled>
                        City
                      </option>
                      {FINLAND_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {TURNSTILE_SITE_KEY && (
                    <div
                      className="cf-turnstile mx-auto"
                      data-sitekey={TURNSTILE_SITE_KEY}
                      data-callback="onTurnstileVerified"
                    />
                  )}

                  <label className="flex items-start gap-2.5 px-1 text-xs leading-relaxed text-foreground/50">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-gold"
                    />
                    <span>
                      I agree that Crosta may store this information to manage
                      the waitlist, per the{" "}
                      <a
                        href="/privacy"
                        target="_blank"
                        className="underline decoration-dotted underline-offset-2 hover:text-gold-light"
                      >
                        Privacy Notice
                      </a>
                      .
                    </span>
                  </label>

                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="mt-1 inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-medium text-background shadow-gold transition-opacity duration-300 disabled:opacity-60"
                  >
                    {status === "loading" ? "Joining..." : "Notify Me"}
                    {status !== "loading" && (
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {status === "error" && (
              <p className="relative mt-3 text-sm text-red-400">
                {errorMessage}
              </p>
            )}

            <p className="relative mt-5 text-xs text-foreground/35">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
