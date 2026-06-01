import { expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DealAuditHistory } from './DealAuditHistory.js';
import { makeAuditEvent } from '../test/fixtures.js';
import { renderWithProviders } from '../test/testUtils.js';
import { server } from '../test/msw/server.js';
import { auditEventsForDeal } from '../test/msw/dealHandlers.js';

test('DealAuditHistory renders audit events with user and summary', async () => {
  const dealId = 'deal-web-001';
  server.use(
    auditEventsForDeal(dealId, [
      makeAuditEvent({
        id: 'audit-status-1',
        type: 'DEAL_STATUS_CHANGED',
        summary: 'Status changed from NEW to PENDING',
        previousValue: 'NEW',
        newValue: 'PENDING',
        version: 2,
        user: { id: 'user-broker-01', name: 'M. Okonkwo', role: 'BROKER' },
      }),
      makeAuditEvent({
        id: 'audit-created-1',
        type: 'DEAL_CREATED',
        summary: 'Trade created with status NEW',
        version: 1,
      }),
    ])
  );

  renderWithProviders(<DealAuditHistory dealId={dealId} enabled />);

  await waitFor(() => {
    expect(screen.getByText(/Status changed from NEW to PENDING/)).toBeInTheDocument();
  });

  expect(screen.getAllByText(/M\. Okonkwo/).length).toBeGreaterThan(0);
  expect(screen.getByText(/Trade created with status NEW/)).toBeInTheDocument();
  expect(screen.getByText('NEW → PENDING')).toBeInTheDocument();
});
