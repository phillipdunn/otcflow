import { expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import type { CustomCellRendererProps } from 'ag-grid-react';
import type { Deal } from '@otcflow/shared';
import { DealStatusCellRenderer } from './DealStatusCellRenderer.js';
import { renderWithProviders } from '../../../test/testUtils.js';

function renderStatus(status: Deal['status']) {
  const props = { value: status } as CustomCellRendererProps<Deal, Deal['status']>;
  renderWithProviders(<DealStatusCellRenderer {...props} />);
}

test('DealStatusCellRenderer renders a chip with the status label', () => {
  renderStatus('PENDING');
  expect(screen.getByText('PENDING')).toBeInTheDocument();
});

test('DealStatusCellRenderer uses success styling for BOOKED', () => {
  renderStatus('BOOKED');
  const chip = screen.getByText('BOOKED').closest('.MuiChip-root');
  expect(chip?.className).toMatch(/MuiChip-colorSuccess/);
});

test('DealStatusCellRenderer uses error styling for CANCELLED', () => {
  renderStatus('CANCELLED');
  const chip = screen.getByText('CANCELLED').closest('.MuiChip-root');
  expect(chip?.className).toMatch(/MuiChip-colorError/);
});
