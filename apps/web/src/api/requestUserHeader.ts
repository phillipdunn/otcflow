/** Set by {@link CurrentUserProvider} so mutation requests can send `x-user-id`. */
let currentUserIdProvider: (() => string | null) | null = null;

export function registerCurrentUserIdProvider(provider: () => string): void {
  currentUserIdProvider = provider;
}

export function unregisterCurrentUserIdProvider(): void {
  currentUserIdProvider = null;
}

/** Headers to attach on create/update requests (Step 6 mock user context). */
export function getMutationUserHeaders(): Record<string, string> {
  const id = currentUserIdProvider?.();
  if (!id) return {};
  return { 'x-user-id': id };
}
