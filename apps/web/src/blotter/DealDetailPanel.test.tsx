import { expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DealDetailPanel } from './DealDetailPanel.js';
import { makeDeal } from '../test/fixtures.js';
import { renderWithProviders } from '../test/testUtils.js';

vi.mock('./DealAuditHistory.js', () => ({
  DealAuditHistory: () => <div data-testid="audit-history-stub">Audit history</div>,
}));

test('DealDetailPanel shows selected deal fields when open', () => {
  const deal = makeDeal({ counterparty: 'Citigroup', status: 'MATCHED', version: 3 });

  renderWithProviders(
    <DealDetailPanel deal={deal} open onClose={() => undefined} onStatusChange={() => undefined} />
  );

  expect(screen.getByRole('heading', { name: 'Trade' })).toBeInTheDocument();
  expect(screen.getByRole('dialog')).toHaveTextContent('Citigroup');
  expect(screen.getByRole('button', { name: 'MATCHED' })).toBeDisabled();
  expect(screen.getByRole('dialog')).toHaveTextContent('Version');
  expect(screen.getByRole('dialog')).toHaveTextContent('3');
  expect(screen.getByTestId('audit-history-stub')).toBeInTheDocument();
});

test('DealDetailPanel does not render deal content when closed', () => {
  renderWithProviders(
    <DealDetailPanel deal={makeDeal()} open={false} onClose={() => undefined} />
  );

  expect(screen.queryByText('Citigroup')).not.toBeInTheDocument();
});
