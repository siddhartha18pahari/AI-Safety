import { useEffect, useState } from "react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { nav } from "./data";
import { Button, Wordmark } from "./ui";

export function MarketingLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    if (location.hash) {
      const node = document.querySelector(location.hash);
      if (node) node.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-[#07090c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Wordmark />
          <nav className="ml-auto hidden items-center gap-4 xl:flex">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm ${isActive ? "text-cyan-2" : "text-muted hover:text-ink"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto xl:ml-2">
            <Button href="/contact#demo">Book a Demo</Button>
          </div>
          <button
            className="rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-wider text-muted xl:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Menu"
          >
            Menu
          </button>
        </div>
        {open ? (
          <nav className="border-t border-line px-5 py-4 xl:hidden">
            <div className="grid gap-3">
              {nav.map((item) => (
                <Link key={item.href} to={item.href} className="text-sm text-ink">
                  {item.label}
                </Link>
              ))}
              <Link to="/console" className="text-sm text-cyan-2">
                Platform console
              </Link>
            </div>
          </nav>
        ) : null}
      </header>
      <Outlet />
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
