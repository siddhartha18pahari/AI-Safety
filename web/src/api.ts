export const API_KEY = import.meta.env.VITE_DECIDION_API_KEY || "ddn_demo_local";

export class ApiError extends Error {}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init?.headers || {}),
    },
  });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) {
        detail = body.detail.map((item: { msg?: string }) => item.msg || JSON.stringify(item)).join("; ");
      } else if (body.detail) detail = JSON.stringify(body.detail);
    } catch {
      detail = await response.text();
    }
    throw new ApiError(detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type Agent = {
  id: string;
  name: string;
  framework: string;
  owner: string;
  environment: string;
  status: string;
  industry: string;
  description: string;
  tools_allowed: string[];
  baseline_block_rate: number;
  created_at: string;
};

export type Finding = {
  evaluator: string;
  policy_id: string;
  rule_id: string;
  outcome: string;
  reason: string;
  route: string | null;
  kill_condition: string | null;
};

export type Decision = {
  id: string;
  agent_id: string;
  agent_name: string;
  framework: string;
  tool: string;
  arguments: Record<string, unknown>;
  prompt: string | null;
  outcome: "ALLOW" | "ESCALATE" | "BLOCK" | string;
  risk_score: number;
  latency_ms: number;
  engine_ms: number;
  fast_path: boolean;
  reasons: string[];
  findings: Finding[];
  redactions: string[];
  route: string | null;
  kill_condition: string | null;
  killed: boolean;
  escalation_id: string | null;
  created_at: string;
};

export type Escalation = {
  id: string;
  decision_id: string;
  agent_id: string;
  agent_name: string;
  role: string;
  role_label: string;
  status: string;
  sla_due_at: string;
  sla_state: string;
  created_at: string;
  resolved_at: string | null;
  resolver: string | null;
  note: string | null;
};

export type Policy = {
  id: string;
  name: string;
  description: string;
  rules: Array<Record<string, unknown>>;
  enabled: boolean;
  custom: boolean;
  version: number;
};

export type KillSwitch = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: number | null;
  trip_count: number;
  last_tripped_at: string | null;
};

export type AuditEvent = {
  seq: number;
  event_type: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
  created_at: string;
};

export type Metrics = {
  agents: { total: number; active: number; halted: number };
  decisions: { total: number; allow: number; escalate: number; block: number };
  latency_ms: { p50: number; p95: number; samples: number };
  escalations: { open: number; breached: number; resolved: number };
  kill_switches: { armed: number; trips: number };
  redactions: number;
  drift: Array<{
    agent_id: string;
    name: string;
    status: string;
    baseline_block_rate: number;
    recent_block_rate: number;
    drift: number;
    state: string;
  }>;
  hourly: Array<{ hour: string; ALLOW: number; ESCALATE: number; BLOCK: number }>;
  note: string;
};

export type FinOps = {
  tokens_in: number;
  tokens_forwarded: number;
  savings_ratio: number;
  illustrative_price_per_million_usd: number;
  illustrative_ungoverned_usd: number;
  illustrative_forwarded_usd: number;
  note: string;
};

export type Evaluation = {
  id: string;
  agent_id: string;
  status: string;
  passed: number;
  failed: number;
  duration_ms: number;
  scenarios: Array<{
    name: string;
    expect: string;
    outcome: string;
    passed: boolean;
    reasons: string[];
  }>;
  created_at: string;
  note?: string;
};

export type Report = {
  framework: string;
  generated_at: string;
  audit_verified: boolean;
  audit_detail: string | null;
  audit_events: number;
  controls: Array<{ id: string; title: string; citation: string; count: number; sample_ids: string[] }>;
  disclaimer: string;
};
