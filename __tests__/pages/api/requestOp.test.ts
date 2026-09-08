import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getServerSessionMock, decodeMock, encodeMock, compressMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  decodeMock: vi.fn((value: unknown) => value),
  encodeMock: vi.fn((value: unknown) => value),
  compressMock: vi.fn((value: unknown) => value),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('@/pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}));

vi.mock('@/utils/app/data', () => ({
  transformPayload: {
    decode: decodeMock,
    encode: encodeMock,
  },
}));

vi.mock('@/utils/app/lzwCompression', () => ({
  lzwCompress: compressMock,
}));

import testEndpoint from '@/pages/api/admin/testEndpoint';
import requestOp from '@/pages/api/requestOp';
import {
  constructRequestOpUrl,
  normalizeRequestOpMethod,
  RequestOpPolicyError,
} from '@/utils/server/requestOpPolicy';

type MockResponse = {
  statusCode?: number;
  payload?: unknown;
  headers: Record<string, string>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
};

const createResponse = (): MockResponse => {
  const response = {
    headers: {},
    status: vi.fn(),
    json: vi.fn(),
    setHeader: vi.fn(),
  } as MockResponse;

  response.status.mockImplementation((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  });
  response.json.mockImplementation((payload: unknown) => {
    response.payload = payload;
    return response;
  });
  response.setHeader.mockImplementation((name: string, value: string) => {
    response.headers[name] = value;
    return response;
  });
  return response;
};

const productionEnvironment = {
  NODE_ENV: 'production',
  API_BASE_URL: 'https://api.amplify.example/prod',
};

const postRequest = (data: Record<string, unknown>) => ({
  method: 'POST',
  body: { data },
});

describe('requestOp SSRF containment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('API_BASE_URL', productionEnvironment.API_BASE_URL);
    vi.stubEnv('REQUEST_OP_ALLOWED_BASE_URLS', '');
    getServerSessionMock.mockResolvedValue({ accessToken: 'cognito-secret' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forwards an allowed API_BASE_URL path with a bearer and manual redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    await requestOp(
      postRequest({
        method: 'POST',
        path: '/chat',
        op: '/send',
        data: { prompt: 'hello' },
        queryParams: { requestId: 'abc 123' },
      }) as any,
      response as any,
    );

    expect(response.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.amplify.example/prod/chat/send?requestId=abc+123',
      expect.objectContaining({
        method: 'POST',
        redirect: 'manual',
        headers: expect.objectContaining({
          Authorization: 'Bearer cognito-secret',
        }),
      }),
    );
  });

  it('does not follow a redirect returned by the allowed backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 302 });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = createResponse();

    await requestOp(
      postRequest({ method: 'GET', path: '/redirect', op: '' }) as any,
      response as any,
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ redirect: 'manual' }));
    expect(response.statusCode).toBe(500);
  });

  it.each([
    ['caller-supplied allowlisted URL', { url: 'https://api.amplify.example/prod/chat', path: '', op: '' }],
    ['hostile HTTPS URL', { url: 'https://attacker.example/collect', path: '', op: '' }],
    ['URL credentials', { url: 'https://user:password@api.amplify.example/prod', path: '', op: '' }],
    ['protocol-relative URL', { url: '//attacker.example/collect', path: '', op: '' }],
    ['localhost URL', { url: 'https://localhost:3000/admin', path: '', op: '' }],
    ['private URL', { url: 'https://10.0.0.1/admin', path: '', op: '' }],
    ['link-local URL', { url: 'https://169.254.169.254/latest/meta-data', path: '', op: '' }],
    ['IPv6 loopback URL', { url: 'https://[::1]/admin', path: '', op: '' }],
    ['absolute path URL', { path: 'https://attacker.example/collect', op: '' }],
    ['scheme-relative path', { path: '//attacker.example/collect', op: '' }],
    ['absolute op URL', { path: '/chat', op: 'https://attacker.example/collect' }],
    ['scheme-relative op', { path: '/chat', op: '//attacker.example/collect' }],
    ['dot traversal', { path: '/../admin', op: '' }],
    ['encoded dot traversal', { path: '/%2e%2e/admin', op: '' }],
    ['triply encoded dot traversal', { path: '/%2525252e%2525252e/admin', op: '' }],
    ['excessively encoded path', { path: '/%252525252525252525safe', op: '' }],
    ['double-encoded separator', { path: '/safe/%252f%252fattack', op: '' }],
    ['encoded backslash', { path: '/safe/%5cattack', op: '' }],
    ['raw backslash', { path: '/safe\\attack', op: '' }],
    ['query in path', { path: '/safe?next=https://attacker.example', op: '' }],
    ['fragment in path', { path: '/safe#@attacker.example', op: '' }],
    ['userinfo marker in path', { path: '/safe@attacker.example', op: '' }],
  ])('rejects %s before fetch', async (_label, maliciousFields) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    await requestOp(
      postRequest({ method: 'POST', ...maliciousFields }) as any,
      response as any,
    );

    expect(response.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['CONNECT', 'HEAD', 'OPTIONS', 'TRACE']) (
    'rejects unsupported upstream method %s before fetch',
    async (method) => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      await requestOp(postRequest({ method, path: '/chat', op: '' }) as any, response as any);

      expect(response.statusCode).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('only accepts POST on the Next.js API route', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = createResponse();

    await requestOp({ method: 'GET' } as any, response as any);

    expect(response.statusCode).toBe(405);
    expect(response.headers.Allow).toBe('POST');
    expect(getServerSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://localhost:3000/prod',
    'https://127.0.0.1/prod',
    'https://10.0.0.1/prod',
    'https://169.254.169.254/latest',
    'https://[::1]/prod',
    'https://[fe80::1]/prod',
  ])('fails closed for unsafe production API_BASE_URL %s', async (apiBaseUrl) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('API_BASE_URL', apiBaseUrl);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = createResponse();

    await requestOp(
      postRequest({ method: 'POST', path: '/chat', op: '' }) as any,
      response as any,
    );

    expect(response.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps an allowed base-path prefix after URL normalization', () => {
    expect(
      constructRequestOpUrl(
        { path: '/chat', op: '/send' },
        (value) => value,
        productionEnvironment,
      ),
    ).toBe('https://api.amplify.example/prod/chat/send');
  });

  it('permits an explicitly allowlisted localhost URL only outside production', () => {
    expect(
      constructRequestOpUrl(
        { url: 'http://localhost:3015/dev/chat', path: '', op: '' },
        (value) => value,
        {
          NODE_ENV: 'development',
          API_BASE_URL: 'http://localhost:3001/dev',
          REQUEST_OP_ALLOWED_BASE_URLS: 'http://localhost:3015/dev',
        },
      ),
    ).toBe('http://localhost:3015/dev/chat');
  });

  it('allows only the production methods used by requestOp callers', () => {
    expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(normalizeRequestOpMethod)).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ]);
    expect(() => normalizeRequestOpMethod('TRACE')).toThrow(RequestOpPolicyError);
  });
});

describe('admin testEndpoint production containment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('is disabled before authentication or request URL/key parsing', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = { method: 'POST' } as Record<string, unknown>;
    Object.defineProperty(request, 'body', {
      get: () => {
        throw new Error('production handler must not read body');
      },
    });
    const response = createResponse();

    await testEndpoint(request as any, response as any);

    expect(response.statusCode).toBe(404);
    expect(response.headers['Cache-Control']).toBe('no-store');
    expect(getServerSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
