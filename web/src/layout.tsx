import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { nav } from "./data";
import { useMarketingMotion } from "./motion";
import { Button, Wordmark } from "./ui";

const groups: { title: string; hrefs: string[] }[] = [
  { title: "Product", hrefs: ["/solutions", "/industries", "/compliance", "/resources"] },
  { title: "Company", hrefs: ["/customers", "/blog", "/press", "/about", "/contact"] },
];

export function MarketingLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useMarketingMotion(location.pathname);

  useEffect(() => {
    setOpen(false);
    if (location.hash) {
      const node = document.querySelector(location.hash);
      if (node) node.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative min-h-screen">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-[#07090c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Wordmark />
          <nav className="ml-6 hidden items-center gap-4 xl:flex" aria-label="Primary">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className="nav-link pb-0.5 hover:text-ink"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/console" className="hidden text-sm text-muted hover:text-ink sm:inline">
              Console
            </Link>
            <Button href="/contact#demo">Book a Demo</Button>
            <button
              className="rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-wider text-muted xl:hidden"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="site-menu"
            >
              Menu
            </button>
          </div>
        </div>
        {open ? (
          <nav id="site-menu" className="border-t border-line px-5 py-4 xl:hidden" aria-label="Mobile">
            {groups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="kicker">{group.title}</p>
                <div className="mt-2 grid gap-1">
                  {nav
                    .filter((item) => group.hrefs.includes(item.href))
                    .map((item) => (
                      <Link key={item.href} to={item.href} className="rounded-lg px-1 py-2 text-sm text-ink">
                        {item.label}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
            <Link to="/console" className="block rounded-lg px-1 py-2 text-sm text-cyan-2">
              Platform console
            </Link>
          </nav>
        ) : null}
      </header>
      <div id="content">
        <Outlet />
      </div>
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
          <div>
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted">Enterprise AI governance for regulated industries.</p>
          </div>
          <FooterCol title="Product" links={[["/solutions", "Solutions"], ["/console", "Platform console"], ["/#integrations", "Integrations"], ["/#lifecycle", "Lifecycle"]]} />
          <FooterCol title="Company" links={[["/customers", "Customers"], ["/blog", "Blog"], ["/press", "Press"], ["/about", "About"], ["/contact", "Contact"]]} />
          <FooterCol title="Trust" links={[["/compliance", "Compliance"], ["/industries", "Industries"], ["/resources", "Resources"], ["/privacy", "Privacy"]]} />
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-10 text-xs leading-relaxed text-faint">
          <p>decidion.ai · Enterprise AI Governance · <Link to="/privacy" className="underline">Privacy</Link> · hello@decidion.ai</p>
          <p className="mt-3">© 2026 Decidion. Purpose-built for regulated industries.</p>
          <p className="mt-3 max-w-4xl">
            Legal disclaimer: Decidion provides governance and monitoring tools for multi-agent AI systems. While the platform is designed to help organizations maintain compliance with applicable regulations, users are solely responsible for ensuring their AI implementations comply with all relevant laws, regulations, and industry standards in their jurisdictions. The information and capabilities are for informational and operational purposes only and do not constitute legal, compliance, or regulatory advice.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="kicker">{title}</p>
      <ul className="mt-4 space-y-2 text-sm text-muted">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link to={href} className="hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
