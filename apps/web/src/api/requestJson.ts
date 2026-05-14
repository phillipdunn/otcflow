export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

function extractErrorMessage(json: unknown, fallback: string): string {
  if (
    typeof json === 'object' &&
    json !== null &&
    'error' in json &&
    typeof (json as { error: unknown }).error === 'string'
  ) {
    return (json as { error: string }).error;
  }
  return fallback;
}

/** `GET`/`POST`/`PATCH` against the API; returns parsed JSON or `undefined` for empty 2xx body. Throws `ApiRequestError` on failure. */
export async function requestJson(path: string, init: RequestInit = {}): Promise<unknown> {
  const url = `${getApiBaseUrl()}${path}`;
  const method = init.method ?? 'GET';
  const headers = new Headers(init.headers);
  if (
    init.body !== undefined &&
    init.body !== null &&
    method !== 'GET' &&
    method !== 'HEAD' &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, method, headers });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Network error';
    throw new ApiRequestError(`Network request failed: ${message}`, 0, cause);
  }

  const text = await res.text();
  let json: unknown;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = text;
    }
  } else {
    json = undefined;
  }

  if (!res.ok) {
    const msg = extractErrorMessage(json, `Request failed (${res.status})`);
    throw new ApiRequestError(msg, res.status, json);
  }

  return json;
}
