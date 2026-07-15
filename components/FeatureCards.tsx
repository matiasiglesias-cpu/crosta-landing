"use client";

import { motion } from "framer-motion";
import { Award, Dumbbell, Leaf } from "lucide-react";
import RevealOnScroll from "./RevealOnScroll";

const features = [
  {
    icon: Award,
    title: "Made from authentic Parmigiano Reggiano",
    description:
      "Sourced from aged wheels of the real thing — nothing imitation, nothing diluted.",
  },
  {
    icon: Dumbbell,
    title: "Naturally high in protein",
    description:
      "A snack that fuels you, not just fills you. Real nutrition, zero compromise.",
  },
  {
    icon: Leaf,
    title: "No seed oils or unnecessary ingredients",
    description:
      "Just cheese, transformed. No fillers, no additives, no shortcuts.",
  },
];

export default function FeatureCards() {
  return (
    <section className="relative px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        {features.map((feature, i) => (
          <RevealOnScroll key={feature.title} delay={i * 0.12}>
            <motion.div
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative h-full overflow-hidden rounded-4xl border border-white/10 bg-card p-8 shadow-soft transition-colors duration-300 hover:border-gold/30"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/0 blur-2xl transition-colors duration-500 group-hover:bg-gold/10" />

              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5 transition-colors duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
                <feature.icon
                  className="h-5 w-5 text-gold-light"
                  strokeWidth={1.5}
                />
              </div>

              <h3 className="relative mt-6 text-lg font-medium leading-snug text-foreground">
                {feature.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-foreground/60">
                {feature.description}
              </p>
            </motion.div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
