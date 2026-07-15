"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

type Status = "idle" | "loading" | "success" | "error";

export default function EmailSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "loading") return;

    setStatus("loading");
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="signup" className="relative px-6 py-24 sm:px-8 sm:py-32">
      <RevealOnScroll>
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-5xl border border-white/10 bg-card px-6 py-14 text-center shadow-soft-lg sm:px-14">
          <div className="pointer-events-none absolute inset-0 bg-radial-fade opacity-70" />

          <div className="relative">
            <h2 className="text-balance font-serif text-3xl font-medium leading-tight sm:text-4xl">
              Be the first to taste{" "}
              <span className="text-gradient-gold italic">CROSTA</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/60 sm:text-base">
              Join the waitlist for early access, launch pricing, and news
              from the kitchen.
            </p>

            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 flex items-center justify-center gap-2 text-gold-light"
                >
                  <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
                  <span className="text-sm font-medium">
                    You&apos;re on the list. We&apos;ll be in touch.
                  </span>
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
