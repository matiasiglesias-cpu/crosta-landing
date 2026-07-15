"use client";

import { motion } from "framer-motion";
import RevealOnScroll from "./RevealOnScroll";

export default function BrandStory() {
  return (
    <section
      id="story"
      className="relative overflow-hidden px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-3xl text-center">
        <RevealOnScroll>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            Our Philosophy
          </span>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <p className="text-balance mt-6 font-serif text-2xl font-normal leading-relaxed text-foreground/90 sm:text-3xl md:text-4xl">
            We believe snacks should be{" "}
            <span className="italic text-gradient-gold">simple</span>,{" "}
            <span className="italic text-gradient-gold">uncompromising</span>{" "}
            and unforgettable. Crosta transforms authentic Parmigiano into an
            incredibly crunchy crisp that belongs equally on a charcuterie
            board or in a gym bag.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <motion.div
            className="mx-auto mt-10 h-px w-24 bg-gold-gradient"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </RevealOnScroll>
      </div>
    </section>
  );
}
