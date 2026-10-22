import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Decision } from "../api";
import {
  badges,
  capabilities,
  coverage,
  features,
  frameworks,
  industryBlocks,
  layers,
  lifecycle,
  pillars,
  problems,
  quotes,
  restSnippet,
  rotations,
  stats,
  webhookSnippet,
} from "../data";
import { Button, Check, Outcome, Panel, useTitle } from "../ui";

export function HomePage() {
  useTitle("Decidion");
  return (
    <main>
      <Hero />
      <Integrations />
      <Testimonials />
      <Problems />
      <Solution />
      <FeatureGrid />
      <LifecycleGrid />
      <Architecture />
      <QuoteBand />
      <Industries />
      <GetStarted />
    </main>
  );
}

function Hero() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % rotations.length), 3800);
    return () => window.clearInterval(timer);
  }, []);
  const [lineA, lineB] = rotations[index];
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div>
          <p className="kicker">The unified plane for multi-agent systems</p>
          <div className="mt-5 min-h-[9.5rem]" aria-live="polite">
            <p key={lineA} className="rise text-3xl font-semibold tracking-tight text-cyan-2 sm:text-5xl">
              {lineA}
            </p>
            <p key={lineB} className="rise mt-1 text-3xl font-semibold tracking-tight sm:text-5xl">
              {lineB}
            </p>
          </div>
          <h1 className="mt-2 font-mono text-sm tracking-[0.28em] text-muted">ONE UNIFIED PLANE</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            The single platform for Governance, Risk Management, Compliance, Data Governance, Security, and Evaluations of Multi-Agent Systems. From development through production.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/contact#demo">Book a Demo</Button>
            <Button href="/console" variant="ghost">
              Watch Platform Tour
            </Button>
          </div>
        </div>
        <LiveTape />
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((item) => (
            <Panel key={item.title} className="p-5">
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.line}</p>
            </Panel>
          ))}
        </div>
        <ol className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          {lifecycle.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-line bg-panel px-3 py-1.5">{step}</span>
              {index < lifecycle.length - 1 ? <span className="text-faint">→</span> : null}
            </li>
          ))}
        </ol>
        <ul className="mt-6 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <li key={badge} className="rounded-full border border-cyan/30 bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan-2">
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const fallbackDecisions: Decision[] = [
  {
    id: "dec_demo1",
    agent_id: "agt_credit",
    agent_name: "Credit underwriter",
    framework: "langchain",
    tool: "approve_loan",
    arguments: { amount: 240000 },
    prompt: null,
    outcome: "ESCALATE",
    risk_score: 66,
    latency_ms: 4.2,
    engine_ms: 1.1,
    fast_path: false,
    reasons: ["Amount requires CFO review"],
    findings: [],
    redactions: [],
    route: "cfo",
    kill_condition: null,
    killed: false,
    escalation_id: null,
    created_at: "",
  },
  {
    id: "dec_demo2",
    agent_id: "agt_clinical",
    agent_name: "Clinical documentation",
    framework: "custom",
    tool: "draft_note",
    arguments: {},
    prompt: null,
    outcome: "ALLOW",
    risk_score: 18,
    latency_ms: 3.1,
    engine_ms: 0.8,
    fast_path: false,
    reasons: ["Payload redacted before retention"],
    findings: [],
    redactions: ["MRN"],
    route: null,
    kill_condition: null,
    killed: false,
    escalation_id: null,
    created_at: "",
  },
  {
    id: "dec_demo3",
    agent_id: "agt_rogue",
    agent_name: "Shadow underwriter",
    framework: "custom",
    tool: "approve_loan",
    arguments: {},
    prompt: null,
    outcome: "BLOCK",
    risk_score: 96,
    latency_ms: 2.4,
    engine_ms: 0.6,
    fast_path: false,
    reasons: ["Protected attribute included in a financial decision"],
    findings: [],
    redactions: [],
    route: null,
    kill_condition: "bias",
    killed: true,
    escalation_id: null,
    created_at: "",
  },
];

