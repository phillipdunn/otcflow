import { InMemoryDealEventBus } from './inMemoryDealEventBus.js';
import type { DealEventBus } from './eventBus.types.js';

/** Application-wide deal event bus (in-memory until a broker adapter is plugged in). */
export const dealEventBus: DealEventBus = new InMemoryDealEventBus();
