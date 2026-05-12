import type { Deal } from '@otcflow/shared';

const notionalDisplayFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const updatedAtTableFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const updatedAtDetailFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDealNotional(notional: number): string {
  return notionalDisplayFormatter.format(notional);
}

/** Compact timestamp for blotter rows. */
export function formatDealUpdatedAtTable(isoTimestamp: string): string {
  return updatedAtTableFormatter.format(new Date(isoTimestamp));
}

/** Slightly longer timestamp for the detail panel. */
export function formatDealUpdatedAtDetail(isoTimestamp: string): string {
  return updatedAtDetailFormatter.format(new Date(isoTimestamp));
}

export function formatDealPrice(deal: Deal): string {
  if (deal.currency === 'JPY' && deal.price < 1) return deal.price.toFixed(4);
  if (deal.product.includes('CDS') || deal.product.includes('CDX')) return deal.price.toFixed(2);
  return deal.price.toFixed(4);
}

export function dealStatusBadgeClassName(status: Deal['status']): string {
  return `blotter-status blotter-status--${status}`;
}
