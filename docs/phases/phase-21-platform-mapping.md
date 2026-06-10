# Phase 21 — Platform mapping documentation (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 21 was)

- **`docs/platform-mapping.md`** — how OTCFlow maps to a generic modern platform.
- Why the repo is a useful **validation / dry-run** application.
- Component → platform capability table (web, API, DB, WS, GraphQL, CI, Terraform, observability).
- Dry-run questions, generic deployment flow, readiness checklist (build → rollback).
- Boundaries and caveats (not prod trading, demo auth, in-process bus, skeleton Terraform).
- Recommended validation exercises (deploy drills, outage drills, rollback).
- **README** and doc cross-links.
- **Documentation only** — no runtime code.

**Builds on:** [phase-16-terraform.md](phase-16-terraform.md), [phase-20-runbook.md](phase-20-runbook.md), [phase-19-architecture.md](phase-19-architecture.md).

---

## Key files

- `docs/platform-mapping.md`
- `README.md` — repository layout + intro link

---

## Review one-liner

**Phase 21** documents how OTCFlow maps to a **generic application platform** for onboarding, deployment, and operational readiness dry-runs — in **`docs/platform-mapping.md`**.
