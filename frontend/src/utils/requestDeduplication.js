/**
 * Request deduplication utility to prevent duplicate API calls
 */
const pendingRequests = new Map();

/**
 * URLs that should NOT be deduplicated (critical endpoints)
 */
const DEDUPLICATION_WHITELIST = [
  '/auth/user',      // User info requests should not be cancelled
  '/auth/login',     // Login requests should not be cancelled
  '/auth/logout',    // Logout requests should not be cancelled
  '/auth/register',  // Registration requests should not be cancelled
];

/**
 * Check if a URL should be excluded from deduplication
 */
function shouldSkipDeduplication(url) {
  if (!url) return false;
  return DEDUPLICATION_WHITELIST.some(endpoint => url.includes(endpoint));
}

/**
 * Generate a unique key for a request
 */
function getRequestKey(config) {
  const { method, url, params, data } = config;
  const paramsStr = params ? JSON.stringify(params) : '';
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${paramsStr}:${dataStr}`;
}

/**
 * Check if a request is already pending
 */
export function isRequestPending(config) {
  // Skip deduplication for whitelisted endpoints
  if (shouldSkipDeduplication(config.url)) {
    return false;
  }
  const key = getRequestKey(config);
  return pendingRequests.has(key);
}

/**
 * Add a request to pending requests
 */
export function addPendingRequest(config, cancelToken) {
  const key = getRequestKey(config);
  pendingRequests.set(key, cancelToken);
}

/**
 * Remove a request from pending requests
 */
export function removePendingRequest(config) {
  const key = getRequestKey(config);
  pendingRequests.delete(key);
}

/**
 * Cancel a pending request
 */
export function cancelPendingRequest(config) {
  const key = getRequestKey(config);
  const cancelToken = pendingRequests.get(key);
  if (cancelToken) {
    cancelToken.cancel('Request cancelled due to duplicate');
    pendingRequests.delete(key);
  }
}

