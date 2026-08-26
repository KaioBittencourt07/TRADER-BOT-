import test from 'node:test';
import assert from 'node:assert/strict';
import { runWillPipeline } from '../engine/src/pipeline.js';

test('pipeline blocks when macro/news risk is active', () => {
  const result = runWillPipeline({ asset: 'TEST', timestamp: new Date().toISOString(), timeframe: '1m', price: 100, volatility: 0.2 }, { macroBlocked: true, sampleSize: 100 });
  assert.equal(result.direction, 'WAIT');
  assert.equal(result.executable, false);
  assert.equal(result.clickTime, null);
});

test('pipeline never invents a click time for WAIT', () => {
  const result = runWillPipeline({ asset: 'TEST', timestamp: new Date().toISOString(), timeframe: '1m', price: 100, volatility: 0.2 }, { dataValid: false, sampleSize: 100 });
  assert.equal(result.direction, 'WAIT');
  assert.equal(result.clickTime, null);
});
