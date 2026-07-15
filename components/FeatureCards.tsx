"use client";

import { motion } from "framer-motion";
import { Award, Flame, ShieldCheck, LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import RevealOnScroll from "./RevealOnScroll";

const macros = [
  { label: "Calories", value: "~400 kcal" },
  { label: "Protein", value: "33–36 g" },
  { label: "Fat", value: "28–30 g" },
  { label: "Carbohydrates", value: "0 g" },
];

const diets = [
  "Carnivore",
  "Keto",
  "Paleo",
  "Low Carb",
  "Gluten Free",
  "Lactose Free",
  "Low FODMAP",
];

function Card({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: LucideIcon;
  title: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <RevealOnScroll delay={delay}>
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="group relative h-full overflow-hidden rounded-4xl border border-white/10 bg-card p-8 shadow-soft transition-colors duration-300 hover:border-gold/30"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/0 blur-2xl transition-colors duration-500 group-hover:bg-gold/10" />

        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-gold/5 transition-colors duration-300 group-hover:border-gold/40 group-hover:bg-gold/10">
          <Icon className="h-5 w-5 text-gold-light" strokeWidth={1.5} />
        </div>

        <h3 className="relative mt-6 text-lg font-medium leading-snug text-foreground">
          {title}
        </h3>

        <div className="relative mt-4">{children}</div>
      </motion.div>
    </RevealOnScroll>
  );
}

export default function FeatureCards() {
  return (
    <section className="relative px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
        <RevealOnScroll>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
            The Crosta Standard
          </span>
        </RevealOnScroll>
        <RevealOnScroll delay={0.1}>
          <h2 className="text-balance mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">
            One ingredient, obsessively crafted
          </h2>
        </RevealOnScroll>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
        <Card icon={Flame} title="Nutrition, per 100 g" delay={0}>
          <dl>
            {macros.map((m) => (
              <div
                key={m.label}
                className="flex items-baseline justify-between border-b border-white/5 py-2 last:border-0"
              >
                <dt className="text-sm text-foreground/60">{m.label}</dt>
                <dd className="text-sm font-medium text-foreground">{m.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card icon={ShieldCheck} title="Fits the way you eat" delay={0.12}>
          <div className="flex flex-wrap gap-2">
            {diets.map((d) => (
              <span
                key={d}
                className="rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs text-foreground/75 transition-colors duration-300 group-hover:border-gold/30"
              >
                {d}
              </span>
            ))}
          </div>
        </Card>

        <Card
          icon={Award}
          title="Made from Authentic Parmigiano Reggiano"
          delay={0.24}
        >
          <p className="text-sm leading-relaxed text-foreground/60">
            Sourced from aged Parmigiano Reggiano wheels. No seed oils,
            additives, or preservatives — just the real thing, crafted with
            care.
          </p>
        </Card>
      </div>
    </section>
  );
}
