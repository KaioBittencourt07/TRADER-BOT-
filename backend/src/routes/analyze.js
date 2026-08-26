import { Router } from 'express';
import { analyzeWithOpenAI } from '../ai/openaiEngine.js';
import { normalizeMarketSnapshot } from '../../../data/src/marketAdapter.js';

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
      return res.json({
        ok: true,
        source: 'data-guard',
        decision: {
          direction: 'WAIT',
          score: 0,
          confidence: 0,
          thesis: 'Entrada bloqueada: dados de mercado inválidos ou atrasados.',
          confirmations: [],
          risks: [normalized.reason],
          block: true
        },
        data: normalized
      });
    }

    const marketAnalysis = { ...payload, market: normalized };

    // Deterministic blocks always win over model output.
    if (marketAnalysis.blocked === true || marketAnalysis.direction === 'WAIT') {
      return res.json({
        ok: true,
        source: 'deterministic-gate',
        decision: {
          direction: 'WAIT',
          score: marketAnalysis.score ?? 0,
          confidence: marketAnalysis.confidence ?? 0,
          thesis: 'Entrada bloqueada pelas regras determinísticas do WILL.',
          confirmations: marketAnalysis.confirmations ?? [],
          risks: marketAnalysis.riskFlags ?? ['Condição não liberada'],
          block: true
        },
        data: normalized
      });
    }

    const ai = await analyzeWithOpenAI(marketAnalysis);
    const finalDecision = ai.block ? { ...ai, direction: 'WAIT' } : ai;

    return res.json({ ok: true, source: 'openai', decision: finalDecision, data: normalized });
  } catch (error) {
    console.error('AI analysis error:', error.message);
    return res.status(500).json({ ok: false, error: 'Falha na análise de IA.' });
  }
});

export default router;
