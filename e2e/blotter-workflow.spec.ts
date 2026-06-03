import { expect, test } from '@playwright/test';

test('e2e: create deal, update status, verify audit history with acting user', async ({ page }) => {
  const counterparty = `E2E Bank ${Date.now()}`;

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'OTCFlow' })).toBeVisible();

  await page.getByRole('combobox', { name: 'Acting as' }).click();
  await page.getByRole('option', { name: /M\. Okonkwo \(Broker\)/ }).click();

  await page.getByRole('button', { name: 'New trade' }).click();
  await expect(page.getByRole('heading', { name: 'New trade' })).toBeVisible();

  await page.getByLabel('Counterparty').fill(counterparty);
  await page.getByLabel('Trader').fill('E2E Trader');
  await page.getByLabel('Broker').fill('E2E Broker');
  await page.getByRole('button', { name: 'Create trade' }).click();

  await expect(page.getByRole('heading', { name: 'New trade' })).toBeHidden({ timeout: 15_000 });

  const dealRow = page.locator('.ag-row').filter({ hasText: counterparty }).first();
  await expect(dealRow).toBeVisible({ timeout: 15_000 });
  await dealRow.click();

  await expect(page.getByRole('heading', { name: 'Trade' })).toBeVisible();

  const tradePanel = page.getByRole('dialog');
  await expect(tradePanel.getByText(counterparty)).toBeVisible();

  await tradePanel.getByRole('button', { name: 'PENDING', exact: true }).click();
  await expect(tradePanel.getByText('PENDING')).toBeVisible({ timeout: 10_000 });

  await expect(tradePanel.getByText('Audit history')).toBeVisible();
  await expect(tradePanel.getByText('M. Okonkwo')).toBeVisible();
  await expect(tradePanel.getByText(/Status changed from NEW to PENDING/)).toBeVisible();
  await expect(tradePanel.getByText(/Trade created with status NEW/)).toBeVisible();
});
