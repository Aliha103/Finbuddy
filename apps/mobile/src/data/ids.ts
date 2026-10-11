import { createIdGenerator, type IdGenerator } from '@finbuddy/shared';
import { getRandomBytes } from 'expo-crypto';

/**
 * ULID generator for records created on this device. Random bits come from expo-crypto
 * (the platform's secure random source; crypto.getRandomValues on the web).
 */
export const newId: IdGenerator = createIdGenerator({ random: (length) => getRandomBytes(length) });
