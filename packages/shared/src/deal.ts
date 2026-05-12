import { z } from 'zod';

/**
 * Coarse OTC product families (expand with sub-types later).
 * Covers rates (IRS/OIS), FX (options/swaps/NDFs), cash/rates (bond),
 * credit (single-name + index), and equity derivatives.
 */
export const PRODUCT_TYPE_VALUES = [
  'BOND',
  'CDS',
  'CDX',
  'EQUITY_OPTION',
  'EQUITY_SWAP',
  'FX_NDF',
  'FX_OPTION',
  'FX_SWAP',
  'IRS',
  'OIS',
] as const;
export const ProductTypeSchema = z.enum(PRODUCT_TYPE_VALUES);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const DEAL_STATUS_VALUES = ['NEW', 'PENDING', 'MATCHED', 'CANCELLED', 'BOOKED'] as const;
export const DealStatusSchema = z.enum(DEAL_STATUS_VALUES);
export type DealStatus = z.infer<typeof DealStatusSchema>;

export const CURRENCY_VALUES = ['GBP', 'USD', 'EUR'] as const;
export const CurrencySchema = z.enum(CURRENCY_VALUES);
export type Currency = z.infer<typeof CurrencySchema>;

export const DealSchema = z.object({
  id: z.string(),
  product: ProductTypeSchema,
  counterparty: z.string(),
  notional: z.number().positive(),
  currency: CurrencySchema,
  price: z.number(),
  status: DealStatusSchema,
  trader: z.string(),
  broker: z.string(),
  /** ISO 8601 (parseable by `Date`). */
  createdAt: z.string(),
  /** ISO 8601 (parseable by `Date`). */
  updatedAt: z.string(),
  version: z.number().int().nonnegative(),
});

export type Deal = z.infer<typeof DealSchema>;

export const DealsArraySchema = z.array(DealSchema);
