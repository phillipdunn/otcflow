import { z } from 'zod';
import { CurrencySchema, DealStatusSchema, ProductTypeSchema } from '@otcflow/shared';

/** Request body for POST /deals — server assigns id, timestamps, and initial version. */
export const CreateDealBodySchema = z.object({
  product: ProductTypeSchema,
  counterparty: z.string().trim().min(1).max(200),
  notional: z.number().positive(),
  currency: CurrencySchema,
  price: z.number(),
  status: DealStatusSchema.optional(),
  trader: z.string().trim().min(1).max(120),
  broker: z.string().trim().min(1).max(120),
});

export type CreateDealBody = z.infer<typeof CreateDealBodySchema>;

/** Request body for PATCH /deals/:id/status */
export const UpdateDealStatusBodySchema = z.object({
  status: DealStatusSchema,
});

export type UpdateDealStatusBody = z.infer<typeof UpdateDealStatusBodySchema>;
