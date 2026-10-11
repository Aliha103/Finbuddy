/**
 * HTTP client skeleton for the future FinBuddy backend. Not wired to any server: nothing in
 * the app calls it yet, and the local Repository stays the source of truth until a backend exists.
 *
 * Everything platform-specific is injected (fetch, token storage, timers), so it runs the same
 * on React Native, the web and in tests. Tokens never go to localStorage: the mobile app
 * supplies a TokenStore backed by secure storage (e.g. expo-secure-store).
 */
import type { CurrencyCode } from '../money/currencies';
import type { ExchangeRate } from '../fx/fx';
import type { LocalDate } from '../model/dates';
import type { Budget, Expense, Group, Person, Profile, Settlement } from '../model/types';

/** Minimal structural types so this file needs no DOM or Node typings. */
export interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly headers: { get(name: string): string | null };
  text(): Promise<string>;
}
export interface AbortSignalLike {
  readonly aborted: boolean;
}
export interface FetchInitLike {
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignalLike;
}
export type FetchLike = (url: string, init: FetchInitLike) => Promise<FetchResponseLike>;

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken?: string;
}

/** Where tokens live. Implement with secure device storage; never localStorage. */
export interface TokenStore {
  getTokens(): Promise<AuthTokens | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

/** A TokenStore that keeps tokens in memory only (tests, or until secure storage is wired). */
export class MemoryTokenStore implements TokenStore {
  private tokens: AuthTokens | null = null;
  async getTokens() {
    return this.tokens;
  }
  async setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
  }
  async clear() {
    this.tokens = null;
  }
}

