import { expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_MOCK_USER_ID, MOCK_USERS } from '@otcflow/shared';
import { AppBarUserSelect } from './AppBarUserSelect.js';
import { renderWithProviders } from '../test/testUtils.js';

test('AppBarUserSelect changes acting user when a different user is selected', async () => {
  const user = userEvent.setup();
  const supervisor = MOCK_USERS.find((u) => u.id === 'user-supervisor-01')!;

  renderWithProviders(<AppBarUserSelect variant="dock" />, { withCurrentUser: true });

  const select = screen.getByRole('combobox', { name: /acting as/i });
  expect(select).toHaveTextContent('A. Chen');

  await user.click(select);
  await user.click(screen.getByRole('option', { name: new RegExp(supervisor.name) }));

  expect(select).toHaveTextContent(supervisor.name);
  expect(select).not.toHaveTextContent(DEFAULT_MOCK_USER_ID);
});
