"use client";

import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import GoldButton from "./GoldButton";

// The 3D chip is client-only (WebGL); reserve its box while it loads so the
// hero doesn't shift.
const ChipVisual = dynamic(() => import("./ChipVisual"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto h-[320px] w-[320px] sm:h-[430px] sm:w-[430px]" />
  ),
});

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Hero() {
  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToStory = () => {
    document.getElementById("story")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center"
      >
        <motion.div
          variants={item}
          className="glass mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.15em] text-gold-light"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
          Launching Soon
        </motion.div>

        <motion.h1
          variants={item}
          className="text-balance font-serif text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
        >
          Real Parmigiano.
          <br />
          <span className="text-gradient-gold italic">Impossible Crunch.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="text-balance mt-7 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg"
        >
          Premium Parmesan crisps crafted from authentic Parmigiano Reggiano.
          Naturally high in protein. No seed oils. No fillers.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <GoldButton onClick={scrollToSignup}>Join the Waitlist</GoldButton>
          <GoldButton variant="secondary" onClick={scrollToStory}>
            Coming Soon
          </GoldButton>
        </motion.div>

        <motion.p
          variants={item}
          className="mt-6 inline-flex items-center gap-2 text-sm text-gold-light/90"
        >
          <Gift className="h-4 w-4" strokeWidth={1.75} />
          Waitlist members get 2-for-1 on their first order.
        </motion.p>
      </motion.div>

      <div className="relative z-10 mt-10">
        <ChipVisual />
      </div>
    </section>
  );
}
