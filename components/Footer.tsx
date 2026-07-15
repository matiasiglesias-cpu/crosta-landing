import Logo from "./Logo";

const links = [
  { label: "Our Philosophy", href: "#story" },
  { label: "Join the Waitlist", href: "#signup" },
  {
    label: "link.me/crostachips",
    href: "https://link.me/crostachips",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 pb-10 pt-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-8 text-center sm:flex-row sm:items-start sm:text-left">
          <div>
            <Logo className="text-base" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/50">
              Real Parmigiano. Impossible crunch. Baked in small batches from
              aged Parmigiano Reggiano.
            </p>
          </div>

          <nav className="flex flex-col items-center gap-3 text-sm sm:items-end">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-foreground/60 transition-colors duration-300 hover:text-gold-light"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-white/5 pt-6 text-xs text-foreground/35 sm:flex-row">
          <p>&copy; 2026 CROSTA. All rights reserved.</p>
          <p>Made with one ingredient.</p>
        </div>
      </div>
    </footer>
  );
}
