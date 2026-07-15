"use client";

import { useState, FormEvent } from "react";
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

type Status = "idle" | "loading" | "success" | "error";

// Unambiguous characters only (no 0/O, 1/I/L).
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// Placeholder until the backend issues real per-subscriber codes.
function generateCode() {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `CROSTA-2X1-${suffix}`;
}

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setCode(generateCode());
      setStatus("success");
    } catch {
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
                      You&apos;re on the list. We&apos;ll be in touch.
                    </span>
                  </div>

                  <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-dashed border-gold/40 bg-background/50 px-6 py-5">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/50">
                      Your 2-for-1 code
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
                      Apply it at checkout on launch day — we&apos;ll email it
                      to you too.
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
                  className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
                >
                  <div className="relative flex-1">
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

                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-medium text-background shadow-gold transition-opacity duration-300 disabled:opacity-60"
                  >
                    {status === "loading" ? "Joining..." : "Notify Me"}
                    {status !== "loading" && (
                      <ArrowRight className="h-4 w-4" strokeWidth={2} />
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="relative mt-5 text-xs text-foreground/35">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
