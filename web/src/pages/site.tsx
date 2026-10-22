import { FormEvent, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  customers,
  frameworksCompliance,
  githubFieldGuide,
  posts,
  press,
  resources,
  sectorPages,
  trustedBy,
  useCases,
} from "../data";
import { Industries } from "./home";
import { Button, Check, PageHero, Panel, useTitle } from "../ui";

const freeDomains = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com"]);

function workEmail(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email.";
  const domain = value.split("@")[1]?.toLowerCase() || "";
  if (freeDomains.has(domain)) return "Use your work email.";
  return "";
}

export function SolutionsPage() {
  useTitle("Solutions");
  return (
    <main>
      <PageHero
        kicker="Industry solutions"
        title="AI monitoring, observability, and management of governance and security"
        lede="Governance and security of multi-agent systems for regulated industries. See how Decidion protects organizations in financial services, healthcare, and insurance from AI risks while accelerating innovation."
      >
        <Button href="/console">Explore Platform</Button>
        <Button href="/contact#demo" variant="ghost">
          Book a Demo
        </Button>
      </PageHero>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="kicker">Featured use cases</p>
          <h2 className="mt-3 text-3xl font-semibold">Secure the agents already in production</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Panel className="p-6">
              <p className="font-mono text-xs text-faint">Coding agents / FMCG Fortune 500</p>
              <h3 className="mt-2 text-xl font-semibold">Secure the coding agents shipping code into your supply chain.</h3>
              <p className="mt-2 text-sm text-muted">Runtime protection for Cursor, Claude Code, GitHub Copilot and Codex across pricing, promo, and plant systems.</p>
              <Link to="/solutions/coding-agents" className="mt-4 inline-block text-sm text-cyan-2">
                Explore
              </Link>
            </Panel>
            <Panel className="p-6">
              <p className="font-mono text-xs text-faint">Customer support / Fortune 100 tech</p>
              <h3 className="mt-2 text-xl font-semibold">Secure the AI agents talking to your customers, every second.</h3>
              <p className="mt-2 text-sm text-muted">Policy enforcement, red teaming, and evidence for support agents built on OpenAI, Anthropic, Bedrock, and internal stacks.</p>
              <Link to="/solutions/customer-support" className="mt-4 inline-block text-sm text-cyan-2">
                Explore
              </Link>
            </Panel>
          </div>
        </div>
      </section>
      <Industries />
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-semibold">Ready to govern AI at scale?</h2>
          <p className="mt-3 text-muted">See how Decidion can protect your organization while accelerating AI adoption.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact#demo">Schedule Industry Demo</Button>
            <Button href="/console" variant="ghost">
              Explore Platform
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

export function UseCasePage() {
  const { slug } = useParams();
  const item = useCases.find((entry) => entry.slug === slug);
  useTitle(item?.title || "Solution");
  if (!item) return <Missing title="Solution" />;
  return (
    <main>
      <PageHero kicker={item.eyebrow} title={item.title} lede={item.lede}>
        <Button href="/contact#demo">Book a Demo</Button>
        <Button href="/contact" variant="ghost">
          Talk to an expert
        </Button>
      </PageHero>
      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-2">
        <Panel className="p-6">
          <h2 className="text-lg font-semibold">The problem</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.problem}</p>
        </Panel>
        <Panel className="p-6">
          <h2 className="text-lg font-semibold">The Decidion approach</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.approach}</p>
        </Panel>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {item.risks.map(([title, line], index) => (
            <Panel key={title} className="p-5">
              <p className="font-mono text-xs text-faint">Risk 0{index + 1}</p>
              <h3 className="mt-2 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{line}</p>
            </Panel>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4">
          {item.steps.map(([name, title, line, powered], index) => (
            <div key={name} className="grid gap-2 rounded-2xl border border-line p-5 md:grid-cols-[80px_1fr]">
              <p className="font-mono text-xs text-cyan-2">0{index + 1}</p>
              <div>
                <p className="text-xs uppercase tracking-wider text-faint">{name}</p>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{line}</p>
                <p className="mt-2 text-xs text-cyan-2">Powered by {powered}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-2xl font-semibold">Frequently asked</h2>
        <div className="mt-4 divide-y divide-line">
          {item.faqs.map(([q, a]) => (
            <div key={q} className="py-4">
              <h3 className="font-medium">{q}</h3>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export function IndustriesPage() {
  useTitle("Industries");
  return (
    <main>
      <PageHero
        kicker="Industries"
        title="Built for sectors where agent failure isn't an option."
        lede="Decidion deploys inside the regulated industries with the highest stakes, and the tightest scrutiny. One unified plane for security, governance, and observability of every AI agent in production."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-5 py-14">
        {sectorPages.map((item) => (
          <article key={item.id} className="rounded-3xl border border-line p-6 md:p-8">
            <p className="font-mono text-xs text-faint">{item.index} / Industry</p>
            <h2 className="mt-3 text-3xl font-semibold">{item.name}</h2>
            <p className="mt-2 text-lg">{item.title}</p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.lede}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">Where teams get stuck</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {item.stuck.map((line) => (
                    <li key={line}>• {line}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium">What Decidion delivers</h3>
                <ul className="mt-3 space-y-2">
                  {item.delivers.map((line) => (
                    <Check key={line}>{line}</Check>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <Link className="text-cyan-2" to={`/contact?topic=${item.contact}#demo`}>
                Discuss your {item.name.split(" ")[0]} use case
              </Link>
              <Link className="text-muted" to="/compliance">
                See compliance mapping
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

export function CustomersPage() {
  useTitle("Customers");
  return (
    <main>
      <PageHero
        kicker="Customers"
        title="Trusted in the rooms where AI failure has consequences."
        lede="Banks, insurers, and health systems rely on Decidion to deploy AI agents inside workflows their regulators, lawyers, and customers all watch closely."
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="kicker">Trusted by</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {trustedBy.map((name) => (
            <li key={name} className="rounded-full border border-line px-3 py-1 text-sm text-muted">
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-faint">Names anonymized under customer agreements. Reference calls available on request.</p>
      </section>
      <div className="mx-auto max-w-6xl space-y-8 px-5 pb-16">
        {customers.map((item) => (
          <article id={item.id} key={item.id} className="rounded-3xl border border-line p-6 md:p-8">
            <p className="font-mono text-xs text-faint">
              {item.sector} · Case {item.index}
            </p>
            <p className="mt-3 text-sm text-muted">{item.org}</p>
            <h2 className="mt-1 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">{item.line}</p>
            <blockquote className="mt-4 font-serif text-xl">“{item.quote}”</blockquote>
            <p className="mt-2 text-sm text-muted">{item.who}</p>
            <dl className="mt-6 grid grid-cols-3 gap-3">
              {item.metrics.map(([value, label]) => (
                <div key={label}>
                  <dt className="text-2xl font-semibold text-cyan-2">{value}</dt>
                  <dd className="text-xs text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </main>
  );
}

export function CompliancePage() {
  useTitle("Compliance");
  return (
    <main>
      <PageHero
        kicker="Compliance"
        title="One platform. Every major AI governance framework."
        lede="Decidion is engineered around the world's leading AI governance frameworks. Every control surfaces the evidence your auditors, regulators, and risk teams need, continuously, not at quarter-end."
      >
        <Button href="/contact#demo">Request a control mapping</Button>
      </PageHero>
      <div className="mx-auto max-w-6xl space-y-8 px-5 py-14">
        {frameworksCompliance.map((item) => (
          <article key={item.name} className="rounded-3xl border border-line p-6 md:p-8">
            <p className="font-mono text-xs text-faint">Framework {item.index}</p>
            <h2 className="mt-2 text-2xl font-semibold">{item.name}</h2>
            <p className="mt-1 text-sm text-cyan-2">{item.meta}</p>
            <p className="mt-3 max-w-3xl text-sm text-muted">{item.lede}</p>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              {item.items.map(([name, line]) => (
                <div key={name} className="rounded-2xl border border-line p-4">
                  <dt className="font-medium">{name}</dt>
                  <dd className="mt-1 text-sm text-muted">{line}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        <Panel className="p-6">
          <h2 className="text-xl font-semibold">Need a mapping for your specific framework?</h2>
          <p className="mt-2 text-sm text-muted">We maintain mappings for SOC 2, ISO 27001, HITRUST, FedRAMP, and more. Tell us yours.</p>
          <div className="mt-4">
            <Button href="/contact#demo">Talk to compliance engineering</Button>
          </div>
        </Panel>
      </div>
    </main>
  );
}

export function ResourcesPage() {
  useTitle("Resources");
  const [filter, setFilter] = useState("All");
  const kinds = ["All", "Whitepaper", "Guide", "Webinar", "Case Study"];
  const visible = resources.filter((item) => filter === "All" || item.kind === filter);
  return (
    <main>
      <PageHero
        kicker="Resources"
        title="Field-tested frameworks for agentic AI governance."
        lede="Whitepapers, practitioner guides, on-demand webinars, and customer stories from regulated organizations running Decidion in production."
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <p className="kicker">Downloadable report</p>
        <h2 className="mt-3 text-3xl font-semibold">A control framework for the agentic era.</h2>
        <p className="mt-2 text-muted">Open standards you can take back to your team.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Panel className="p-6">
            <p className="font-mono text-xs text-faint">01 / Featured report · AGSC / 2026 / Field Guide</p>
            <h3 className="mt-3 text-2xl font-semibold">Agentic Governance & Security Controls (AGSC)</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Edition V1.0. A vendor-neutral, open-source field guide for enterprise leaders, unifying technical governance and security controls to manage agentic AI risk.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>01 Decidion Standard: 25 controls mapped to 4 pillars (Safety, Alignment, Governance, Security)</li>
              <li>02 Built on the MIT AI Risk Repository, MITRE ATLAS and ATT&CK</li>
              <li>03 Aligned to the EU AI Act, NIST AI RMF and ISO/IEC 42001</li>
              <li>04 Authored by COHUMAIN Labs and Decidion, free to adopt</li>
            </ul>
            <p className="mt-4 text-xs text-faint">PDF · Edition V1.0 · 2026</p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["25", "Controls"],
                ["01", "Safety"],
                ["02", "Alignment"],
                ["03", "Governance"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-xl font-semibold text-cyan-2">{value}</p>
                  <p className="text-xs text-muted">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">04 Security · MITRE ATLAS · NIST AI RMF · EU AI Act · ISO/IEC 42001</p>
            <a className="mt-4 inline-block text-sm text-cyan-2" href={githubFieldGuide} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          </Panel>
          <DownloadGate />
        </div>
        <div className="mt-12 flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <button
              key={kind}
              onClick={() => setFilter(kind)}
              className={`rounded-full px-3 py-1 text-sm ${filter === kind ? "bg-white text-[#071018]" : "border border-line text-muted"}`}
            >
              {kind}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visible.map((item) => (
            <Link key={item.slug} to={`/resources/${item.slug}`} className="rounded-2xl border border-line p-5 hover:border-cyan/40">
              <p className="font-mono text-xs text-faint">
                {item.kind} · {item.meta}
              </p>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function DownloadGate() {
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const industry = String(data.get("industry") || "");
    const email = String(data.get("email") || "").trim();
    const emailError = workEmail(email);
    if (!name || !industry) {
      setError("Name and industry are required.");
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
    setDone(email);
  }
  return (
    <Panel className="p-6">
      <h3 className="font-semibold">Share your name, industry and work email to download the full document.</h3>
      {done ? (
        <div className="mt-4 text-sm leading-relaxed text-muted">
          <p>Thanks, {done}. This demo does not email a file.</p>
          <a className="mt-3 inline-block text-cyan-2" href={githubFieldGuide} target="_blank" rel="noreferrer">
            Read the AGSC field guide on GitHub
          </a>
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Name
            <input name="name" required className="mt-1 w-full rounded-xl border border-line bg-transparent px-3 py-2" />
          </label>
          <label className="block text-sm">
            Industry
            <select name="industry" required className="mt-1 w-full rounded-xl border border-line bg-[#10161d] px-3 py-2" defaultValue="">
              <option value="" disabled>
                Select
              </option>
              <option>Financial Services</option>
              <option>Healthcare</option>
              <option>Insurance</option>
              <option>Technology</option>
              <option>Other</option>
            </select>
          </label>
          <label className="block text-sm">
            Work email
            <input name="email" type="email" required className="mt-1 w-full rounded-xl border border-line bg-transparent px-3 py-2" />
          </label>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <button className="rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-[#04221c]" type="submit">
            Download the report
          </button>
        </form>
      )}
    </Panel>
  );
}

export function ResourcePage() {
  const { slug } = useParams();
  const item = resources.find((entry) => entry.slug === slug);
  useTitle(item?.title || "Resource");
  if (!item) return <Missing title="Resource" />;
  return (
    <main>
      <PageHero kicker={`${item.kind} · ${item.meta}`} title={item.title} lede={item.summary}>
        <Button href="/resources" variant="ghost">
          All resources
        </Button>
        <Button href="/contact#demo">Talk to an expert</Button>
      </PageHero>
      <article className="mx-auto max-w-3xl space-y-4 px-5 py-12 text-muted">
        {item.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}

export function BlogPage() {
  useTitle("Blog");
  const [filter, setFilter] = useState("All");
  const kinds = ["All", "Evaluations", "Governance", "Platform", "Security"];
  const visible = posts.filter((item) => filter === "All" || item.category === filter);
  return (
    <main>
      <PageHero
        kicker="Insights"
        title="The Decidion Blog"
        lede="Research, frameworks, and field notes on building, evaluating, and governing trustworthy AI agents in production."
      />
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap gap-2">
          {kinds.map((kind) => (
            <button
              key={kind}
              onClick={() => setFilter(kind)}
              className={`rounded-full px-3 py-1 text-sm ${filter === kind ? "bg-white text-[#071018]" : "border border-line text-muted"}`}
            >
              {kind}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4">
          {visible.map((item) => (
            <Link key={item.slug} to={`/blog/${item.slug}`} className="rounded-2xl border border-line p-5 hover:border-cyan/40">
              <p className="font-mono text-xs text-faint">
                {item.category} · {item.date} · {item.minutes}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.dek}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function BlogPostPage() {
  const { slug } = useParams();
  const item = posts.find((entry) => entry.slug === slug);
  useTitle(item?.title || "Blog");
  if (!item) return <Missing title="Article" />;
  return (
    <main>
      <PageHero kicker={`${item.category} · ${item.date} · ${item.minutes}`} title={item.title} lede={item.dek}>
        <Button href="/blog" variant="ghost">
          All posts
        </Button>
      </PageHero>
      <article className="mx-auto max-w-3xl space-y-4 px-5 py-12 leading-relaxed text-muted">
        {item.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}

export function PressPage() {
  useTitle("Press");
  return (
    <main>
      <PageHero kicker="Press" title="News from Decidion." lede="Announcements and milestones from our team." />
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-12">
        {press.map((item) => (
          <Link key={item.slug} to={`/press/${item.slug}`} className="block rounded-2xl border border-line p-5 hover:border-cyan/40">
            <p className="font-mono text-xs text-faint">
              {item.kicker} / {item.date}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.dek}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export function PressReleasePage() {
  const { slug } = useParams();
  const item = press.find((entry) => entry.slug === slug);
  useTitle(item?.title || "Press");
  if (!item) return <Missing title="Release" />;
  return (
    <main>
      <PageHero kicker={`${item.kicker} / ${item.date}`} title={item.title} lede={item.dek}>
        <Button href="/press" variant="ghost">
          All news
        </Button>
      </PageHero>
      <article className="mx-auto max-w-3xl space-y-4 px-5 py-12 text-muted">
        {item.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </article>
    </main>
  );
}

export function AboutPage() {
  useTitle("About");
  return (
    <main>
      <PageHero
        kicker="About"
        title="Decidion builds the control plane for multi-agent systems."
        lede="One platform for governance, risk management, compliance, data governance, security, and evaluations. From development through production. Purpose-built for regulated industries."
      />
      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-14 md:grid-cols-3">
        <Panel className="p-5">
          <h2 className="font-semibold">What we ship</h2>
          <p className="mt-2 text-sm text-muted">
            Agents register, submit tool calls, and receive ALLOW, ESCALATE, or BLOCK. Policies are code. Humans get a queue. The audit log is hash-chained.
          </p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">The field guide</h2>
          <p className="mt-2 text-sm text-muted">
            Agentic Governance & Security Controls (AGSC) is authored by COHUMAIN Labs and Decidion. 25 controls across Safety, Alignment, Governance, and Security.
          </p>
        </Panel>
        <Panel className="p-5">
          <h2 className="font-semibold">Talk to us</h2>
          <p className="mt-2 text-sm text-muted">hello@decidion.ai. We typically respond within one business day.</p>
          <Link to="/contact" className="mt-3 inline-block text-sm text-cyan-2">
            Contact
          </Link>
        </Panel>
      </section>
    </main>
  );
}

export function ContactPage() {
  useTitle("Contact");
  const [params] = useSearchParams();
  const topic = params.get("topic") || "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const emailError = workEmail(String(data.get("email") || ""));
    if (!String(data.get("name") || "").trim()) {
      setError("Name is required.");
      return;
    }
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
    setDone(true);
  }
  return (
    <main>
      <PageHero
        kicker="Get in touch"
        title="Contact Decidion"
        lede="Ready to transform your AI governance? Reach out and see how the control plane fits the agents you already run."
      />
      <section id="demo" className="mx-auto grid max-w-6xl gap-6 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          {[
            ["Schedule a Demo", "See Decidion in action with a personalized 30-minute demo tailored to your industry."],
            ["General Inquiry", "Questions about the platform, pricing, or capabilities."],
            ["Partnership Opportunities", "Interested in partnering? Tell us what you want to connect."],
          ].map(([title, line]) => (
            <Panel key={title} className="p-5">
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-muted">{line}</p>
            </Panel>
          ))}
          <p className="text-sm text-muted">
            Prefer email? <a className="text-cyan-2" href="mailto:hello@decidion.ai">hello@decidion.ai</a>. We typically respond within 24 hours on business days.
          </p>
        </div>
        <Panel className="p-6">
          {done ? (
            <p className="text-sm leading-relaxed text-muted">
              Thanks. This demo does not store the form or send email. Write hello@decidion.ai and we will follow up.
            </p>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <Field label="Name" name="name" />
              <Field label="Work email" name="email" type="email" />
              <Field label="Company" name="company" />
              <label className="block text-sm">
                Industry
                <select key={topic} name="industry" defaultValue={topic} className="mt-1 w-full rounded-xl border border-line bg-[#10161d] px-3 py-2">
                  <option value="">Select</option>
                  <option value="financial">Financial Services</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="insurance">Insurance</option>
                  <option value="technology">Technology</option>
                </select>
              </label>
              <label className="block text-sm">
                How can we help?
                <textarea name="message" rows={4} className="mt-1 w-full rounded-xl border border-line bg-transparent px-3 py-2" />
              </label>
              {error ? <p className="text-sm text-rose">{error}</p> : null}
              <button className="rounded-full bg-cyan px-4 py-2 text-sm font-semibold text-[#04221c]" type="submit">
                Send
              </button>
            </form>
          )}
        </Panel>
      </section>
    </main>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type={type} className="mt-1 w-full rounded-xl border border-line bg-transparent px-3 py-2" />
    </label>
  );
}

export function PrivacyPage() {
  useTitle("Privacy");
  return (
    <main>
      <PageHero
        kicker="Privacy"
        title="Privacy"
        lede="Questions about privacy go to hello@decidion.ai. This marketing demo does not persist contact-form submissions."
      />
      <article className="mx-auto max-w-3xl space-y-4 px-5 py-12 text-sm leading-relaxed text-muted">
        <p>
          The local control plane stores agent registrations, redacted tool-call payloads, escalations, evaluations, and a hash-chained audit log in the database you run. It is designed not to keep raw emails, SSNs, card numbers, or matched PHI patterns.
        </p>
        <p>
          Decidion provides governance and monitoring tools. Users are responsible for their own regulatory obligations. Nothing on this site is legal advice.
        </p>
      </article>
    </main>
  );
}

export function Missing({ title }: { title: string }) {
  useTitle(title);
  return (
    <main className="mx-auto max-w-3xl px-5 py-24">
      <p className="kicker">404</p>
      <h1 className="mt-3 text-4xl font-semibold">{title} not found</h1>
      <Link to="/" className="mt-6 inline-block text-cyan-2">
        Return home
      </Link>
    </main>
  );
}
