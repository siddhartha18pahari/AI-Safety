export const nav = [
  { href: "/solutions", label: "Solutions" },
  { href: "/industries", label: "Industries" },
  { href: "/customers", label: "Customers" },
  { href: "/compliance", label: "Compliance" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/press", label: "Press" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const pillars = [
  { title: "Governance", line: "Centralized policy management for AI agents" },
  { title: "Risk Management", line: "Real-time risk assessment and mitigation" },
  { title: "Compliance", line: "Automated regulatory compliance checks" },
  { title: "Data Governance", line: "Privacy and data handling policies" },
  { title: "Security", line: "Comprehensive protection for AI systems" },
  { title: "Evaluations", line: "Pre-deployment testing and assessments" },
];

export const lifecycle = ["Development", "Pre-Production", "Production", "Continuous Ops"];

export const badges = ["SOX Compliant", "AML Ready", "GDPR Aligned", "<100ms Response"];

export const rotations = [
  ["COMPLETE AI SECURITY", "GOVERNANCE & OBSERVABILITY"],
  ["REAL-TIME GOVERNANCE", "FOR AI AGENTS"],
  ["ENTERPRISE COMPLIANCE", "AT SCALE"],
];

export const frameworks = [
  {
    id: "langchain",
    name: "LangChain",
    blurb: "Wrap an AgentExecutor or runnable. The inner call runs only after ALLOW.",
    code: `from decidion import Decidion
from decidion.adapters.langchain import govern_runnable

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
agent = client.register_agent(
    name="credit-underwriter",
    framework="langchain",
    tools_allowed=["lookup_applicant", "approve_loan"],
    industry="financial",
)
guarded = govern_runnable(client, agent["id"], langchain_agent)
guarded.invoke({"application_id": "A-10492", "amount": 240000})
# ESCALATE and BLOCK raise before langchain_agent.invoke`,
  },
  {
    id: "crewai",
    name: "CrewAI",
    blurb: "Govern kickoff for a crew. The crew does not start on ESCALATE or BLOCK.",
    code: `from decidion import Decidion
from decidion.adapters.crewai import GovernedCrew

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
governed = GovernedCrew(client, "agt_support", crew)
governed.kickoff({"ticket": "T-100", "amount": 1500})`,
  },
  {
    id: "autogen",
    name: "AutoGen",
    blurb: "Wrap a reply function. Tool-using replies are scored before they return.",
    code: `from decidion import Decidion
from decidion.adapters.autogen import govern_reply

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
assistant.generate_reply = govern_reply(client, "agt_coding", assistant.generate_reply)`,
  },
  {
    id: "langgraph",
    name: "LangGraph",
    blurb: "Put a governed node in front of each tool step in the graph.",
    code: `from decidion import Decidion
from decidion.adapters.langgraph import govern_node

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
graph.add_node("pay", govern_node(client, "agt_claims", "issue_payment", pay_node))`,
  },
  {
    id: "custom",
    name: "Custom",
    blurb: "Any runtime can POST the proposed tool call and branch on the outcome.",
    code: `from decidion import Decidion, DecidionBlocked, DecidionEscalated

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
try:
    decision = client.decide(
        "agt_clinical",
        "draft_note",
        {"patient_id": "PT-14", "note": note},
    )
except (DecidionBlocked, DecidionEscalated) as stop:
    audit(stop.decision)
    return
run_tool(decision.redacted_arguments)`,
  },
];

export const restSnippet = `curl -s http://localhost:8000/v1/decide \\
  -H "Authorization: Bearer ddn_demo_local" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agt_credit",
    "tool": "approve_loan",
    "arguments": {"amount": 240000, "customer_id": "C-8830", "purpose": "facility"},
    "prompt": "Approve the facility request"
  }'
# {"outcome":"ESCALATE","route":"cfo","engine_ms":...}`;

export const webhookSnippet = `curl -s http://localhost:8000/v1/hooks/decide \\
  -H "Authorization: Bearer ddn_demo_local" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "agt_credit",
    "tool": "approve_loan",
    "arguments": {"amount": 240000, "customer_id": "C-8830", "purpose": "facility"},
    "prompt": "Approve the facility request"
  }'
# Same contract as /v1/decide: ALLOW, ESCALATE, or BLOCK`;

export const stats = [
  { value: "500+", label: "Agents Governed" },
  { value: "16", label: "Governance Agents" },
  { value: "<100ms", label: "Kill Switch Response" },
  { value: "97%", label: "Token Efficiency" },
  { value: "$12M+", label: "Annual ROI" },
];

export const quotes = [
  {
    quote: "Decidion makes your AI agents enterprise-ready, so you can deploy them throughout your company with confidence.",
    name: "Enterprise CISO",
    role: "Chief Information Security Officer • Fortune 500 Financial Services",
  },
  {
    quote: "Agent security is one of the biggest blindspots today. Decidion turns it into visibility, control, and trust.",
    name: "AI Risk Lead",
    role: "Head of AI Risk Management • Global Banking Institution",
  },
];

export const problems = [
  { title: "Unmanaged AI Everywhere", line: "Your team relies on AI agents for productivity across every department, but without centralized oversight." },
  { title: "Mass Data Exposure", line: "A single unsecured AI agent can leak PII, code, or sensitive business logic in seconds." },
  { title: "Compliance Gaps", line: "Each agent operates independently, exposing unknown attack surfaces and regulatory risks." },
  { title: "Zero Visibility or Control", line: "Without guardrails, observability and auditing, usage is invisible and unmanaged." },
];

export const capabilities = [
  { title: "Governance", line: "Centralized policy management" },
  { title: "Observability", line: "Full visibility into AI decisions" },
  { title: "Security", line: "Enterprise-grade protection" },
  { title: "Auditing", line: "Complete audit trails" },
  { title: "Compliance", line: "Automated regulatory checks" },
  { title: "Risk Management", line: "Real-time risk assessment" },
];

export const features = [
  {
    title: "Governance at Scale",
    line: "Monitor and control 500+ AI agents with 16 specialized governance agents that autonomously analyze, enforce, and escalate.",
    checks: ["Real-time decision analysis", "Autonomous policy enforcement", "Intelligent escalation routing"],
  },
  {
    title: "Kill Switches That Work",
    line: "Automatic protection in under 100ms when it matters most. 9 kill switch conditions covering bias, fraud, AML, and compliance.",
    checks: ["Sub-100ms response time", "9 automatic conditions", "Zero human delay"],
  },
  {
    title: "Human-in-the-Loop",
    line: "Route high-risk decisions to the right human reviewer with role-based escalation and SLA tracking.",
    checks: ["Role-based routing", "SLA tracking & alerts", "Decision audit trails"],
  },
  {
    title: "Audit-Ready",
    line: "Complete compliance documentation automatically generated. Immutable audit trails for SOX, AML, GDPR, and Fair Lending.",
    checks: ["Immutable audit logs", "Regulatory report generation", "SAR filing triggers"],
  },
  {
    title: "97% Token Efficiency",
    line: "Enterprise AI governance without enterprise AI costs. Local processing with only summaries sent to AI models.",
    checks: ["97% token reduction", "Cost-effective at scale", "Optimized processing"],
  },
  {
    title: "Framework Agnostic",
    line: "Works with LangChain, CrewAI, AutoGen, LangGraph, and custom frameworks. No rip-and-replace required.",
    checks: ["All major frameworks", "API, SDK, webhook integration", "Custom agent support"],
  },
];

export const coverage = [
  {
    title: "Governance",
    line: "Policy enforcement and decision oversight for multi-agent systems",
    items: [
      ["Policy Engine", "Automated policy enforcement"],
      ["Human-in-the-Loop", "Role-based escalation workflows"],
      ["Custom Policies", "Organization-specific rules"],
      ["Decision Audit", "Complete accountability trail"],
    ],
  },
  {
    title: "Risk Management",
    line: "Proactive risk identification and mitigation across agent operations",
    items: [
      ["Risk Monitoring", "Real-time risk scoring"],
      ["Incident Response", "Automated threat detection"],
      ["Kill Switches", "Protection in <100ms"],
      ["Risk Analytics", "Predictive insights"],
    ],
  },
  {
    title: "Compliance",
    line: "Regulatory alignment and audit-ready documentation",
    items: [
      ["Regulatory Compliance", "SOX, AML, GDPR, Fair Lending"],
      ["NIST & EU AI Act", "Framework compliance"],
      ["Audit Reports", "Automatic report generation"],
      ["Policy Validation", "Continuous monitoring"],
    ],
  },
  {
    title: "Data Governance",
    line: "Privacy, data handling, and information management policies",
    items: [
      ["Data Policies", "Privacy and data handling"],
      ["Access Control", "Permissions and audit"],
      ["Data Lineage", "Track data flow"],
      ["Data Protection", "Encryption controls"],
    ],
  },
  {
    title: "Security",
    line: "Comprehensive protection and threat mitigation for AI systems",
    items: [
      ["Model Security", "Protection against attacks"],
      ["Authorization", "Identity management"],
      ["Adversarial Defense", "Malicious input protection"],
      ["Threat Detection", "Real-time monitoring"],
    ],
  },
  {
    title: "Evaluations",
    line: "Pre-deployment testing and continuous performance assessment",
    items: [
      ["Model Evaluations", "Pre-deployment testing"],
      ["Red Team Testing", "Adversarial safety checks"],
      ["Agent Sandbox", "Safe testing environment"],
      ["Performance Metrics", "Accuracy and quality"],
    ],
  },
  {
    title: "Monitoring & Observability",
    line: "Real-time visibility into agent behavior and performance",
    items: [
      ["Console", "Centralized command center"],
      ["Drift Monitoring", "Detect behavioral changes"],
      ["Agent Observability", "Deep decision insights"],
      ["Performance Analytics", "Track efficiency"],
    ],
  },
  {
    title: "Management & Operations",
    line: "Orchestration, lifecycle, and operational efficiency",
    items: [
      ["Agent Management", "Deploy and control agents"],
      ["Orchestration", "Workflow coordination"],
      ["FinOps & ROI", "Cost optimization"],
      ["Model Lifecycle", "Version control"],
      ["Model Store", "Asset repository"],
    ],
  },
];

export const layers = [
  {
    layer: "Layer 1",
    title: "Human Oversight Layer",
    line: "Role-based escalation to Finance Managers, CFOs, and Compliance Officers with SLA tracking and decision authority",
  },
  {
    layer: "Layer 2",
    title: "Governance Agent Layer",
    line: "16 specialized agents monitoring every decision: Generic, Finance, AML, Fraud, System, Data Governance, and more",
  },
  {
    layer: "Layer 3",
    title: "Data & Policy Layer",
    line: "Centralized policies (P-GEN, P-FIN, P-AML), kill switch conditions, and immutable audit trails",
  },
  {
    layer: "Layer 4",
    title: "Operational Agent Fleet",
    line: "Your 500+ AI agents making decisions—monitored and governed in real-time by Decidion",
  },
];

export const industryBlocks = [
  {
    id: "financial-services",
    name: "Financial Services",
    tagline: "Protect Revenue, Reputation & Regulatory Standing",
    metrics: [
      ["99.97%", "Compliance Rate"],
      ["<100ms", "Kill Switch Response"],
      ["$45M+", "Fraud Prevented"],
      ["Zero", "Regulatory Fines"],
    ],
    challenges: [
      "Multi-billion dollar decisions made by AI agents without sufficient oversight",
      "Compliance violations leading to regulatory fines and reputational damage",
      "Model drift causing loan approval bias and fair lending violations",
      "Fraud detection agents missing sophisticated attack patterns",
    ],
    solutions: [
      ["Pre-Deployment Risk Assessment", "Red team testing and model evaluations catch bias before agents go live", "Prevented $12M in potential fair lending violations for a Tier 1 bank"],
      ["Real-Time Compliance Monitoring", "Continuous monitoring of agent decisions against SOX, AML, and Fair Lending regulations", "100% audit trail coverage with automated SAR filing triggers"],
      ["Autonomous Kill Switches", "Sub-100ms response when fraud patterns or compliance violations detected", "Stopped 347 high-risk transactions in Q1 across credit underwriting agents"],
      ["Human-in-the-Loop Escalation", "High-stakes decisions automatically routed to senior underwriters with full context", "Reduced decision bottlenecks by 73% while maintaining oversight"],
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    tagline: "Patient Safety Meets AI Innovation",
    metrics: [
      ["100%", "HIPAA Compliance"],
      ["Zero", "Patient Safety Events"],
      ["23", "Drift Events Caught"],
      ["65%", "Faster Audits"],
    ],
    challenges: [
      "Clinical decision support agents making recommendations without proper validation",
      "HIPAA violations from improper data handling by AI systems",
      "Treatment recommendation drift as models adapt to new data",
      "Lack of audit trails for regulatory inspections and malpractice defense",
    ],
    solutions: [
      ["Clinical Validation Pipeline", "Pre-deployment testing ensures agents meet clinical safety standards before patient exposure", "Validated 200+ clinical agents against evidence-based guidelines"],
      ["HIPAA-Compliant Observability", "Full visibility into agent behavior while maintaining patient privacy and data governance", "Zero HIPAA violations across 50,000+ daily agent interactions"],
      ["Drift Detection for Clinical Models", "Continuous monitoring catches when treatment recommendations deviate from approved protocols", "Identified and corrected 23 instances of model drift before patient impact"],
      ["Immutable Clinical Audit Trails", "Complete documentation of every agent decision for regulatory compliance and legal defense", "Audit-ready documentation reduced regulatory review time by 65%"],
    ],
  },
  {
    id: "insurance",
    name: "Insurance",
    tagline: "Underwrite with Confidence, Settle with Certainty",
    metrics: [
      ["$8.4M", "Fraud Detected"],
      ["100%", "Regulatory Compliance"],
      ["50", "State Jurisdictions"],
      ["Zero", "Bias Incidents"],
    ],
    challenges: [
      "Claims processing agents creating discrimination risk in payouts",
      "Underwriting AI making biased risk assessments leading to legal exposure",
      "Fraudulent claims slipping through automated detection systems",
      "Lack of transparency in agent decision-making for regulators and policyholders",
    ],
    solutions: [
      ["Bias Detection in Underwriting", "Pre-deployment and continuous testing for protected class discrimination in pricing and coverage", "Eliminated pricing disparities across protected classes for P&C insurer"],
      ["Claims Fraud Prevention", "Multi-layer agent surveillance detects sophisticated fraud patterns in real-time", "Identified $8.4M in fraudulent claims missed by legacy systems"],
      ["Explainable Decision Records", "Every underwriting and claims decision documented with full reasoning chain for regulatory review", "Reduced regulatory inquiry response time from weeks to hours"],
      ["Model Governance for Risk Assessment", "Continuous validation that actuarial agents comply with state regulations and internal policies", "Maintained compliance across 50 state jurisdictions with zero violations"],
    ],
  },
];

export const sectorPages = [
  {
    id: "financial",
    index: "01",
    name: "Financial Services",
    title: "Govern AI agents inside the most regulated workflows.",
    lede: "From advisory copilots to trading assistants and KYC automation, financial agents act on customer money in milliseconds. Decidion enforces policy at the action layer so every decision is auditable, reversible, and aligned to SR 11-7, MAS, and EU AI Act requirements.",
    stuck: [
      "Model risk teams blind to runtime agent behavior",
      "Auditors demanding evidence MLOps tools can't produce",
      "Prompt injection and tool-misuse risk in customer-facing copilots",
    ],
    delivers: [
      "SR 11-7 / MRM-aligned evidence pipeline",
      "Inline policy enforcement on every tool call",
      "Continuous adversarial testing across release candidates",
    ],
    contact: "financial",
  },
  {
    id: "healthcare",
    index: "02",
    name: "Healthcare & Life Sciences",
    title: "Safe, HIPAA-aligned governance for clinical and operational agents.",
    lede: "Clinical decision support, prior auth automation, and patient-facing copilots demand zero tolerance for hallucination or PHI leakage. Decidion provides the policy, evaluation, and observability layer needed to deploy LLM agents in care delivery and pharma R&D.",
    stuck: [
      "PHI exposure across prompts, retrievals, and tool outputs",
      "Hallucinated guidance reaching clinicians or patients",
      "FDA GMLP and HIPAA evidence gaps for agentic systems",
    ],
    delivers: [
      "PHI-aware data classification and redaction",
      "Clinical-grade evaluation suites and ground-truth gates",
      "Full provenance for every agent action and output",
    ],
    contact: "healthcare",
  },
  {
    id: "insurance",
    index: "03",
    name: "Insurance",
    title: "Underwriting, claims, and customer agents you can defend in court.",
    lede: "Agentic AI is rewriting underwriting and claims operations. Decidion keeps every automated decision explainable, fair, and aligned to NAIC AI principles, with continuous bias monitoring and a kill switch that operates at agent speed.",
    stuck: [
      "Bias and disparate-impact risk in automated decisions",
      "Lack of explainability for adverse-action notices",
      "Vendor model risk across third-party agent providers",
    ],
    delivers: [
      "Continuous fairness and drift monitoring",
      "Explainability artifacts attached to every decision",
      "Vendor and model lineage tracked end-to-end",
    ],
    contact: "insurance",
  },
];

export const useCases = [
  {
    slug: "coding-agents",
    eyebrow: "Decidion secures coding agents in FMCG",
    title: "Secure the coding agents shipping code across your Fortune 500 supply chain.",
    lede: "Runtime security for Cursor Agent, GitHub Copilot, Claude Code and Codex inside global consumer-goods enterprises, with subsecond detection, zero developer friction, and full audit trails for internal audit and SOX teams.",
    problem: "Coding agents are writing, merging, and deploying software across trade-promo, demand-planning, and plant-floor systems, with broad access, growing autonomy, and no security oversight.",
    approach: "Decidion secures both the coding agent and the code it ships, from the developer's IDE to the production ERP, MES, and eCommerce stack.",
    risks: [
      ["Unchecked access to trade and pricing systems", "Copilots operate with developer-level permissions across SAP, promo engines, and revenue-management tools. One permission bypass and an agent can rewrite pricing logic or push changes into production markets."],
      ["Exfiltration of formulas, contracts, and consumer data", "Proprietary recipes, private-label agreements, retailer contracts, and consumer PII flow through agent context constantly. A compromised MCP server or tool integration can quietly leak them to third-party endpoints."],
      ["Agents building vulnerable agents for the enterprise", "The demand-forecasting, chatbot, and RPA agents your coding copilots create inherit their blind spots. Malicious MCP servers, risky skills, and poisoned dependencies all flow downstream into production and into every plant."],
    ],
    steps: [
      ["Develop", "See everything your coding agents touch.", "Full visibility into every coding agent, the MCP servers and skills they connect to, the repos they modify, and the internal APIs they hit, without disrupting developer flow.", "Discover"],
      ["Build", "Continuously test the agents your coding agents ship.", "Coding agents produce non-deterministic outputs. Decidion continuously red-teams the agents they build, finding exploitable weaknesses before they reach store shelves or supply-chain endpoints.", "Ascend"],
      ["Deploy + Run", "Stop destructive actions before they execute.", "Subsecond runtime guardrails block data exfiltration, remote code execution, and unauthorized writes to trade, pricing, or plant systems, with full audit trails for SOX and internal audit.", "Defend"],
    ],
    faqs: [
      ["Which coding agents does Decidion support?", "Decidion covers Cursor Agent, GitHub Copilot, Claude Code, Codex, and Windsurf, with new agent coverage added continuously."],
      ["How does Decidion integrate without slowing our developers down?", "A thin client integration deploys in minutes and runs alongside existing IDE and terminal workflows. Detection runs at subsecond latency with no perceptible impact on developer flow."],
      ["Do you protect only the coding agent, or the agents it builds?", "Both. Defend provides runtime protection for the coding agent itself. Ascend continuously tests the custom agents your developers build before they reach production."],
      ["How is this different from SAST, DAST, or traditional code scanning?", "Traditional tools scan static code for known vulnerability patterns. Decidion secures the agent itself, its live behaviour, the actions it takes, the tools it invokes, and the data it accesses in real time."],
      ["Do you support internal audit and SOX evidence requirements?", "Yes. Every agent action, tool call, and policy decision is captured in an immutable audit log with reasoning chains, suitable for internal audit, SOX 404, and regulator requests."],
    ],
  },
  {
    slug: "customer-support",
    eyebrow: "Decidion secures customer-support agents",
    title: "Secure the AI agents talking to your Fortune 100 customers, every second.",
    lede: "Runtime security, evaluation, and governance for support copilots built on OpenAI, Anthropic, Bedrock, Vertex, and internal LLM stacks, with subsecond detection, human-escalation controls, and complete evidence trails for Trust, Legal, and Privacy.",
    problem: "Support agents now answer, refund, escalate, and act on behalf of your customers, with access to accounts, billing, entitlements, and knowledge, and almost no runtime oversight.",
    approach: "Decidion wraps the entire support-agent surface, from prompt to tool call to reply, with policy enforcement, red-team coverage, and evidence that stands up to Trust, Privacy, and Regulator scrutiny.",
    risks: [
      ["Prompt injection and jailbreaks from real customers", "Adversarial users craft messages to override system prompts, extract other customers' data, or trick the agent into issuing refunds, credits, or entitlements outside policy."],
      ["PII exfiltration through tool calls and RAG context", "Support agents touch CRM records, billing, support tickets, and knowledge bases. A compromised or manipulated agent can leak PII, payment data, or confidential tickets through its own responses or external tool calls."],
      ["Unsafe actions at scale, in milliseconds", "Refund tools, account-modification APIs, and entitlement changes execute in real time across millions of sessions. One drift in behaviour can trigger material financial loss and regulator attention before humans notice."],
    ],
    steps: [
      ["Discover", "Map every support agent, tool, and data path.", "Full inventory of every support agent in production and staging, the tools they call, the customer data they touch, and the models and vendors behind them.", "Discover"],
      ["Evaluate", "Red-team support agents like adversarial users do.", "Continuous adversarial testing across jailbreaks, social engineering, PII extraction, refund abuse, and policy-drift scenarios, tuned to your product surface and languages.", "Ascend"],
      ["Defend", "Enforce policy on every live conversation.", "Subsecond runtime guardrails block PII leakage, unauthorised refunds, off-policy claims, and destructive tool calls, and escalate to a human when confidence drops or risk rises.", "Defend"],
    ],
    faqs: [
      ["Which LLMs and support platforms does Decidion support?", "Decidion is model- and vendor-agnostic. It runs alongside OpenAI, Anthropic, Bedrock, Vertex, Azure OpenAI, and self-hosted models, and integrates with Zendesk, Salesforce Service Cloud, ServiceNow, Intercom, and in-house agent stacks."],
      ["What is the latency impact on live customer conversations?", "Runtime policy decisions add roughly 5-20 ms per tool call, small next to model latency. Support conversations feel unchanged; unsafe actions get blocked, transformed, or escalated inline."],
      ["How do you handle PII and consumer data?", "Decidion processes agent traffic within your environment or a dedicated tenant. PII is detected, tagged, and can be masked or blocked before it reaches vendor models or external tools. Retention and redaction policies are configurable."],
      ["How is this different from a traditional WAF or DLP?", "WAFs and DLPs operate at the network and file layer. Decidion operates at the intent layer, parsing what the agent is about to do and evaluating it against policy before the action is executed."],
      ["Can we prove compliance to auditors and regulators?", "Yes. Every prompt, response, tool call, and policy decision is captured with a reasoning trail, ready for internal audit, Trust reviews, GDPR and CCPA requests, and regulator inquiries."],
    ],
  },
];

export const customers = [
  {
    id: "bank",
    sector: "Financial Services",
    index: "01",
    org: "Global Tier-1 Bank",
    title: "Consolidating governance across 40+ customer-facing copilots",
    line: "Reduced model-risk review cycle from 9 weeks to 11 days by replacing spreadsheet-based controls with Decidion's runtime policy and evidence pipeline.",
    quote: "We finally have one place to see what our agents are doing, and prove it to regulators.",
    who: "Chief Model Risk Officer, Global Tier-1 Bank",
    metrics: [
      ["73%", "faster review cycle"],
      ["40+", "agents under one plane"],
      ["100%", "actions auditable"],
    ],
  },
  {
    id: "health",
    sector: "Healthcare",
    index: "02",
    org: "Multi-state Health System",
    title: "Safe deployment of clinical documentation agents",
    line: "Rolled out ambient clinical documentation across 12 specialties with PHI-aware policy enforcement and continuous hallucination evaluation.",
    quote: "Decidion turned 'maybe one day' into a production rollout our compliance team signs off on.",
    who: "VP, Clinical Informatics, Multi-state Health System",
    metrics: [
      ["0", "PHI exfiltration incidents"],
      ["12", "specialties live"],
      ["98.4%", "factual-grounding score"],
    ],
  },
  {
    id: "insurance",
    sector: "Insurance",
    index: "03",
    org: "National P&C Carrier",
    title: "Defensible automated underwriting at scale",
    line: "Continuous fairness monitoring and explainability artifacts attached to every automated decision, aligned with NAIC Model AI Bulletin.",
    quote: "Every automated decision has a story we can defend. That changed everything for our legal team.",
    who: "SVP, Underwriting Transformation, National P&C Carrier",
    metrics: [
      ["2.4x", "underwriting throughput"],
      ["0", "adverse-action gaps"],
      ["100%", "decisions explainable"],
    ],
  },
];

export const trustedBy = ["Tier-1 Bank", "Global Insurer", "Health System", "Pharma R&D", "Asset Manager", "Specialty Lender", "Reinsurer", "Healthcare Network"];

export const frameworksCompliance = [
  {
    index: "01",
    name: "NIST AI Risk Management Framework",
    meta: "NIST AI RMF 1.0",
    lede: "The U.S. NIST framework for trustworthy AI, organized around the Govern, Map, Measure, and Manage functions.",
    items: [
      ["Govern", "Policy-as-code engine, role-scoped approvals, evidence pipeline"],
      ["Map", "Agent inventory, tool catalog, data-class lineage"],
      ["Measure", "Capability, alignment, and adversarial evaluation suites"],
      ["Manage", "Inline enforcement, kill switch, incident response workflow"],
    ],
  },
  {
    index: "02",
    name: "EU AI Act",
    meta: "Regulation (EU) 2024/1689",
    lede: "The EU's risk-tiered regulation. Decidion provides the technical controls and documentation required for high-risk AI systems.",
    items: [
      ["Article 9: Risk Management", "Continuous risk assessment across the agent lifecycle"],
      ["Article 10: Data Governance", "Provenance, classification, and bias monitoring of training and runtime data"],
      ["Article 12: Logging", "Tamper-evident action logs with full prompt/tool/output capture"],
      ["Article 14: Human Oversight", "Inline approval, escalation, and reversible action patterns"],
      ["Article 15: Accuracy & Robustness", "Adversarial testing harness and drift detection"],
    ],
  },
  {
    index: "03",
    name: "ISO/IEC 42001",
    meta: "AI Management System",
    lede: "The first international standard for AI management systems. Decidion operationalizes the policies, controls, and evidence required for certification.",
    items: [
      ["Clause 6: Planning", "AI risk register integrated with agent inventory"],
      ["Clause 8: Operation", "Runtime controls, change management, incident workflows"],
      ["Clause 9: Performance Evaluation", "Continuous evaluation evidence and KPI dashboards"],
      ["Annex A Controls", "Mapped one-to-one to platform features and exportable evidence"],
    ],
  },
  {
    index: "04",
    name: "Sector Regulations",
    meta: "SR 11-7 · HIPAA · NAIC",
    lede: "Industry-specific obligations from financial services, healthcare, and insurance regulators, supported out of the box.",
    items: [
      ["SR 11-7 (Banking)", "Model risk inventory, validation evidence, ongoing monitoring"],
      ["HIPAA (Healthcare)", "PHI-aware redaction, BAAs, access logging, minimum-necessary policy"],
      ["NAIC AI Bulletin (Insurance)", "Fairness monitoring, explainability artifacts, vendor oversight"],
    ],
  },
];

export const resources = [
  {
    slug: "mom-g-mas-architecture",
    kind: "Whitepaper" as const,
    title: "The MOM-G-MAS Architecture: One Unified Plane for Agentic AI",
    summary: "A technical deep-dive into Model Operations, Governance, Monitoring, and Adversarial Security as a single runtime plane.",
    meta: "32 pages · Apr 2026",
    body: [
      "Why fragmented MLOps, GRC and SecOps stacks fail for production agents, and what a unified plane looks like.",
      "End-to-end reference architecture covering model, agent, tool and action layers. Control taxonomy mapped to NIST AI RMF, ISO 42001 and the EU AI Act.",
      "Patterns for runtime policy enforcement, evidence capture and human escalation. Reference deployment topologies for VPC, hybrid and air-gapped environments.",
      "Built for heads of AI platform, chief risk and compliance officers, enterprise architects, and security leaders.",
    ],
  },
  {
    slug: "eu-ai-act-mapping",
    kind: "Whitepaper" as const,
    title: "Mapping the EU AI Act to Production Agent Controls",
    summary: "Article-by-article translation of EU AI Act high-risk obligations into concrete platform controls and evidence artifacts.",
    meta: "24 pages · Mar 2026",
    body: [
      "Article 9 risk management, Article 10 data governance, Article 12 logging, Article 14 human oversight, and Article 15 accuracy and robustness, mapped to runtime controls.",
      "Each article names the evidence artifact an auditor can export from the control plane.",
    ],
  },
  {
    slug: "red-team-program",
    kind: "Guide" as const,
    title: "Building a Continuous Red-Team Program for LLM Agents",
    summary: "A field playbook for adversarial testing across prompt, tool, and action layers, without slowing release cadence.",
    meta: "Practitioner Guide",
    body: [
      "How to run a fixed scenario pack before promotion, then keep a smaller pack on every release candidate.",
      "Covers jailbreaks, PII extraction, refund abuse, and policy-drift cases.",
    ],
  },
  {
    slug: "runtime-policy-patterns",
    kind: "Guide" as const,
    title: "Runtime Policy Patterns for Tool-Using Agents",
    summary: "Reusable policy patterns for safe email, database, payment, and external-API tool calls.",
    meta: "Engineering Guide",
    body: [
      "Patterns for amount thresholds, allowlists, external-tool PII blocks, and human routes.",
      "Written as policy-as-code so risk and engineering review the same artifact.",
    ],
  },
  {
    slug: "beyond-mlops",
    kind: "Webinar" as const,
    title: "Beyond MLOps: Why Agentic Systems Need a New Control Plane",
    summary: "Live conversation with risk and platform leaders on what changes when models start acting on your systems.",
    meta: "On-demand · 45 min",
    body: ["What changes when a model can call a tool, and why logging the call after the fact is forensics rather than control."],
  },
  {
    slug: "audit-ready-evidence",
    kind: "Webinar" as const,
    title: "Audit-Ready Evidence for AI Agents",
    summary: "How to produce regulator-grade evidence pipelines without slowing engineering teams down.",
    meta: "On-demand · 38 min",
    body: ["A walkthrough of hash-chained decision logs, escalation records, and framework exports."],
  },
  {
    slug: "tier-1-bank-copilots",
    kind: "Case Study" as const,
    title: "Tier-1 Bank: Governing 40+ Customer-Facing Copilots",
    summary: "How a global bank consolidated agent governance onto Decidion and cut review cycle time by 73%.",
    meta: "Financial Services",
    body: [
      "Reduced model-risk review cycle from 9 weeks to 11 days by replacing spreadsheet-based controls with runtime policy and an evidence pipeline.",
      "40+ agents under one plane. 100% of actions auditable.",
    ],
  },
  {
    slug: "health-system-clinical-agents",
    kind: "Case Study" as const,
    title: "Health System: Safe Deployment of Clinical Documentation Agents",
    summary: "PHI-aware governance and continuous evaluation for ambient documentation across 12 specialties.",
    meta: "Healthcare",
    body: [
      "Deployed across 12 clinical specialties with PHI-aware policy enforcement at every tool boundary.",
      "Continuous evaluation against specialty-specific rubrics. Zero PHI incidents in the reported rollout.",
    ],
  },
];

export const posts = [
  {
    slug: "securing-coding-agents",
    category: "Security",
    date: "Jul 06, 2026",
    minutes: "7 min read",
    title: "Securing Coding Agents in the Fortune 500 Supply Chain",
    dek: "Copilots are shipping code into SAP, promo engines, and plant systems every hour. Here is how to secure them without slowing developers down.",
    body: [
      "Coding agents now sit on the path between a developer laptop and trade, pricing, and plant systems. The control that matters is the action the agent is about to take, not a scan of the diff after it lands.",
      "A thin wrapper in front of the tool call can inventory the agent, red-team what it generates, and block exfiltration or an unauthorized write without a perceptible pause in the IDE.",
    ],
  },
  {
    slug: "support-agents-attack-surface",
    category: "Security",
    date: "Jul 04, 2026",
    minutes: "6 min read",
    title: "Customer Support Agents Are the New Attack Surface",
    dek: "Every refund tool, entitlement API, and CRM read is one prompt away from misuse. Treat support agents like production infrastructure, not chatbots.",
    body: [
      "Support agents refund, change entitlements, and read other customers' records. A jailbreak in a ticket is an attempt to operate those tools.",
      "Treat the agent as production infrastructure: inventory every tool, red-team the conversation, and enforce policy before the refund or the CRM write.",
    ],
  },
  {
    slug: "structural-assurance-gap",
    category: "Platform",
    date: "May 20, 2026",
    minutes: "4 min read",
    title: "The Structural Assurance Gap: Why an independent AI review is not optional",
    dek: "An interactive walkthrough exploring why independent AI review is essential for structural assurance in agent governance.",
    body: [
      "The team that ships the agent cannot be the only team that asserts it is safe. Structural assurance needs an independent review path with its own evidence.",
      "That review has to see runtime decisions, not only the design document from before launch.",
    ],
  },
  {
    slug: "runtime-policy-enforcement",
    category: "Platform",
    date: "May 01, 2026",
    minutes: "6 min read",
    title: "Runtime Policy Enforcement: Stopping Bad Actions Before They Ship",
    dek: "Logging an unsafe agent action after the fact is forensics, not safety. Here's how to enforce policy at the tool-call layer without crippling latency.",
    body: [
      "A log of a wire that already left is a record of a loss. Enforcement has to sit on the proposed tool call and return allow, escalate, or block before the tool runs.",
      "The decision itself is small. Most of the latency in an agent turn is the model, not the policy check.",
    ],
  },
  {
    slug: "governing-agentic-ai",
    category: "Governance",
    date: "Apr 15, 2026",
    minutes: "7 min read",
    title: "Governing Agentic AI: Why Traditional Controls Fall Short",
    dek: "Autonomous agents act, decide, and chain tools in milliseconds. Static policies and after-the-fact audits can't keep up — here's the runtime model that can.",
    body: [
      "Policies written for a model that only returns text do not cover a model that calls tools. The unit of governance is the action.",
      "A runtime plane can apply the same policy to LangChain, CrewAI, AutoGen, LangGraph, or a custom loop, because each of them can present the proposed call.",
    ],
  },
  {
    slug: "evaluations-that-matter",
    category: "Evaluations",
    date: "Apr 02, 2026",
    minutes: "9 min read",
    title: "Evaluations That Matter: From Benchmarks to Behavior",
    dek: "Leaderboard scores rarely predict production safety. We break down a layered evaluation strategy spanning capability, alignment, and adversarial robustness.",
    body: [
      "A benchmark score does not tell you whether the agent will email a social security number or approve a loan with a protected attribute in the payload.",
      "Pre-deployment packs should name the behavior you refuse — injection, exfiltration, sanctions, bias — and record the outcome.",
    ],
  },
  {
    slug: "red-teaming-at-scale",
    category: "Security",
    date: "Mar 21, 2026",
    minutes: "6 min read",
    title: "Red-Teaming LLM Systems at Enterprise Scale",
    dek: "A practical playbook for continuous adversarial testing across prompts, tools, and downstream actions — without slowing your release cadence.",
    body: [
      "Run the pack in a sandbox so a failed case does not halt production. Promote only when the expected block, escalate, and allow outcomes hold.",
      "Keep the pack small enough to run on every release candidate, and add a case each time production surprises you.",
    ],
  },
  {
    slug: "lifecycle-of-trustworthy-ai",
    category: "Platform",
    date: "Mar 08, 2026",
    minutes: "8 min read",
    title: "The Lifecycle of Trustworthy AI: Dev to Continuous Ops",
    dek: "Trust isn't a launch checkbox. Map the controls that move with your model from development through pre-production, production, and continuous operations.",
    body: [
      "Development needs evaluations. Pre-production needs a policy dry run. Production needs enforcement, escalation, and a kill switch. Continuous ops needs drift and an audit chain.",
      "One plane should carry those controls so the evidence does not splinter across notebooks, tickets, and spreadsheets.",
    ],
  },
];

export const press = [
  {
    slug: "gartner-cool-vendor",
    date: "September 2026",
    kicker: "Company announcement",
    title: "Decidion recognized as a Cool Vendor in Gartner's Agentic AI Security and Governance report",
    dek: "Active runtime enforcement platform enables regulated enterprises to deploy safe, auditable AI agents at scale.",
    body: [
      "Decidion's monitoring, observability, and management platform for governance and security of multi-agent systems is purpose-built for regulated industries including banking, insurance, bio-pharma, and healthcare.",
      "The platform is described as an inline control plane that applies deterministic governance controls at machine speed, before agent actions are executed.",
      "Reported customer outcomes include reduced operational risk through proactive policy enforcement, faster compliance automation, and governance that does not require giving up agent autonomy.",
    ],
  },
  {
    slug: "canadian-technology-accelerator",
    date: "September 28, 2026",
    kicker: "Company announcement",
    title: "Decidion heads to San Francisco for the 2026 Canadian Technology Accelerator AI cohort",
    dek: "Decidion is one of seven Canadian startups selected from approximately 150 applicants for the 2026 Canadian Technology Accelerator AI cohort in Silicon Valley.",
    body: [
      "The Canadian Technology Accelerator dealbook introduces seven Canadian AI companies, including Decidion.",
      "The cohort runs in Silicon Valley and is aimed at companies building applied AI for serious operational environments.",
    ],
  },
];

export const githubFieldGuide = "https://github.com/HimJoe/Agentic-governance-and-security-controls-by-COHUMAIN-Labs-and-Safealign-AI";
