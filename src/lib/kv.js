// Server-only module
// Thin wrapper around @upstash/redis. Import as: import { kv } from '$lib/kv'

import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

function createClient() {
  // Vercel KV (Upstash) integration injects KV_REST_API_URL / KV_REST_API_TOKEN.
  // Fall back to UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN for local dev.
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Redis credentials. Set KV_REST_API_URL and KV_REST_API_TOKEN ' +
        '(from the Vercel Upstash integration) or UPSTASH_REDIS_REST_URL / ' +
        'UPSTASH_REDIS_REST_TOKEN for local dev.'
    );
  }

  return new Redis({ url, token });
}

// Singleton — reuse across requests in the same server process.
let _client = null;

function getClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

// Proxy so callers can do: kv.get(...), kv.set(...), kv.json.get(...), etc.
export const kv = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      // Support nested namespaces such as kv.json
      if (value !== null && typeof value === 'object') {
        return new Proxy(value, {
          get(obj, innerProp) {
            const inner = obj[innerProp];
            return typeof inner === 'function' ? inner.bind(obj) : inner;
          }
        });
      }
      return value;
    }
  }
);
