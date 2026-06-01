import { expect, test, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { Deal } from '@otcflow/shared';
import { DealBlotterGrid } from './DealBlotterGrid.js';
import { makeDeal } from '../../test/fixtures.js';
import { renderWithProviders } from '../../test/testUtils.js';

vi.mock('ag-grid-react', () => ({
  AgGridReact: ({
    rowData,
    onRowClicked,
  }: {
    rowData?: Deal[];
    onRowClicked?: (event: { data?: Deal }) => void;
  }) => (
    <div data-testid="deal-blotter-grid">
      {rowData?.map((deal) => (
        <button
          key={deal.id}
          type="button"
          data-testid={`deal-row-${deal.id}`}
          onClick={() => onRowClicked?.({ data: deal })}
        >
          {deal.counterparty} · {deal.status}
        </button>
      ))}
    </div>
  ),
}));

test('DealBlotterGrid renders a row per deal', () => {
  const deals = [
    makeDeal({ id: 'd1', counterparty: 'Goldman Sachs' }),
    makeDeal({ id: 'd2', counterparty: 'JPMorgan' }),
  ];

  renderWithProviders(
    <DealBlotterGrid deals={deals} selectedId={null} onSelectDeal={() => undefined} />
  );

  expect(screen.getByText(/Goldman Sachs/)).toBeInTheDocument();
  expect(screen.getByText(/JPMorgan/)).toBeInTheDocument();
});
