import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title === "Decidion" ? "Decidion · Unified plane for multi-agent systems" : `${title} · Decidion`;
  }, [title]);
}

export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#071410" stroke="#1d4a42" />
      <path
        fill="#8ef6e4"
        d="M8 22V10h7.2c3.4 0 5.5 1.8 5.5 4.5 0 1.8-1 3.2-2.6 3.9L22 22h-3.2l-3.3-3.4H11V22H8zm3-6h4.1c1.7 0 2.7-.8 2.7-2s-1-2-2.7-2H11v4z"
      />
      <path d="M7 26h18" stroke="#3ee0c5" strokeWidth="1.4" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-ink">
      <Mark />
      <span className="text-[15px] font-semibold tracking-[0.16em]">DECIDION</span>
    </Link>
  );
}

const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-cyan px-4 py-2.5 text-sm font-semibold text-[#04221c] transition hover:bg-white",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-cyan/70",
};

export function Button({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
}) {
  const className = buttonClass[variant];
  if (external || href.startsWith("http")) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  );
}

export function Outcome({ value }: { value: string }) {
  const tone =
    value === "ALLOW" ? "text-allow border-allow/30 bg-allow/10" : value === "ESCALATE" ? "text-amber border-amber/30 bg-amber/10" : value === "BLOCK" ? "text-rose border-rose/30 bg-rose/10" : "text-muted border-white/10";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[11px] tracking-wide ${tone}`}>{value}</span>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-panel/80 ${className}`}>{children}</div>;
}

export function PageHero({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 pb-14 pt-16">
        <p className="kicker">{kicker}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{lede}</p>
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </header>
  );
}

export function Check({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2 text-sm text-ink/90">
      <span className="mt-0.5 text-cyan" aria-hidden>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}
