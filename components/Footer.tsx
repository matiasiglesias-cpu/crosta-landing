import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 px-6 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Logo className="text-sm text-foreground/70" />
        <p className="text-xs text-foreground/40">
          CROSTA &copy; 2026 &middot;{" "}
          <a
            href="https://link.me/crostachips"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-300 hover:text-gold-light"
          >
            link.me/crostachips
          </a>
        </p>
      </div>
    </footer>
  );
}
