// Server-only module
// Thin wrapper around @upstash/redis. Import as: import { kv } from '$lib/kv'

import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

function createClient() {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Upstash Redis credentials. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment.'
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
