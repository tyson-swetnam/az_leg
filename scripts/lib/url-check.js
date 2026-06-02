/**
 * Shared URL accessibility + domain classification helpers.
 *
 * Factored out of validate-social-media.js so both the social-media validator
 * and the unified data audit (scripts/audit-data.mjs) share one proven, polite
 * HTTP path. Sequential by default with a delay between requests to avoid
 * tripping rate limits.
 */

import axios from 'axios';

export const TIMEOUT_MS = 10000; // 10 second timeout per URL
export const REQUEST_DELAY_MS = 1500; // 1.5 second delay between requests

// Valid HTTP status codes (success and redirects)
export const VALID_STATUS_CODES = [200, 301, 302, 307, 308];

// Status codes that frequently indicate bot-blocking rather than a dead link.
// These are reported as "inconclusive" rather than "broken".
export const INCONCLUSIVE_STATUS_CODES = [403, 429, 999];

// Problem status codes (human-readable labels)
export const PROBLEM_STATUS_CODES = {
  404: 'Not Found',
  403: 'Forbidden',
  410: 'Gone (deleted)',
  429: 'Rate Limited',
  500: 'Server Error',
  503: 'Service Unavailable',
};

/**
 * Check URL accessibility via an HTTP GET request.
 * Returns { accessible, inconclusive?, status?, error? }.
 */
export async function checkUrlAccessibility(url) {
  try {
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AZLegislatureBot/1.0; +data-audit)',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 600, // accept all < 600 so we can classify
    });

    const status = response.status;

    if (VALID_STATUS_CODES.includes(status)) {
      return { accessible: true, status };
    } else if (INCONCLUSIVE_STATUS_CODES.includes(status)) {
      return {
        accessible: false,
        inconclusive: true,
        status,
        error: PROBLEM_STATUS_CODES[status] || `Status ${status} (likely bot-blocking)`,
      };
    } else if (PROBLEM_STATUS_CODES[status]) {
      return { accessible: false, status, error: PROBLEM_STATUS_CODES[status] };
    } else {
      return { accessible: false, status, error: `Unexpected status code: ${status}` };
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return { accessible: false, error: 'Timeout' };
    } else if (error.code === 'ENOTFOUND') {
      return { accessible: false, error: 'DNS lookup failed' };
    } else if (error.code === 'ECONNREFUSED') {
      return { accessible: false, error: 'Connection refused' };
    } else if (error.response) {
      const status = error.response.status;
      const inconclusive = INCONCLUSIVE_STATUS_CODES.includes(status);
      return {
        accessible: false,
        inconclusive,
        status,
        error: PROBLEM_STATUS_CODES[status] || `HTTP ${status}`,
      };
    }
    return { accessible: false, error: error.message };
  }
}

/**
 * Check a list of items sequentially with a polite delay between requests.
 * Each item must have a `url` field; the returned result merges the item with
 * the accessibility outcome. `onProgress(index, total, item, result)` is
 * optional and called after each check.
 */
export async function checkUrls(items, { delayMs = REQUEST_DELAY_MS, onProgress } = {}) {
  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const result = await checkUrlAccessibility(item.url);
    const merged = { ...item, ...result };
    results.push(merged);
    if (onProgress) onProgress(i, items.length, item, result);
    if (i < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return results;
}

/**
 * Classify a URL's host. `isGov` is true for official government domains
 * (anything ending in `.gov`), which is the basis for the verified/unverified
 * provenance rule.
 */
export function classifyDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const isGov = host === 'gov' || host.endsWith('.gov');
    return { host, isGov };
  } catch {
    return { host: null, isGov: false };
  }
}
