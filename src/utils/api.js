// ==============================================================================
// Thenisai Sweets API Client
// Built adhering to the "20 Rules for API Calling" Best Practices:
// - Correct HTTP methods (GET, POST, PATCH, PUT, DELETE)
// - Configurable Base URL & Environment Variables
// - Request Timeouts via AbortController (Default 10s)
// - Request/Response Interception & Token Injection
// - Granular HTTP Status Code Handling (400, 401, 403, 404, 500)
// - Cancellation Signal Support (AbortController)
// - Query Parameter Serialization Helper
// - Safe Error Normalization & Development Logging
// ==============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Builds clean query string from an object of params (Rule 10)
 */

export function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Normalizes HTTP status errors into user-friendly diagnostic messages (Rule 6, 12)
 */
function normalizeHttpStatusError(status, serverMessage) {
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }
  switch (status) {
    case 400:
      return 'Bad Request: Please check the submitted order or payment details.';
    case 401:
      return 'Session Expired: Please log in again to continue.';
    case 403:
      return 'Access Denied: You do not have permission for this register or action.';
    case 404:
      return 'Resource Not Found: The requested sweet item, bill, or order could not be located.';
    case 408:
      return 'Request Timeout: The server took too long to respond. Please try again.';
    case 500:
      return 'Internal Server Error: Kitchen server encountered an issue. Please retry.';
    case 502:
    case 503:
      return 'Service Unavailable: Kitchen database is temporarily unreachable.';
    default:
      return `Request failed with HTTP status ${status}.`;
  }
}

/**
 * Core Request Dispatcher
 */
export async function request(endpoint, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    params,
    signal: userSignal,
    ...fetchOptions
  } = options;

  const queryString = params ? buildQueryString(params) : '';
  const url = `${BASE_URL}${endpoint}${queryString}`;

  // Rule 7 & 13: Timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Allow consumer to cancel request early
  if (userSignal) {
    userSignal.addEventListener('abort', () => controller.abort());
  }

  // Rule 8 & 11: Request Interceptor (Inject auth token and required headers)
  const token = sessionStorage.getItem('thenisai_auth_token') || localStorage.getItem('thenisai_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers || {}),
  };

  const config = {
    cache: 'no-store',
    ...fetchOptions,
    headers,
    signal: controller.signal,
  };

  // Support axios-style `data` property for payload (e.g. in DELETE requests)
  if (config.data !== undefined && config.body === undefined) {
    config.body = config.data;
  }

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  // ── Sandbox intercept: block all write calls for tester/demo users ──────────
  // Tester sessions have isSandbox:true in their stored user object.
  const _sandboxRaw = sessionStorage.getItem('thenisai_auth_user');
  const _sandboxUser = _sandboxRaw ? (() => { try { return JSON.parse(_sandboxRaw); } catch { return null; } })() : null;
  const _isSandbox = Boolean(_sandboxUser?.isSandbox || _sandboxUser?.role === 'tester');

  const _method = (fetchOptions.method || 'GET').toUpperCase();

  if (_isSandbox && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(_method)) {
    if (import.meta.env.DEV) {
      console.info(`[Sandbox] Intercepted ${_method} ${endpoint} — returning mock success (no real data changed)`);
    }
    // Return a mock success payload that matches common API shapes
    return {
      success: true,
      sandbox: true,
      message: 'Sandbox: action simulated — no real data was affected.',
      data: null,
    };
  }
  // ────────────────────────────────────────────────────────────────────────────

  const method = (config.method || 'GET').toUpperCase();

  // Rule 19: Log API Calls in Development
  if (import.meta.env.DEV) {
    console.debug(`[API Request] ${method} ${url}`, { headers: config.headers, body: config.body });
  }

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

    // Parse JSON safely
    const data = await res.json().catch(() => ({}));

    // Rule 19: Log API Response in Development
    if (import.meta.env.DEV) {
      console.debug(`[API Response] ${res.status} ${url}`, data);
    }

    // Rule 11 & 12: Handle 401 Session Invalidation & Error Statuses
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('thenisai_auth_token');
        sessionStorage.removeItem('thenisai_auth_token');
        sessionStorage.removeItem('thenisai_auth_user');
        sessionStorage.removeItem('thenisai_admin_session');
        sessionStorage.removeItem('thenisai_billing_session');
      }
      const errorMsg = normalizeHttpStatusError(res.status, data.message || data.error);
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${timeout / 1000}s. Please check network connectivity.`);
      timeoutError.status = 408;
      console.warn(`[API Timeout] ${method} ${url}`);
      throw timeoutError;
    }

    if (import.meta.env.DEV) {
      if (endpoint === '/api/auth/me' && err.status === 401) {
        // Expected when user is not yet logged in or session expired
        console.debug(`[API] Not logged in on ${endpoint}`);
      } else {
        console.error(`[API Error] ${method} ${url}:`, err);
      }
    }
    throw err;
  }
}

/**
 * Reusable REST Verbs (Rule 1 & 20)
 */
export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, bodyOrOptions = {}, options = {}) => {
    let finalOptions;
    if (options && Object.keys(options).length > 0) {
      finalOptions = { ...options, body: bodyOrOptions, method: 'DELETE' };
    } else if (bodyOrOptions && (bodyOrOptions.data !== undefined || bodyOrOptions.body !== undefined || bodyOrOptions.headers !== undefined)) {
      finalOptions = { ...bodyOrOptions, method: 'DELETE' };
    } else if (bodyOrOptions && typeof bodyOrOptions === 'object' && Object.keys(bodyOrOptions).length > 0) {
      finalOptions = { body: bodyOrOptions, method: 'DELETE' };
    } else {
      finalOptions = { ...bodyOrOptions, method: 'DELETE' };
    }
    return request(endpoint, finalOptions);
  },
};

export default api;
