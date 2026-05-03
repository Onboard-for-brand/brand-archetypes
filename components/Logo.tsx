import Link from "next/link";

interface LogoProps {
  onRed?: boolean;
}

export function Logo({ onRed = false }: LogoProps) {
  return (
    <Link
      className={`logo ${onRed ? "is-on-red" : ""}`}
      href="/"
      aria-label="Onboarding for Brand home"
    >
      <span className="logo__mark">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
        ONBOARDING
      </span>
      <span className="logo__sub">for BRAND</span>
    </Link>
  );
}
