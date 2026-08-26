import { Router } from 'express';
import { analyzeWithOpenAI } from '../ai/openaiEngine.js';
import { normalizeMarketSnapshot } from '../../../data/src/marketAdapter.js';
import { runWillPipeline } from '../../../engine/src/pipeline.js';
import { createAuditEntry } from '../../../engine/src/auditLog.js';
import { resolveConsensus } from '../consensus.js';
import { buildExecutionTiming } from '../../../engine/src/executionTiming.js';

const router = Router();

function withTiming(decision, market, signalTime = new Date().toISOString(), context = {}) {
  if (!decision.executable || !['BUY', 'SELL'].includes(decision.direction)) return { ...decision, clickTime: null, timing: null };
  const timing = buildExecutionTiming({
    marketTime: market.timestamp,
    signalTime,
    executionDelayMs: Number(context.executionDelayMs ?? 0),
    windowBeforeMs: Number(context.windowBeforeMs ?? 2000),
    windowAfterMs: Number(context.windowAfterMs ?? 3000),
    expirySeconds: Number(context.expirySeconds ?? 60)
  });
  if (!timing.valid) return { ...decision, direction: 'WAIT', executable: false, blocked: true, clickTime: null, timing, reason: 'Timing inválido: sinal não pode ser executado.' };
  return { ...decision, clickTime: timing.clickTime, timing };
}

router.post('/analyze', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ ok: false, error: 'Payload inválido.' });
    const rawMarket = payload.market ?? payload;
    const context = payload.context ?? {};
    const normalized = normalizeMarketSnapshot(rawMarket);
    if (!normalized.valid) {
      const decision = { direction: 'WAIT', score: 0, confidence: 0, executable: false, blocked: true, clickTime: null, reason: `Data Guard: ${normalized.reason}`, blockReasons: [normalized.reason] };
      return res.json({ ok: true, source: 'data-guard', decision, data: normalized, audit: createAuditEntry({ signal: rawMarket, decision, context }) });
    }

    const signalTime = new Date().toISOString();
    const deterministic = runWillPipeline(normalized, context);
    if (!deterministic.executable) {
      const decision = withTiming({ ...deterministic, direction: 'WAIT' }, normalized, signalTime, context);
      return res.json({ ok: true, source: 'will-deterministic', decision, data: normalized, audit: createAuditEntry({ signal: normalized, decision, context }) });
    }

    const ai = await analyzeWithOpenAI({ market: normalized, context, deterministic });
    const result = resolveConsensus(deterministic, ai, { minimumAiConfidence: context.minimumAiConfidence ?? 70 });
    const decision = withTiming(result.decision, normalized, signalTime, context);
    return res.json({ ok: true, source: result.approved ? 'will-ai-consensus' : 'will-ai-veto', decision, data: normalized, audit: createAuditEntry({ signal: normalized, decision, context }) });
  } catch (error) {
    console.error('Analysis error:', error.message);
    return res.status(500).json({ ok: false, error: 'Falha na análise.' });
  }
});

export default router;
