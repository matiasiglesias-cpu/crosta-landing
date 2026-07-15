"use client";

import { motion } from "framer-motion";

export default function CrispVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className="relative mx-auto flex h-[280px] w-[280px] items-center justify-center sm:h-[340px] sm:w-[340px]"
    >
      <div className="absolute inset-0 rounded-full bg-gold/10 blur-3xl" />

      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-full w-full"
      >
        <div className="absolute inset-0 rounded-full border border-gold/25 shadow-soft-lg" />
        <div className="absolute inset-[6%] rounded-full bg-gradient-to-br from-[#2a2418] via-[#181818] to-[#0D0D0D] shadow-soft-lg" />
        <div className="absolute inset-[14%] rounded-full border border-gold/20" />
        <div className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(216,181,91,0.22),transparent_60%)]" />

        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const radius = 34;
          const x = (50 + radius * Math.cos(angle)).toFixed(2);
          const y = (50 + radius * Math.sin(angle)).toFixed(2);
          return (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-gold/40"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          );
        })}

        <div className="absolute inset-[38%] rounded-full bg-gold-gradient opacity-90 shadow-gold" />
      </motion.div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        className="absolute inset-[-8%] rounded-full border border-dashed border-gold/10"
      />
    </motion.div>
  );
}
