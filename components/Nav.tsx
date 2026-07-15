"use client";

import { motion } from "framer-motion";
import Logo from "./Logo";

export default function Nav() {
  const scrollToSignup = () => {
    document.getElementById("signup")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <div className="glass rounded-full border border-white/10 px-5 py-2.5 shadow-soft">
          <Logo className="text-base" />
        </div>
        <button
          onClick={scrollToSignup}
          className="glass rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-foreground/90 shadow-soft transition-colors duration-300 hover:border-gold/40 hover:text-gold-light"
        >
          Join the Waitlist
        </button>
      </div>
    </motion.header>
  );
}
