export const dealQueryKeys = {
  all: ['deals'] as const,
  auditEvents: (dealId: string) => ['deals', dealId, 'auditEvents'] as const,
};
