interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  return (
    <span
      className={`font-serif text-xl tracking-[0.2em] text-foreground ${className}`}
    >
      CROSTA
    </span>
  );
}
