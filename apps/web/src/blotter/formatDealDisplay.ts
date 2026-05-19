import type { Deal, DealStatus, ProductType } from '@otcflow/shared';

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

const spreadQuotedProducts: ReadonlySet<ProductType> = new Set(['CDS', 'CDX']);

const priceSigFigFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 3,
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
  if (spreadQuotedProducts.has(deal.product)) return deal.price.toFixed(2);
  return priceSigFigFormatter.format(deal.price);
}

export function dealStatusBadgeClassName(status: Deal['status']): string {
  return `blotter-status blotter-status--${status}`;
}

/** MUI `Chip` color for desk-style status cues (not business-rule semantics). */
export function dealStatusMuiColor(
  status: DealStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  switch (status) {
    case 'NEW':
      return 'info';
    case 'PENDING':
      return 'warning';
    case 'MATCHED':
      return 'secondary';
    case 'BOOKED':
      return 'success';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
}
