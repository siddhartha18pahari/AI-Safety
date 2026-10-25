import { useEffect, useRef, useState, type ReactNode } from "react";

const STAT = /^([^0-9]*)(\d+(?:\.\d+)?)(.*)$/;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

/** Reveal marketing sections as they enter the viewport. Above-the-fold content stays visible. */
export function useMarketingMotion(pathname: string) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const apply = () => {
      const reduced = media.matches;
      root.classList.toggle("reduce-motion", reduced);
      root.classList.toggle("motion", !reduced);
    };
    apply();
    media.addEventListener("change", apply);

    const main = document.querySelector("main");
    if (!main || media.matches) {
      return () => media.removeEventListener("change", apply);
    }

    const nodes = Array.from(main.querySelectorAll<HTMLElement>("section, article"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) node.classList.add("is-revealed");
      else {
        node.classList.add("reveal");
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
      media.removeEventListener("change", apply);
    };
  }, [pathname]);
}

export function CountUp({ value, className }: { value: string; className?: string }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    const match = value.match(STAT);
    if (!match || reduced) {
      setText(value);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const [, prefix, raw, suffix] = match;
    const target = Number(raw);
    const decimals = raw.includes(".") ? raw.split(".")[1].length : 0;
    let started = false;
    let raf = 0;

    const tick = (start: number) => (now: number) => {
      if (!started) return;
      const progress = Math.min(1, (now - start) / 1100);
      const eased = 1 - (1 - progress) ** 3;
      const current = target * eased;
      const shown = decimals ? current.toFixed(decimals) : String(Math.round(current));
      setText(`${prefix}${shown}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick(start));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((entry) => entry.isIntersecting)) return;
        started = true;
        setText(`${prefix}${decimals ? (0).toFixed(decimals) : "0"}${suffix}`);
        raf = requestAnimationFrame(tick(performance.now()));
      },
      { threshold: 0.45 },
    );
    observer.observe(node);
    return () => {
      started = false;
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [reduced, value]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}

export function FrameworkMark({ name }: { name: string }) {
  return (
    <span className="logo-pill">
      <MarkGlyph name={name} />
      {name}
    </span>
  );
}

function MarkGlyph({ name }: { name: string }) {
  if (name === "LangChain") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8h5a3 3 0 0 1 0 6H8" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="7" cy="8" r="1.4" fill="currentColor" />
        <circle cx="7" cy="14" r="1.4" fill="currentColor" />
        <circle cx="16" cy="11" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (name === "CrewAI") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7" cy="12" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 11.2 15 8.2M9 12.8l6 3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (name === "AutoGen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="8" height="6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="12" y="12" width="8" height="6" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "LangGraph") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="16" r="1.7" fill="currentColor" />
        <circle cx="12" cy="7" r="1.7" fill="currentColor" />
        <circle cx="18" cy="16" r="1.7" fill="currentColor" />
        <path d="M7.4 14.8 10.6 8.6M13.4 8.6l3.2 6.2M8 16h8" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 8 5 12l4 4M15 8l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{children}</div>
    </div>
  );
}
