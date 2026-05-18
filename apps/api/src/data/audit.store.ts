import type { AuditEvent } from '@otcflow/shared';

/** Append-only in-memory audit log (process-local; resets on restart). */
export class AuditEventStore {
  private events: AuditEvent[] = [];

  append(event: AuditEvent): void {
    this.events.push(event);
  }

  /** Newest first — activity feed convention. */
  getForDealNewestFirst(dealId: string): AuditEvent[] {
    return this.events
      .filter((e) => e.dealId === dealId)
      .slice()
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  clear(): void {
    this.events = [];
  }
}

export const auditEventStore = new AuditEventStore();
