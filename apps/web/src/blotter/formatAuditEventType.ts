import type { AuditEventType } from '@otcflow/shared';

const TYPE_LABELS: Record<AuditEventType, string> = {
  DEAL_CREATED: 'Deal created',
  DEAL_STATUS_CHANGED: 'Status changed',
  DEAL_AMENDED: 'Deal amended',
  DEAL_PRICE_CHANGED: 'Price changed',
};

export function formatAuditEventType(type: AuditEventType): string {
  return TYPE_LABELS[type];
}
