/**
 * Collision-safe ids: ULIDs (26 Crockford base-32 characters, 48-bit millisecond timestamp
 * plus 80 random bits). They sort by creation time, which suits local-first sync, and two
 * devices creating records offline will not collide in practice.
 */

/** Produces a new unique id each call. Inject a seeded one in tests. */
export type IdGenerator = () => string;

/** Fills a byte array with random values. */
export type RandomBytes = (length: number) => Uint8Array;

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ULID_RE = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function isUlid(value: unknown): value is string {
  return typeof value === 'string' && ULID_RE.test(value);
}

function encodeTime(ms: number): string {
  if (!Number.isSafeInteger(ms) || ms < 0 || ms > 2 ** 48 - 1) throw new RangeError('ULID time out of range');
  let out = '';
  let rest = ms;
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD.charAt(rest % 32) + out;
    rest = Math.floor(rest / 32);
  }
  return out;
}

function encodeRandom(bytes: Uint8Array): string {
  // 80 bits -> 16 characters of 5 bits each.
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD.charAt((buffer >>> (bits - 5)) & 31);
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  return out;
}

function defaultRandomBytes(): RandomBytes {
  const cryptoLike = (globalThis as { crypto?: { getRandomValues?<T extends Uint8Array>(array: T): T } }).crypto;
  if (!cryptoLike?.getRandomValues) {
    return () => {
      throw new Error(
        'No crypto.getRandomValues in this runtime. Install a polyfill (for example expo-crypto) or pass `random` to createIdGenerator().',
      );
    };
  }
  return (length) => cryptoLike.getRandomValues!(new Uint8Array(length));
}

export interface IdGeneratorOptions {
  /** Milliseconds since the epoch. Default Date.now. */
  readonly now?: () => number;
  /** Source of random bytes. Default crypto.getRandomValues. */
  readonly random?: RandomBytes;
}

/** Creates a ULID generator. With no options it uses the clock and crypto.getRandomValues. */
export function createIdGenerator(options: IdGeneratorOptions = {}): IdGenerator {
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? defaultRandomBytes();
  return () => encodeTime(now()) + encodeRandom(random(10));
}

/**
 * A small, fast, deterministic PRNG (mulberry32). Not cryptographic: for tests,
 * sample data and property-style test loops only.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic ULIDs for tests and sample data: a fixed start time that advances 1 ms
 * per id and seeded random bits. Same seed, same sequence.
 */
export function createSeededIdGenerator(seed: number, startMs = Date.UTC(2026, 0, 1)): IdGenerator {
  const rand = createSeededRandom(seed);
  let ms = startMs;
  return createIdGenerator({
    now: () => ms++,
    random: (length) => Uint8Array.from({ length }, () => Math.floor(rand() * 256)),
  });
}