/** Base class for every client error; switch on `kind`. */
export class ApiError extends Error {
  readonly kind: 'http' | 'network' | 'timeout' | 'parse';
  readonly status: number | null;
  readonly body: unknown;
  constructor(kind: ApiError['kind'], message: string, status: number | null = null, body: unknown = undefined) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

export interface ApiClientOptions {
  /** e.g. "https://api.example.com/v1" (no trailing slash needed). */
  readonly baseUrl: string;
  /** Usually globalThis.fetch. */
  readonly fetch: FetchLike;
  readonly tokenStore: TokenStore;
  /** Per-request timeout in ms. Default 15000. */
  readonly timeoutMs?: number;
  /**
   * Called on every 401 response before the ApiError is thrown (clear the session, route to sign-in).
   * Errors thrown by the hook are swallowed so the caller still receives the 401.
   */
  readonly onUnauthorized?: (error: ApiError) => void | Promise<void>;
  /** AbortController factory; defaults to globalThis.AbortController. */
  readonly createAbortController?: () => { readonly signal: AbortSignalLike; abort(): void };
  /** Timer functions; default to the globals. */
  readonly setTimeout?: (fn: () => void, ms: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}

export interface RequestOptions {
  readonly body?: unknown;
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>;
  /** Skip the Authorization header (sign-in, sign-up). */
  readonly anonymous?: boolean;
  readonly timeoutMs?: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** CRUD endpoints for one resource. */
export interface ResourceApi<T, TCreate = Omit<T, 'id' | 'createdAt' | 'updatedAt'>> {
  list(query?: RequestOptions['query']): Promise<T[]>;
  get(id: string): Promise<T>;
  create(input: TCreate): Promise<T>;
  update(id: string, patch: Partial<TCreate>): Promise<T>;
  delete(id: string): Promise<void>;
}

/** The backend contract the app expects. Paths are placeholders until the API is designed. */
export interface ApiClient {
  request<T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T>;
  readonly auth: {
    signIn(email: string, password: string): Promise<AuthTokens>;
    signUp(input: { email: string; password: string; displayName: string }): Promise<AuthTokens>;
    signOut(): Promise<void>;
  };
  readonly me: { get(): Promise<Profile>; update(patch: Partial<Profile>): Promise<Profile> };
  readonly people: ResourceApi<Person>;
  readonly groups: ResourceApi<Group> & { join(inviteCode: string): Promise<Group> };
  readonly expenses: ResourceApi<Expense>;
  readonly settlements: ResourceApi<Settlement> & { confirm(id: string): Promise<Settlement> };
  readonly budgets: ResourceApi<Budget>;
  readonly rates: { list(query?: { base?: CurrencyCode; asOf?: LocalDate }): Promise<ExchangeRate[]> };
}

function joinUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const params = Object.entries(query ?? {})
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

type Globals = {
  AbortController?: new () => { readonly signal: AbortSignalLike; abort(): void };
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
};

/** Creates the fetch-based ApiClient. */
export function createApiClient(options: ApiClientOptions): ApiClient {
  const g = globalThis as unknown as Globals;
  const makeController = options.createAbortController ?? (g.AbortController ? () => new g.AbortController!() : undefined);
  const setTimer = options.setTimeout ?? g.setTimeout;
  const clearTimer = options.clearTimeout ?? g.clearTimeout;

  async function request<T>(method: HttpMethod, path: string, req: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (req.body !== undefined) headers['Content-Type'] = 'application/json';
    if (!req.anonymous) {
      const tokens = await options.tokenStore.getTokens();
      if (tokens) headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    const controller = makeController?.();
    let timedOut = false;
    const timeoutMs = req.timeoutMs ?? options.timeoutMs ?? 15000;
    const timer =
      controller && setTimer
        ? setTimer(() => {
            timedOut = true;
            controller.abort();
          }, timeoutMs)
        : undefined;
    const init: FetchInitLike = { method, headers };
    if (req.body !== undefined) init.body = JSON.stringify(req.body);
    if (controller) init.signal = controller.signal;

    // The timer covers the whole exchange: connecting, headers and reading the body.
    try {
      let response: FetchResponseLike;
      let text: string;
      try {
        response = await options.fetch(joinUrl(options.baseUrl, path, req.query), init);
        if (response.status === 204 || response.status === 205) return undefined as T;
        text = await response.text();
      } catch (error) {
        if (timedOut) throw new ApiError('timeout', `Request timed out after ${timeoutMs} ms`);
        throw new ApiError('network', `Network error: ${error instanceof Error ? error.message : String(error)}`);
      }
      let body: unknown = undefined;
      if (text !== '') {
        try {
          body = JSON.parse(text);
        } catch {
          if (response.ok) throw new ApiError('parse', 'Response was not valid JSON', response.status, text);
          body = text;
        }
      }
      if (!response.ok) {
        const error = new ApiError('http', `HTTP ${response.status} ${response.statusText}`.trim(), response.status, body);
        if (response.status === 401) {
          try {
            await options.onUnauthorized?.(error);
          } catch {
            // A failing hook must not hide the 401 from the caller.
          }
        }
        throw error;
      }
      return body as T;
    } finally {
      if (timer !== undefined) clearTimer?.(timer);
    }
  }

  const resource = <T, C>(base: string): ResourceApi<T, C> => ({
    list: (query) => request<T[]>('GET', base, query ? { query } : {}),
    get: (id) => request<T>('GET', `${base}/${encodeURIComponent(id)}`),
    create: (input) => request<T>('POST', base, { body: input }),
    update: (id, patch) => request<T>('PATCH', `${base}/${encodeURIComponent(id)}`, { body: patch }),
    delete: (id) => request<void>('DELETE', `${base}/${encodeURIComponent(id)}`),
  });

  const storeTokens = async (tokens: AuthTokens) => {
    await options.tokenStore.setTokens(tokens);
    return tokens;
  };

  return {
    request,
    auth: {
      signIn: async (email, password) => storeTokens(await request<AuthTokens>('POST', '/auth/sign-in', { body: { email, password }, anonymous: true })),
      signUp: async (input) => storeTokens(await request<AuthTokens>('POST', '/auth/sign-up', { body: input, anonymous: true })),
      signOut: async () => {
        try {
          await request<void>('POST', '/auth/sign-out');
        } finally {
          await options.tokenStore.clear();
        }
      },
    },
    me: {
      get: () => request<Profile>('GET', '/me'),
      update: (patch) => request<Profile>('PATCH', '/me', { body: patch }),
    },
    people: resource('/people'),
    groups: { ...resource<Group, Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>('/groups'), join: (inviteCode) => request<Group>('POST', '/groups/join', { body: { inviteCode } }) },
    expenses: resource('/expenses'),
    settlements: {
      ...resource<Settlement, Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>>('/settlements'),
      confirm: (id) => request<Settlement>('POST', `/settlements/${encodeURIComponent(id)}/confirm`),
    },
    budgets: resource('/budgets'),
    rates: { list: (query) => request<ExchangeRate[]>('GET', '/rates', query ? { query: { ...query } } : {}) },
  };
}
