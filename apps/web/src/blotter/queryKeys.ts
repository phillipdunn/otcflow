export const dealQueryKeys = {
  all: ['deals'] as const,
  auditEvents: (dealId: string) => ['deals', dealId, 'auditEvents'] as const,
};

export const simulatorQueryKeys = {
  status: ['simulator', 'status'] as const,
};
