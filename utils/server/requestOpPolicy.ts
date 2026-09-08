const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

export const REQUEST_OP_ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

type AllowedMethod = (typeof REQUEST_OP_ALLOWED_METHODS)[number];

export interface RequestOpEnvironment {
  API_BASE_URL?: string;
  REQUEST_OP_ALLOWED_BASE_URLS?: string;
  NODE_ENV?: string;
}

export interface RequestOpUrlData {
  url?: unknown;
  path?: unknown;
  op?: unknown;
  queryParams?: unknown;
}

export class RequestOpPolicyError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 500,
  ) {
    super(message);
    this.name = 'RequestOpPolicyError';
    Object.setPrototypeOf(this, RequestOpPolicyError.prototype);
  }
}

const inputError = (message: string): never => {
  throw new RequestOpPolicyError(message, 400);
};

const configurationError = (message: string): never => {
  throw new RequestOpPolicyError(message, 500);
};

const stripIpv6Brackets = (hostname: string) =>
  hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

const isNonPublicIpv4 = (hostname: string): boolean => {
  const octets = hostname.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second, third] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  );
};

const expandIpv6 = (hostname: string): number[] | null => {
  const address = stripIpv6Brackets(hostname).toLowerCase().split('%')[0];
  if (!address.includes(':')) return null;

  const halves = address.split('::');
  if (halves.length > 2) return null;

  const parseHalf = (half: string): number[] | null => {
    if (!half) return [];
    const segments = half.split(':');
    const parsed: number[] = [];

    for (const segment of segments) {
      if (!/^[0-9a-f]{1,4}$/.test(segment)) return null;
      parsed.push(Number.parseInt(segment, 16));
    }
    return parsed;
  };

  const left = parseHalf(halves[0]);
  const right = parseHalf(halves[1] ?? '');
  if (!left || !right) return null;

  if (halves.length === 1) return left.length === 8 ? left : null;

  const missing = 8 - left.length - right.length;
  if (missing < 1) return null;
  return [...left, ...new Array(missing).fill(0), ...right];
};

const isNonPublicIpv6 = (hostname: string): boolean => {
  const segments = expandIpv6(hostname);
  if (!segments) return false;

  const isUnspecified = segments.every((segment) => segment === 0);
  const isLoopback = segments.slice(0, 7).every((segment) => segment === 0) && segments[7] === 1;
  const isUniqueLocal = (segments[0] & 0xfe00) === 0xfc00;
  const isLinkLocal = (segments[0] & 0xffc0) === 0xfe80;
  const isMulticast = (segments[0] & 0xff00) === 0xff00;
  const isIpv4Mapped =
    segments.slice(0, 5).every((segment) => segment === 0) && segments[5] === 0xffff;

  if (isIpv4Mapped) {
    const mappedIpv4 = [
      segments[6] >> 8,
      segments[6] & 0xff,
      segments[7] >> 8,
      segments[7] & 0xff,
    ].join('.');
    return isNonPublicIpv4(mappedIpv4);
  }

  return isUnspecified || isLoopback || isUniqueLocal || isLinkLocal || isMulticast;
};

export const isLocalOrPrivateHostname = (hostname: string): boolean => {
  const normalized = stripIpv6Brackets(hostname).replace(/\.$/, '').toLowerCase();

  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    isNonPublicIpv4(normalized) ||
    isNonPublicIpv6(normalized)
  );
};

const validateUrlShape = (
  value: string,
  source: 'request' | 'configuration',
  environment: RequestOpEnvironment,
): URL => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return source === 'request'
      ? inputError('The destination URL must be an absolute URL')
      : configurationError('A request proxy base URL is invalid');
  }

  const fail = (message: string): never =>
    source === 'request' ? inputError(message) : configurationError(message);

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    fail('The destination URL protocol is not allowed');
  }
  if (url.username || url.password) {
    fail('Destination URLs must not contain credentials');
  }
  if (url.search || url.hash) {
    fail('Destination base URLs must not contain a query string or fragment');
  }

  const isProduction = environment.NODE_ENV === 'production';
  const isLocalOrPrivate = isLocalOrPrivateHostname(url.hostname);

  if (isProduction && url.protocol !== 'https:') {
    fail('Production request proxy destinations must use HTTPS');
  }
  if (isProduction && isLocalOrPrivate) {
    fail('Production request proxy destinations must use a public host');
  }
  if (!isProduction && url.protocol === 'http:' && !isLocalOrPrivate) {
    fail('Plain HTTP is only allowed for explicitly configured local development services');
  }

  return url;
};

const normalizedBasePath = (url: URL): string => {
  const withoutTrailingSlashes = url.pathname.replace(/\/+$/, '');
  return withoutTrailingSlashes || '/';
};

