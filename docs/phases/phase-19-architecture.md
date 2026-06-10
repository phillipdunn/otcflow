# Phase 19 — Architecture and service boundaries (local notes)

**How phase docs are structured:** **Scope** → **Walkthrough (slow)** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

---

## Scope (what Phase 19 was)

- Expanded **`docs/architecture.md`** — modular monolith with **extractable logical boundaries**.
- Covers: runtime components, service boundaries, current vs future state, event flow, data ownership, failure modes, platform rationale.
- **README** repository layout link; **platform-context** cross-reference updated.
- **Documentation only** — no runtime code changes.
- **Not added:** microservice split, ADRs folder, OpenAPI per service, C4 diagrams as separate assets.

**Builds on:** [phase-12-event-bus-pubsub.md](phase-12-event-bus-pubsub.md), [phase-16-terraform.md](phase-16-terraform.md), [phase-17-automated-testing.md](phase-17-automated-testing.md).

---

## What problem this solves

| Before | After |
| ------ | ----- |
| Boundaries implied by folder names only | Named logical services (Deal, Audit, User, Simulator, Event/Notify) |
| Hard to explain extraction path | Documented monolith → broker → multi-service evolution |
| Event vs audit distinction scattered | Single event-flow section |
| Onboarding reads code only | Architecture doc + phase index |

---

## Walkthrough (slow)

### 1. Read order

1. **System overview** diagram (web → API → bus → DB/subscribers).
2. **Logical service boundaries** table with `apps/api` paths.
3. **Event flow** — command → transaction (deal + audit) → publish → WS + GraphQL.
4. **Data ownership** — who owns deals, audit, users, simulator state.
5. **Failure considerations** — DB down, subscriber drop, stale events.
6. **Future extractable state** — broker, split DBs, notification gateway.

### 2. Key distinction

- **Audit** = transactional append in service layer.
- **Domain event** = post-commit notification for live subscribers.
- **`/ws/deals`** = `DealEvent` + `sequenceNumber`; **GraphQL** = `DealDomainEvent` without sequence.

### 3. Link from other docs

- **README** intro + repository layout → `docs/architecture.md`
- **phase-index.md** — phases 1–19 map
- **platform-context.md** — desk vocabulary (complementary, not duplicate)

---

## Diagram

```text
Modular monolith today          Future extraction
─────────────────────          ───────────────────
apps/api (one process)    →    Deal Service + Audit Service + …
InMemoryDealEventBus      →    Kafka / SNS / RabbitMQ
One PostgreSQL            →    DB per bounded context
wireDealEventBusToWS      →    Notification / gateway service
```

---

## Key files

- `docs/architecture.md` (primary deliverable)
- `docs/phase-index.md`
- `README.md` — architecture link
- `docs/platform-context.md` — doc map table

---

## Checklist

- [ ] Architecture doc lists all seven logical boundaries
- [ ] Event flow matches actual `deal.service` + `dealEventBus` code
- [ ] Failure section mentions `/health/ready` and client sequence guards
- [ ] No runtime imports or code changes in Phase 19 PR

---

## Later

- ADR per extraction decision
- Diagrams in `docs/diagrams/` or Notion
- Update Terraform README when second ECS service is sketched
- Phase 20+ (auth/RBAC, runbook) cross-linked from architecture

---

## Review one-liner

**Phase 19** documents OTCFlow as a **modular monolith** — clear service boundaries, event flow, data ownership, and a credible path to independent services — in **`docs/architecture.md`**.