function LiveTape() {
  const [rows, setRows] = useState<Decision[]>(fallbackDecisions);
  useEffect(() => {
    api<Decision[]>("/v1/decisions?limit=3")
      .then((items) => {
        if (items.length) setRows(items);
      })
      .catch(() => setRows(fallbackDecisions));
  }, []);
  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="kicker">Control plane</p>
        <span className="font-mono text-[11px] text-faint">ALLOW · ESCALATE · BLOCK</span>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.id} className="border-b border-line px-4 py-3 last:border-b-0">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm">{row.agent_name || row.agent_id}</p>
              <Outcome value={row.outcome} />
            </div>
            <p className="mt-1 font-mono text-xs text-faint">
              {row.tool}
              {row.route ? ` · ${row.route}` : ""} · {row.engine_ms.toFixed(1)} ms engine
            </p>
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 text-xs text-faint">Live when the API is running. Otherwise this is the demo tape.</div>
    </Panel>
  );
}

function Code({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-6 text-[#d5e4ee]">
      {code.split("\n").map((line, index) => (
        <div key={index} className={line.trim().startsWith("#") ? "text-faint" : undefined}>
          {line || " "}
        </div>
      ))}
    </pre>
  );
}

function Integrations() {
  const [framework, setFramework] = useState(frameworks[0]);
  const [tab, setTab] = useState<"SDK" | "REST API" | "Webhook">("SDK");
  const code = tab === "SDK" ? framework.code : tab === "REST API" ? restSnippet : webhookSnippet;
  return (
    <section id="integrations" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Integrations</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Seamless integration with leading AI frameworks</h2>
        <p className="mt-4 max-w-2xl text-muted">
          LangChain, CrewAI, AutoGen, LangGraph, and custom runtimes call the same decide API. The SDK raises before the tool runs. REST and the webhook alias return the same outcome.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {frameworks.map((item) => (
              <button
                key={item.id}
                onClick={() => setFramework(item)}
                className={`rounded-xl border px-3 py-3 text-left text-sm ${framework.id === item.id ? "border-cyan/50 bg-cyan/10 text-ink" : "border-line text-muted"}`}
              >
                <span className="block font-medium text-ink">{item.name}</span>
                <span className="mt-1 block text-xs leading-relaxed">{item.blurb}</span>
              </button>
            ))}
          </div>
          <Panel className="overflow-hidden">
            <div className="flex gap-2 border-b border-line px-3 py-2">
              {(["SDK", "REST API", "Webhook"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  className={`rounded-full px-3 py-1 text-xs ${tab === item ? "bg-white text-[#071018]" : "text-muted"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <Code code={code} />
          </Panel>
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-5">
          {stats.map((item) => (
            <div key={item.label}>
              <dt className="text-2xl font-semibold text-cyan-2 md:text-3xl">{item.value}</dt>
              <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Trusted by industry leaders</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">One platform to deploy AI faster, safely.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {quotes.map((item) => (
            <figure key={item.name} className="rounded-2xl border border-line bg-panel/70 p-6">
              <blockquote className="font-serif text-2xl leading-snug text-ink">“{item.quote}”</blockquote>
              <figcaption className="mt-6">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted">{item.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problems() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Making AI enterprise-ready</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">AI tools your teams love leak data and create risk.</h2>
        <p className="mt-4 text-muted">Most AI deployments are vulnerable. They don't have to be.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {problems.map((item, index) => (
            <Panel key={item.title} className="p-5">
              <p className="font-mono text-xs text-faint">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.line}</p>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  return (
    <section id="solution" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Solution</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">Decidion is the command and control plane for AI agents</h2>
        <p className="mt-4 max-w-2xl text-muted">Discover how Decidion connects any agent, any framework, anywhere securely.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((item) => (
            <div key={item.title} className="rounded-2xl border border-line p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted">{item.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">The problem we solve</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">The unified plane for multi-agent systems</h2>
        <p className="mt-4 text-muted">One platform unifying Governance, Risk, Compliance, Data Governance, Security & Evaluations</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <Panel key={item.title} className="p-5">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.line}</p>
              <ul className="mt-4 space-y-2">
                {item.checks.map((check) => (
                  <Check key={check}>{check}</Check>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </section>
  );
}

function LifecycleGrid() {
  return (
    <section id="lifecycle" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Unified governance plane</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Complete lifecycle coverage: development to production</h2>
        <p className="mt-4 max-w-3xl text-muted">One unified plane for monitoring, observability, and management of governance and security—covering 30+ capabilities</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {coverage.map((group) => (
            <Panel key={group.title} className="p-5">
              <h3 className="text-lg font-semibold">{group.title}</h3>
              <p className="mt-1 text-sm text-muted">{group.line}</p>
              <ul className="mt-4 divide-y divide-line">
                {group.items.map(([name, detail]) => (
                  <li key={name} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                    <span>{name}</span>
                    <span className="text-right text-muted">{detail}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
        <div className="mt-8">
          <p className="font-medium">One unified plane across the entire lifecycle</p>
          <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
            {lifecycle.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span>{step}</span>
                {index < lifecycle.length - 1 ? <span>→</span> : null}
              </li>
            ))}
          </ol>
          <p className="mt-3 max-w-3xl text-sm text-muted">
            Decidion unifies Governance, Risk Management, Compliance, Data Governance, Security, and Evaluations into a single plane.
          </p>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section id="architecture" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Architecture</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">Four-layer architecture</h2>
        <p className="mt-4 max-w-2xl text-muted">From autonomous enforcement to human oversight—governance that scales with your AI operations</p>
        <div className="mt-8 grid gap-3">
          {layers.map((item) => (
            <div key={item.layer} className="grid gap-2 rounded-2xl border border-line bg-panel/60 p-5 md:grid-cols-[140px_1fr]">
              <p className="font-mono text-xs text-cyan-2">{item.layer}</p>
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.line}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 font-mono text-sm tracking-wide text-ink">Three decision outcomes: ALLOW · ESCALATE · BLOCK</p>
      </div>
    </section>
  );
}

function QuoteBand() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <blockquote className="max-w-3xl font-serif text-2xl leading-snug md:text-3xl">
          “Decidion gave us the confidence to deploy 200+ AI agents across our lending operations. We went from manual spot-checks to real-time governance of every decision—and our last regulatory exam had zero AI-related findings.”
        </blockquote>
        <p className="mt-6 font-medium">Chief Risk Officer</p>
        <p className="text-sm text-muted">Major US Financial Institution</p>
        <p className="mt-6 text-sm text-muted">Trusted by enterprises in Financial Services · Healthcare · Insurance · Pharmaceuticals</p>
      </div>
    </section>
  );
}

export function Industries() {
  return (
    <section id="industries" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Industries</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Built where agent failure is not an option</h2>
        <div className="mt-10 space-y-12">
          {industryBlocks.map((block) => (
            <article key={block.id} id={block.id}>
              <h3 className="text-2xl font-semibold">{block.name}</h3>
              <p className="mt-1 text-muted">{block.tagline}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {block.metrics.map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-line p-4">
                    <dt className="text-2xl font-semibold text-cyan-2">{value}</dt>
                    <dd className="mt-1 text-xs uppercase tracking-wider text-muted">{label}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Panel className="p-5">
                  <h4 className="font-medium">Industry challenges</h4>
                  <ul className="mt-3 space-y-2 text-sm text-muted">
                    {block.challenges.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </Panel>
                <div className="space-y-3">
                  {block.solutions.map(([title, line, outcome]) => (
                    <Panel key={title} className="p-4">
                      <h4 className="font-medium">{title}</h4>
                      <p className="mt-1 text-sm text-muted">{line}</p>
                      <p className="mt-2 text-sm text-cyan-2">{outcome}</p>
                    </Panel>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStarted() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="kicker">Get started</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">Ready to govern your AI fleet with confidence?</h2>
        <p className="mt-4 max-w-2xl text-muted">
          See how Decidion enables enterprises to scale AI operations while maintaining complete governance, compliance, and control.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/contact#demo">Book a Demo</Button>
          <Button href="/resources" variant="ghost">
            Download Overview
          </Button>
        </div>
        <p className="mt-4 text-sm text-faint">30-minute demo · Custom use case · Technical Q&A · No commitment · hello@decidion.ai</p>
        <p className="mt-6 text-sm">
          <Link to="/console" className="text-cyan-2">
            Open the platform console
          </Link>
        </p>
      </div>
    </section>
  );
}