const isWithinBase = (destination: URL, base: URL): boolean => {
  if (destination.origin !== base.origin) return false;

  const basePath = normalizedBasePath(base);
  if (basePath === '/') return true;

  return destination.pathname === basePath || destination.pathname.startsWith(`${basePath}/`);
};

const parseConfiguredBases = (environment: RequestOpEnvironment): URL[] => {
  const apiBaseUrl = environment.API_BASE_URL?.trim();
  if (!apiBaseUrl) {
    configurationError('API_BASE_URL is required for the request proxy');
  }

  const additionalBases = (environment.REQUEST_OP_ALLOWED_BASE_URLS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const bases = [apiBaseUrl, ...additionalBases].map((value) =>
    validateUrlShape(value, 'configuration', environment),
  );

  return bases.filter(
    (base, index) => bases.findIndex((candidate) => candidate.href === base.href) === index,
  );
};

const readPathPart = (value: unknown, name: string): string => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') inputError(`${name} must be a string`);
  if (!value) return '';
  if (!value.startsWith('/') || value.startsWith('//')) {
    inputError(`${name} must be an absolute path on an allowed host`);
  }
  if (/[\\?#@\u0000-\u001f\u007f]/.test(value)) {
    inputError(`${name} contains characters that are not allowed`);
  }

  let decoded = value;
  let stabilized = false;
  const maxDecodePasses = 8;

  for (let pass = 0; pass < maxDecodePasses; pass += 1) {
    if (/%(?:2e|2f|3f|40|5c)/i.test(decoded)) {
      inputError(`${name} contains an encoded path separator or routing character`);
    }
    let next: string;
    try {
      next = decodeURIComponent(decoded);
    } catch {
      inputError(`${name} contains invalid percent encoding`);
    }
    if (next === decoded) {
      stabilized = true;
      break;
    }
    decoded = next;
  }

  if (!stabilized) {
    inputError(`${name} contains excessive nested percent encoding`);
  }

  if (
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    /[\\?#@\u0000-\u001f\u007f]/.test(decoded) ||
    decoded.split('/').some((segment) => segment === '.' || segment === '..')
  ) {
    inputError(`${name} contains an unsafe encoded path`);
  }
  return value;
};

const appendPath = (base: URL, path: string): URL => {
  if (!path) return new URL(base.href);
  if (!path.startsWith('/') || path.startsWith('//')) {
    inputError('The destination path must be an absolute path on an allowed host');
  }

  const destination = new URL(base.href);
  const prefix = destination.pathname.replace(/\/+$/, '');
  destination.pathname = `${prefix}${path}`;
  return destination;
};

export const normalizeRequestOpMethod = (method: unknown): AllowedMethod => {
  if (typeof method !== 'string') inputError('A supported request method is required');

  const normalized = method.trim().toUpperCase();
  if (!(REQUEST_OP_ALLOWED_METHODS as readonly string[]).includes(normalized)) {
    inputError('The request method is not allowed');
  }
  return normalized as AllowedMethod;
};

export const constructRequestOpUrl = (
  data: RequestOpUrlData,
  decodeQueryValue: (value: unknown) => unknown,
  environment: RequestOpEnvironment = process.env,
): string => {
  const allowedBases = parseConfiguredBases(environment);
  const primaryBase = allowedBases[0];
  const path = `${readPathPart(data.path, 'path')}${readPathPart(data.op, 'op')}`;

  let destination: URL;
  if (data.url !== undefined && data.url !== null) {
    if (environment.NODE_ENV === 'production') {
      inputError('Client-provided destination URLs are not allowed in production');
    }
    if (typeof data.url !== 'string' || !data.url.trim()) {
      inputError('The destination URL must be a non-empty absolute URL');
    }
    if (data.url.trim().startsWith('//')) {
      inputError('Protocol-relative destination URLs are not allowed');
    }
    const requestedBase = validateUrlShape(data.url.trim(), 'request', environment);
    destination = appendPath(requestedBase, path);
  } else {
    destination = appendPath(primaryBase, path);
  }

  const matchingBase = allowedBases.find((base) => isWithinBase(destination, base));
  if (!matchingBase) {
    inputError('The destination URL is not allowlisted');
  }

  // URL normalisation resolves literal and percent-encoded dot segments. Check the
  // final path after that normalisation so a request cannot escape an allowed prefix.
  if (!isWithinBase(destination, matchingBase)) {
    inputError('The destination path is outside the allowlisted base path');
  }

  if (data.queryParams !== undefined && data.queryParams !== null) {
    if (
      typeof data.queryParams !== 'object' ||
      Array.isArray(data.queryParams)
    ) {
      inputError('queryParams must be an object');
    }

    for (const [key, encodedValue] of Object.entries(data.queryParams)) {
      destination.searchParams.append(key, String(decodeQueryValue(encodedValue)));
    }
  }

  return destination.toString();
};
