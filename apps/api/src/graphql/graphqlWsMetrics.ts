let activeGraphQLSubscriptionClients = 0;

export function getActiveGraphQLSubscriptionClients(): number {
  return activeGraphQLSubscriptionClients;
}

export function onGraphQLSubscriptionClientConnected(): void {
  activeGraphQLSubscriptionClients += 1;
}

export function onGraphQLSubscriptionClientDisconnected(): void {
  activeGraphQLSubscriptionClients = Math.max(0, activeGraphQLSubscriptionClients - 1);
}

/** Test helper. */
export function resetGraphQLSubscriptionClientCount(): void {
  activeGraphQLSubscriptionClients = 0;
}
