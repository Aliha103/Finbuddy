import { describe, expect, it, vi } from 'vitest';

import { ApiError, MemoryTokenStore, createApiClient, type FetchInitLike, type FetchLike, type FetchResponseLike } from './client';

const response = (status: number, body?: unknown, statusText = ''): FetchResponseLike => ({
  ok: status >= 200 && status < 300,
  status,
  statusText,
  headers: { get: () => 'application/json' },
  text: async () => (body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)),
});

function setup(handler: (url: string, init: FetchInitLike) => Promise<FetchResponseLike>, extra: Partial<Parameters<typeof createApiClient>[0]> = {}) {
  const calls: { url: string; init: FetchInitLike }[] = [];
  const fetch: FetchLike = (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  };
  const tokenStore = new MemoryTokenStore();
  const client = createApiClient({ baseUrl: 'https://api.test.invalid/v1/', fetch, tokenStore, ...extra });
  return { client, calls, tokenStore };
}

describe('ApiClient', () => {
  it('sends JSON with the bearer token and parses JSON', async () => {
    const { client, calls, tokenStore } = setup(async () => response(200, { id: 'g1' }));
    await tokenStore.setTokens({ accessToken: 'tok' });
    expect(await client.groups.create({ name: 'x' } as never)).toEqual({ id: 'g1' });
    expect(calls[0]?.url).toBe('https://api.test.invalid/v1/groups');
    expect(calls[0]?.init.method).toBe('POST');
    expect(calls[0]?.init.headers).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json' });
    expect(calls[0]?.init.body).toBe('{"name":"x"}');
    expect(calls[0]?.init.signal).toBeDefined();
  });

  it('encodes ids and query strings, and omits undefined params', async () => {
    const { client, calls } = setup(async () => response(200, []));
    await client.expenses.get('a/b');
    await client.expenses.list({ groupId: 'g 1', limit: 10, cursor: undefined });
    expect(calls.map((c) => c.url)).toEqual(['https://api.test.invalid/v1/expenses/a%2Fb', 'https://api.test.invalid/v1/expenses?groupId=g%201&limit=10']);
    expect(calls[0]?.init.headers.Authorization).toBeUndefined();
  });

  it('returns undefined for 204', async () => {
    const { client } = setup(async () => response(204));
    await expect(client.expenses.delete('e1')).resolves.toBeUndefined();
  });

  it('stores tokens on sign-in without sending an old token, and clears them on sign-out even if the call fails', async () => {
    const { client, calls, tokenStore } = setup(async (url) => (url.endsWith('sign-in') ? response(200, { accessToken: 'new' }) : response(500, { error: 'x' })));
    await tokenStore.setTokens({ accessToken: 'old' });
    await client.auth.signIn('a@example.invalid', 'pw');
    expect(calls[0]?.init.headers.Authorization).toBeUndefined();
    expect(await tokenStore.getTokens()).toEqual({ accessToken: 'new' });
    await expect(client.auth.signOut()).rejects.toBeInstanceOf(ApiError);
    expect(await tokenStore.getTokens()).toBeNull();
  });

  it('throws typed HTTP errors and calls the 401 hook', async () => {
    const onUnauthorized = vi.fn();
    const { client } = setup(async (url) => (url.endsWith('/me') ? response(401, { error: 'expired' }, 'Unauthorized') : response(422, 'plain text')), { onUnauthorized });
    const err = await client.me.get().catch((e: unknown) => e as ApiError);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: 'http', status: 401, body: { error: 'expired' } });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    await expect(client.people.list()).rejects.toMatchObject({ kind: 'http', status: 422, body: 'plain text' });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('reports network and parse errors', async () => {
    const net = setup(async () => {
      throw new Error('offline');
    });
    await expect(net.client.people.list()).rejects.toMatchObject({ kind: 'network', status: null });
    const bad = setup(async () => response(200, '{not json'));
    await expect(bad.client.people.list()).rejects.toMatchObject({ kind: 'parse', status: 200 });
  });

  it('times out through AbortController', async () => {
    vi.useFakeTimers();
    try {
      const { client } = setup(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            const signal = init.signal as unknown as { addEventListener(type: string, fn: () => void): void };
            signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
        { timeoutMs: 50 },
      );
      const pending = client.people.list().catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(60);
      expect(await pending).toMatchObject({ kind: 'timeout' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the timeout running while the body is read', async () => {
    vi.useFakeTimers();
    try {
      const { client } = setup(
        async (_url, init) => ({
          ...response(200),
          text: () =>
            new Promise<string>((_resolve, reject) => {
              const signal = init.signal as unknown as { addEventListener(type: string, fn: () => void): void };
              signal.addEventListener('abort', () => reject(new Error('aborted')));
            }),
        }),
        { timeoutMs: 50 },
      );
      const pending = client.people.list().catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(60);
      expect(await pending).toMatchObject({ kind: 'timeout' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('still throws the 401 when the hook itself fails', async () => {
    const { client } = setup(async () => response(401, undefined, 'Unauthorized'), {
      onUnauthorized: () => {
        throw new Error('hook failed');
      },
    });
    await expect(client.me.get()).rejects.toMatchObject({ kind: 'http', status: 401 });
  });

  it('clears the timer after every request', async () => {
    const cleared: unknown[] = [];
    const { client } = setup(async () => response(200, []), {
      setTimeout: () => 'handle',
      clearTimeout: (h) => cleared.push(h),
    });
    await client.people.list();
    await setup(async () => response(204), { setTimeout: () => 'h2', clearTimeout: (h) => cleared.push(h) }).client.people.delete('x');
    expect(cleared).toEqual(['handle', 'h2']);
  });
});
