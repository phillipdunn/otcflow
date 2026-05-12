import type { BlotterSortDirection, BlotterSortField } from './useBlotterView.js';

/** Suffix shown next to sort labels (inactive / asc / desc). */
export function sortChevronIndicator(
  field: BlotterSortField,
  activeField: BlotterSortField,
  direction: BlotterSortDirection
): string {
  if (field !== activeField) return '↕';
  return direction === 'asc' ? '↑' : '↓';
}
