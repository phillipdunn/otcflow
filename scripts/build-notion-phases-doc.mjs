#!/usr/bin/env node
/**
 * Merges docs/phases/phase-*.md into docs/phases/OTCFlow-Phases.md (gitignored output).
 * Run: node scripts/build-notion-phases-doc.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const phasesDir = join(root, 'docs', 'phases');
const outPath = join(phasesDir, 'OTCFlow-Phases.md');

const PHASE_ORDER = [
  ['phase-1-frontend-walkthrough.md', 'Phase 1 — Frontend blotter'],
  ['phase-2-api-deals-walkthrough.md', 'Phase 2 — API deals (REST)'],
  ['phase-3-frontend-tanstack-query.md', 'Phase 3 — TanStack Query'],
  ['phase-4-websocket-realtime.md', 'Phase 4 — WebSocket realtime'],
  ['phase-5-mui-ag-grid.md', 'Phase 5 — MUI + AG Grid'],
  ['phase-6-user-context.md', 'Phase 6 — Acting user context'],
  ['phase-7-audit-trail.md', 'Phase 7 — Audit trail'],
  ['phase-8-market-simulator.md', 'Phase 8 — Market simulator'],
  ['phase-9-postgres-persistence.md', 'Phase 9 — PostgreSQL persistence'],
  ['phase-10-docker-compose.md', 'Phase 10 — Docker Compose'],
  ['phase-11-testing.md', 'Phase 11 — Testing pyramid'],
  ['phase-12-event-bus-pubsub.md', 'Phase 12 — Internal event bus'],
  ['phase-13-graphql.md', 'Phase 13 — GraphQL API and subscriptions'],
  ['phase-14-ci-cd.md', 'Phase 14 — CI/CD (GitHub Actions)'],
  ['phase-15-observability.md', 'Phase 15 — Observability'],
  ['phase-16-terraform.md', 'Phase 16 — Terraform infrastructure skeleton'],
  ['phase-17-automated-testing.md', 'Phase 17 — Automated testing gaps'],
  ['phase-18-graphql-subscriptions.md', 'Phase 18 — GraphQL subscription integration tests'],
  ['phase-19-architecture.md', 'Phase 19 — Architecture and service boundaries'],
  ['phase-20-runbook.md', 'Phase 20 — Production-style runbook'],
  ['phase-21-platform-mapping.md', 'Phase 21 — Platform mapping documentation'],
];

function transformPhaseBody(raw, title) {
  let text = raw.replace(/\r\n/g, '\n');

  // Drop file-level H1 (replaced by section H1)
  text = text.replace(/^# Phase \d+[^\n]*\n+/, '');

  // Drop personal / structural boilerplate
  text = text.replace(
    /\*\*This folder \(`docs\/phases\/`\) is listed in `\.gitignore`\.\*\*[^\n]*\n+/g,
    '',
  );
  text = text.replace(
    /\*\*How phase docs are structured[^*]*\*\*[^\n]*\n+/g,
    '',
  );

  // Phase cross-links → plain references (Notion has no sibling .md files)
  text = text.replace(
    /\[([^\]]+)\]\(phase-\d+[^)]+\.md\)/g,
    '**$1** (another phase in this doc)',
  );
  text = text.replace(/\[([^\]]+)\]\(\.\.\/\.\.\/README\.md\)/g, '**README.md**');
  text = text.replace(/root \*\*README\.md\*\* →/g, 'repo root **README.md** →');
  text = text.replace(
    /\[([^\]]+)\]\(\.\.\/\.\.\/apps\/api\/DATABASE\.md\)/g,
    '**$1** (`apps/api/DATABASE.md` in the repo)',
  );

  // Bare phase filenames → pointer to this doc
  text = text.replace(/\*\*`phase-\d+[^`]+\.md`\*\*/g, '**this doc**');
  text = text.replace(/`phase-\d+[^`]+\.md`/g, 'this doc');
  text = text.replace(/see phase-\d+ doc/gi, 'see the matching phase section above');
  text = text.replace(
    /\*\*phase-\d+[^*]+\*\* \(another phase in this doc\)/g,
    'the matching phase section in this doc',
  );
  text = text.replace(/\*\*phase-\d+[^*]+\*\*/g, 'the matching phase section in this doc');

  // Drop leading horizontal rules after original file titles
  text = text.replace(/^---\n+/m, '');

  // Cursor-style fences → TypeScript + file hint (Notion-friendly)
  text = text.replace(
    /^```(\d+):(\d+):(.+)$/gm,
    (_, start, end, file) => {
      const lang = file.endsWith('.ts') || file.endsWith('.tsx') ? 'typescript' : 'text';
      return `\`\`\`${lang}\n// ${file} (lines ${start}–${end})`;
    },
  );

  // Normalize bare ```ts to ```typescript for Notion syntax highlighting
  text = text.replace(/^```ts$/gm, '```typescript');

  return text.trim();
}

