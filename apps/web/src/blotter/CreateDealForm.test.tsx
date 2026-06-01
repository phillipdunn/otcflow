import { expect, test, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_MOCK_USER_ID } from '@otcflow/shared';
import { CreateDealForm } from './CreateDealForm.js';
import { makeDeal } from '../test/fixtures.js';
import { renderWithProviders } from '../test/testUtils.js';
import { server } from '../test/msw/server.js';
import { postDealCreates } from '../test/msw/dealHandlers.js';

test('CreateDealForm posts a new trade through the real API client', async () => {
  const user = userEvent.setup();
  const onCreated = vi.fn();
  let capturedUserId: string | null = null;

  server.use(
    postDealCreates(makeDeal({ id: 'deal-msw-new', counterparty: 'MSW Bank' }), (request) => {
      capturedUserId = request.headers.get('x-user-id');
    })
  );

  renderWithProviders(<CreateDealForm onCreated={onCreated} />, { withCurrentUser: true });

  await user.type(screen.getByLabelText(/^Counterparty/), 'MSW Bank');
  await user.type(screen.getByLabelText(/^Trader/), 'Test Trader');
  await user.type(screen.getByLabelText(/^Broker/), 'Test Broker');
  await user.click(screen.getByRole('button', { name: 'Create trade' }));

  await waitFor(() => {
    expect(onCreated).toHaveBeenCalledOnce();
  });

  expect(capturedUserId).toBe(DEFAULT_MOCK_USER_ID);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
