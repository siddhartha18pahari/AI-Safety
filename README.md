# Decidion

Decidion is an MVP control plane for governing AI agents, plus the marketing site that describes it.

Operational agents register and submit tool calls. A policy engine and a set of pluggable evaluators return **ALLOW**, **ESCALATE**, or **BLOCK**. Escalations go to a Finance Manager, CFO, or Compliance Officer. A hash-chained audit log records what happened. The console is the local control plane.

## Run it locally

Python 3.11+ and Node 22.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ./sdk -e "./api[dev]"
uvicorn decidion_api.main:app --reload --port 8000
```

In another shell:

```bash
cd web
npm install
npm run dev
```

- Marketing site: http://localhost:5173
- Console: http://localhost:5173/console
- API docs: http://localhost:8000/docs
- Demo API key: `ddn_demo_local` (sent as `Authorization: Bearer ddn_demo_local`)

The API uses SQLite at `./decidion.db` unless `DATABASE_URL` is set. Startup seeds demo agents, decisions, one halted agent, an escalation queue, and a completed evaluation.

```bash
pytest
```

## Docker Compose

Postgres for the API, nginx for the site. The web container proxies `/api` to the API.

```bash
docker compose up --build
```

- Site and console: http://localhost:8080
- API: http://localhost:8000

`DECIDION_LIVE_DEMO=1` in Compose submits a safe tool call every few seconds so the overview keeps moving. Leave it unset (or `0`) when you want a quiet database.

## End-to-end flow

```bash
curl -s http://localhost:8000/v1/decide \
  -H "Authorization: Bearer ddn_demo_local" \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"agt_credit","tool":"approve_loan","arguments":{"amount":240000,"customer_id":"C-8830","purpose":"facility"},"prompt":"Approve the facility"}'
```

A $240,000 loan escalates to the CFO. A protected attribute on `approve_loan` blocks and, if the bias kill switch is armed, halts the agent. The next call from that agent is a fast-path block. `POST /v1/hooks/decide` is the same contract for webhooks.

Python:

```python
from decidion import Decidion
from decidion.adapters.langchain import govern_runnable

client = Decidion("http://localhost:8000", api_key="ddn_demo_local")
guarded = govern_runnable(client, "agt_credit", langchain_agent)
guarded.invoke({"application_id": "A-10492"})  # raises on ESCALATE or BLOCK
```

The same package has CrewAI, AutoGen, and LangGraph adapters. They do not import those frameworks; they wrap any object with the expected method.

## What is in the box

| Piece | Behavior |
| --- | --- |
| Policy-as-code | P-GEN, P-FIN, P-AML, P-FRAUD, P-DG, P-SYS, plus custom policies such as P-SUPPORT |
| Evaluators | Generic, Finance, AML, Fraud, System, Data Governance, Drift, Custom |
| Kill switches | bias, fraud, aml, compliance, pii_exfiltration, prompt_injection, phi_exposure, policy_drift, unauthorized_tool |
| Escalations | finance_manager (4h), cfo (2h), compliance_officer (8h), with on-track / due-soon / breached |
| Audit | SHA-256 hash chain over canonical JSON. Verify in the console or `GET /v1/audit/verify` |
| Reports | `GET /v1/compliance/reports?framework=SOX\|AML\|GDPR\|EU_AI_ACT` |
| Evaluations | Fixed 10-scenario sandbox. It does not halt the agent |
| FinOps | Token estimate of the original payload versus the governance summary |

Seeded agents: `agt_credit`, `agt_claims`, `agt_clinical`, `agt_support`, `agt_coding`, `agt_kyc`, `agt_rogue` (halted).

## What is MVP, and what is not production

This build is a coherent local product, not a control plane you should point at real customers.

- **Auth** is one shared demo key. There are no tenants, SSO, or per-agent credentials.
- **Evaluators** are deterministic rules and regexes. They are not LLM judges or trained classifiers. "16 governance agents" on the marketing site is the product narrative; this process runs the eight evaluators listed above.
- **PII and PHI detection** is pattern matching (email, SSN, phone, Luhn-checked card, MRN, DOB, a simple diagnosis pattern). It is not a DLP or clinical NLP product. Matched text is redacted before it is stored.
- **Sanctions** are an illustrative four-country list, not OFAC or UN screening.
- **Kill switch** is a flag on the agent row, checked on the next call into this API. The SDK refuses to run the wrapped tool after BLOCK or ESCALATE. An agent that never calls Decidion is not stopped. Latency shown in the console is measured around this process. There is no network SLO, and "<100ms" on the marketing site is not a guarantee of this build.
- **Audit chain** is an application table plus an in-process lock. A database administrator can rewrite rows. It is not a WORM store or an external transparency log.
- **Token savings** are `len/4` estimates of the original payload versus a short summary. The marketing line "97% token efficiency" is the product claim for long-context summary forwarding. The console shows the ratio this database actually produced, at an illustrative $3 / million tokens. It is not an invoice.
- **Escalation** records a human approve or reject. It does not execute or roll back the business tool.
- **Drift** is the gap between recent block rate and a stored baseline, not distributional model drift.
- **Red-team harness** is a fixed scenario pack.
- No high availability, no SIEM export, no encryption story beyond what SQLite or Postgres gives you.
- Marketing pages reproduce the public product story (including industry metrics and press lines) under the Decidion name. They are not measurements from this MVP. Contact and download forms do not send email.

Nothing here is legal, compliance, or regulatory advice.
