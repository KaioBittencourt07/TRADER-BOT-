import { Router } from 'express';
import { analyzeWithOpenAI } from '../ai/openaiEngine.js';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const marketAnalysis = req.body;
    if (!marketAnalysis || typeof marketAnalysis !== 'object') {
      return res.status(400).json({ ok: false, error: 'Payload inválido.' });
    }

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
        }
      });
    }

    const ai = await analyzeWithOpenAI(marketAnalysis);
    const finalDecision = ai.block
      ? { ...ai, direction: 'WAIT' }
      : ai;

    return res.json({ ok: true, source: 'openai', decision: finalDecision });
  } catch (error) {
    console.error('AI analysis error:', error.message);
    return res.status(500).json({ ok: false, error: 'Falha na análise de IA.' });
  }
});

export default router;