function buildIntro() {
  return `# OTCFlow — build phases (1–21)

> **Notion setup:** Create a page (e.g. *OTCFlow phases*). Use **Import → Markdown** and choose \`docs/phases/OTCFlow-Phases.md\`, or paste one phase at a time. After import, turn each **Phase N** heading into a **toggle** (⋮ on the block → *Turn into* → *Toggle heading*) for a compact table of contents.
>
> **Local only (not committed):** This file and \`phase-*.md\` live under \`docs/phases/\` (gitignored). Regenerate after edits: \`node scripts/build-notion-phases-doc.mjs\`.

Each phase follows the same shape: **Scope** → **Walkthrough** → **Diagram** → **Key files** → **Checklist** → **Later** → **Review one-liner**.

| Phase | Topic |
| ----- | ----- |
| 1 | React blotter, mock deals, filters & sort |
| 2 | Express REST, in-memory deal store |
| 3 | TanStack Query replaces mocks |
| 4 | WebSocket \`/ws/deals\`, version merge |
| 5 | MUI chrome + AG Grid blotter |
| 6 | Acting-as user, \`x-user-id\`, \`req.currentUser\` |
| 7 | Append-only audit trail per deal |
| 8 | Market simulator, sequence numbers, live book |
| 9 | PostgreSQL + Prisma persistence |
| 10 | Docker Compose — web + api + postgres |
| 11 | Testing pyramid — Vitest, Supertest, MSW, Playwright |
| 12 | Internal event bus — domain events, WS bridge |
| 13 | GraphQL — queries, mutations, dealUpdated subscription |
| 14 | GitHub Actions CI — lint, typecheck, tests, build |
| 15 | Observability — logs, health probes, metrics, graceful shutdown |
| 16 | Terraform skeleton — AWS layout (educational, not deployed) |
| 17 | Test gaps — simulator, WebSocket E2E, shared schemas, health 503 |
| 18 | GraphQL subscription integration tests (\`dealUpdated\` E2E) |
| 19 | Architecture doc — modular monolith, service boundaries |
| 20 | Operations runbook — incidents, health, logs, remediation |
| 21 | Platform mapping — dry-run validation, deploy flow, readiness checklist |

For platform vocabulary (desk analogies, target stack), see **platform-context.md** in the repo. For a committed phase map, see **docs/phase-index.md**. For service boundaries, see **docs/architecture.md**. For on-call style debugging, see **docs/runbook.md**. For platform onboarding dry-runs, see **docs/platform-mapping.md**.

---
`;
}

function main() {
  const existing = readdirSync(phasesDir).filter((f) => f.endsWith('.md'));
  for (const [file] of PHASE_ORDER) {
    if (!existing.includes(file)) {
      console.error(`Missing phase file: ${file}`);
      process.exit(1);
    }
  }

  const sections = [buildIntro()];

  for (const [file, title] of PHASE_ORDER) {
    const raw = readFileSync(join(phasesDir, file), 'utf8');
    const body = transformPhaseBody(raw, title);
    sections.push(`# ${title}\n\n${body}\n\n---\n`);
  }

  const doc = `${sections.join('\n').replace(/\n---\n$/, '\n')}\n`;
  writeFileSync(outPath, doc, 'utf8');
  console.log(`Wrote ${outPath} (${doc.split('\n').length} lines)`);
}

main();
