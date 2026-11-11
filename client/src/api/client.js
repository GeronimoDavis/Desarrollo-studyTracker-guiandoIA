const API_BASE = '/api';

let refreshPromise = null;
let authFailureHandler = null;

export class ApiError extends Error {
  constructor({ status, code, message, fields }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;
}

function notifyAuthFailure() {
  authFailureHandler?.();
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = apiRequest('/auth/refresh', {
      method: 'POST',
      skipAuthRefresh: true
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    headers = {},
    signal,
    skipAuthRefresh = false,
    isRetry = false
  } = {}
) {
  const requestHeaders = new Headers(headers);
  let requestBody = body;

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    typeof body !== 'string'
  ) {
    requestBody = JSON.stringify(body);

    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    body: requestBody,
    headers: requestHeaders,
    credentials: 'include',
    signal
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = payload?.error ?? {};
    const apiError = new ApiError({
      status: response.status,
      code: error.code ?? 'INTERNAL_ERROR',
      message: error.message ?? 'Ocurrió un error inesperado.',
      fields: error.fields
    });

    if (response.status === 401 && !skipAuthRefresh) {
      if (error.code === 'TOKEN_EXPIRED' && !isRetry) {
        try {
          await refreshAccessToken();
          return apiRequest(path, {
            method,
            body,
            headers,
            signal,
            skipAuthRefresh,
            isRetry: true
          });
        } catch {
          notifyAuthFailure();
          throw apiError;
        }
      }

      notifyAuthFailure();
    }

    throw apiError;
  }

  return payload?.data ?? payload;
}

export const api = {
  get(path, options) {
    return apiRequest(path, { ...options, method: 'GET' });
  },
  post(path, body, options) {
    return apiRequest(path, { ...options, method: 'POST', body });
  },
  put(path, body, options) {
    return apiRequest(path, { ...options, method: 'PUT', body });
  },
  patch(path, body, options) {
    return apiRequest(path, { ...options, method: 'PATCH', body });
  },
  delete(path, options) {
    return apiRequest(path, { ...options, method: 'DELETE' });
  }
};
