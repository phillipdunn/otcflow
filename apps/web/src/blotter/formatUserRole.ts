import type { UserRole } from '@otcflow/shared';

const ROLE_LABELS: Record<UserRole, string> = {
  BROKER: 'Broker',
  TRADER: 'Trader',
  SUPERVISOR: 'Supervisor',
  OPERATIONS: 'Operations',
};

export function formatUserRole(role: UserRole): string {
  return ROLE_LABELS[role];
}
