import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveConsensus } from './consensus.js';

const deterministic = { direction: 'BUY', confidence: 80, blocked: false, executable: true, blockReasons: [] };

test('approves matching strong AI confirmation', () => {
  const result = resolveConsensus(deterministic, { direction: 'BUY', confidence: 80, block: false, thesis: 'confirmed', score: 82, risks: [] });
  assert.equal(result.approved, true);
  assert.equal(result.decision.direction, 'BUY');
  assert.ok(result.decision.clickTime);
});

test('vetoes opposite AI direction', () => {
  const result = resolveConsensus(deterministic, { direction: 'SELL', confidence: 95, block: false, thesis: 'conflict', score: 95, risks: [] });
  assert.equal(result.approved, false);
  assert.equal(result.decision.direction, 'WAIT');
  assert.equal(result.decision.clickTime, null);
});

test('vetoes weak AI confidence', () => {
  const result = resolveConsensus(deterministic, { direction: 'BUY', confidence: 69, block: false, thesis: 'weak', score: 69, risks: [] });
  assert.equal(result.approved, false);
  assert.equal(result.decision.direction, 'WAIT');
});
