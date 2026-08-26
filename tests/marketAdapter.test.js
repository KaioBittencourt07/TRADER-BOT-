import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMarketSnapshot } from '../data/src/marketAdapter.js';

test('accepts a fresh valid snapshot', () => {
  const now = Date.parse('2026-08-26T18:00:00.000Z');
  const result = normalizeMarketSnapshot({ asset: 'EUR/USD', timeframe: '1m', price: 1.17, timestamp: '2026-08-26T17:59:55.000Z' }, { now });
  assert.equal(result.valid, true);
  assert.equal(result.status, 'OK');
});

test('rejects invalid price', () => {
  const result = normalizeMarketSnapshot({ asset: 'EUR/USD', timeframe: '1m', price: 0, timestamp: '2026-08-26T17:59:59.000Z' });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'INVALID');
});

test('rejects stale market data', () => {
  const now = Date.parse('2026-08-26T18:00:00.000Z');
  const result = normalizeMarketSnapshot({ asset: 'EUR/USD', timeframe: '1m', price: 1.17, timestamp: '2026-08-26T17:59:00.000Z' }, { now, maxAgeMs: 10_000 });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'STALE');
});
