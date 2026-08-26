import { willCore } from './willCore.js';
import { buildExecutionTiming } from './executionTiming.js';

export function analyzeMarket(data, context = {}) {
  return willCore(data, context);
}

export function runWillPipeline(data, context = {}) {
  if (!data) throw new Error('Market snapshot ausente.');
  const result = willCore(data, context);
  const executable = result.direction !== 'WAIT' && !result.blocked;
  const signalTime = new Date().toISOString();
  const timing = executable ? buildExecutionTiming({
    marketTime: data.timestamp,
    signalTime,
    executionDelayMs: Number(context.executionDelayMs ?? process.env.EXECUTION_DELAY_MS ?? 0),
    windowBeforeMs: Number(context.windowBeforeMs ?? process.env.EXECUTION_WINDOW_BEFORE_MS ?? 2_000),
    windowAfterMs: Number(context.windowAfterMs ?? process.env.EXECUTION_WINDOW_AFTER_MS ?? 3_000),
    expirySeconds: Number(context.expirySeconds ?? process.env.EXPIRY_SECONDS ?? 60)
  }) : null;
  const timingValid = Boolean(timing?.valid);
  return {
    ...result,
    executable: executable && timingValid,
    clickTime: executable && timingValid ? timing.clickTime : null,
    timing,
    generatedAt: signalTime
  };
}
