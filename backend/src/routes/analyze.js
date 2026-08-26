import { Router } from 'express';
import { analyzeWithOpenAI } from '../ai/openaiEngine.js';
import { normalizeMarketSnapshot } from '../../../data/src/marketAdapter.js';
import { runWillPipeline } from '../../../engine/src/pipeline.js';
import { createAuditEntry } from '../../../engine/src/auditLog.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ ok: false, error: 'Payload inválido.' });
    }

    const rawMarket = payload.market ?? payload;
    const normalized = normalizeMarketSnapshot(rawMarket);
    if (!normalized.valid) {
      const decision = { direction: 'WAIT', score: 0, confidence: 0, blocked: true, reason: `Data Guard: ${normalized.reason}`, blockReasons: [normalized.reason] };
      return res.json({ ok: true, source: 'data-guard', decision, data: normalized, audit: createAuditEntry({ signal: rawMarket, decision, context: payload.context }) });
    }

    const context = payload.context ?? {};
    const deterministic = runWillPipeline(normalized, context);

    if (!deterministic.executable) {
      const decision = { ...deterministic, direction: 'WAIT', clickTime: null };
      return res.json({ ok: true, source: 'will-deterministic', decision, data: normalized, audit: createAuditEntry({ signal: normalized, decision, context }) });
    }

    const ai = await analyzeWithOpenAI({ market: normalized, context, deterministic });
    const consensus = !ai.block && ai.direction === deterministic.direction && ai.confidence >= (context.minimumAiConfidence ?? 70);
    const decision = consensus
      ? {
          ...deterministic,
          direction: deterministic.direction,
          confidence: Math.round((deterministic.confidence + ai.confidence) / 2),
          reason: `Consenso WILL + AI: ${ai.thesis}`,
          ai: { direction: ai.direction, confidence: ai.confidence, score: ai.score, risks: ai.risks }
        }
      : {
          ...deterministic,
          direction: 'WAIT',
          executable: false,
          clickTime: null,
          blocked: true,
          reason: 'Consenso não confirmado entre WILL determinístico e AI.',
          blockReasons: [...(deterministic.blockReasons ?? []), 'AI_CONSENSUS_FAILED']
        };

    if (decision.direction === 'BUY' || decision.direction === 'SELL') decision.clickTime = new Date().toISOString();
    return res.json({ ok: true, source: consensus ? 'will-ai-consensus' : 'will-ai-veto', decision, data: normalized, audit: createAuditEntry({ signal: normalized, decision, context }) });
  } catch (error) {
    console.error('Analysis error:', error.message);
    return res.status(500).json({ ok: false, error: 'Falha na análise.' });
  }
});

export default router;
