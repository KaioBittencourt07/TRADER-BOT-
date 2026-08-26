import { willCore } from './willCore.js';

export function analyzeMarket(data, context = {}) {
  return willCore(data, context);
}

export function runWillPipeline(data, context = {}) {
  if (!data) throw new Error('Market snapshot ausente.');
  const result = willCore(data, context);
  const executable = result.direction !== 'WAIT' && !result.blocked;
  return {
    ...result,
    executable,
    clickTime: executable ? new Date().toISOString() : null,
    generatedAt: new Date().toISOString()
  };
}
