# Phase 20 — Production-style runbook (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 20 was)

- **`docs/runbook.md`** — operations and incident response guide.
- Health endpoints (`/health`, `/health/live`, `/health/ready`), `/metrics`, structured logs.
- Nine incident scenarios with symptoms, checks, remediation, escalation.
- Local debugging commands (Compose, curl, migrate/seed, simulator stop).
- Prevention / hardening ideas (alerts, broker, DLQ, auth).
- **README** and cross-links from architecture, platform-context, phase-index.
- **Documentation only** — no runtime code changes.

**Builds on:** [phase-15-observability.md](phase-15-observability.md), [phase-19-architecture.md](phase-19-architecture.md).

---

## Walkthrough (slow)

1. Start with **Purpose** — who uses the runbook (on-call, local dev).
2. **Endpoints** — liveness vs readiness distinction.
3. **Logs** — grep by `requestId`, key `message` values from `logger.ts`.
4. **Scenarios** — work through DB down and WS not updating first (most common local).
5. **Commands** — copy-paste from §5 during an incident.
6. **Hardening** — forward-looking; ties to architecture extraction path.

---

## Key files

- `docs/runbook.md`
- `README.md` — Operations section link
- `apps/api/src/observability/` — implementation reference

---

## Checklist

- [ ] `curl /health/ready` documented matches actual 503 behaviour
- [ ] Each scenario has symptoms + checks + remediation
- [ ] No employer/client names in runbook text

---

## Later

- Prometheus `/metrics` format
- PagerDuty/Opsgenie alert templates
- Cloud-specific runbook appendix (ECS, RDS)

---

## Review one-liner

**Phase 20** adds **`docs/runbook.md`** — health, logs, metrics, incident playbooks, and local debug commands for operating OTCFlow.
