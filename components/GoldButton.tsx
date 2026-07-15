"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GoldButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export default function GoldButton({
  children,
  href,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: GoldButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-medium tracking-wide transition-all duration-300";

  const styles =
    variant === "primary"
      ? "bg-gold-gradient text-background shadow-gold hover:shadow-[0_10px_40px_-6px_rgba(216,181,91,0.5)]"
      : "border border-white/15 text-foreground/90 hover:border-gold/40 hover:text-gold-light glass";

  const motionProps = {
    whileHover: { scale: 1.03, y: -1 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring", stiffness: 400, damping: 20 },
    className: `${base} ${styles} ${className}`,
  } as const;

  if (href) {
    return (
      <motion.a href={href} onClick={onClick} {...motionProps}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button type={type} onClick={onClick} {...motionProps}>
      {children}
    </motion.button>
  );
}
