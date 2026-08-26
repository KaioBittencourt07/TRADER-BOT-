import { Router } from 'express';
import { createTwelveDataProvider } from '../../../data/src/providers/twelveDataProvider.js';

const router = Router();

router.get('/market', async (req, res) => {
  const asset = String(req.query.asset || process.env.DEFAULT_ASSET || 'EUR/USD');
  const timeframe = String(req.query.timeframe || '1min');
  const outputsize = Math.min(Math.max(Number(req.query.outputsize || 50), 12), 200);
  try {
    const provider = createTwelveDataProvider();
    const snapshot = await provider.getSnapshot(asset, timeframe, outputsize);
    return res.json({ ok: snapshot.valid, snapshot });
  } catch (error) {
    console.error('Market provider error:', error.message);
    return res.status(503).json({ ok: false, error: error.message });
  }
});

export default router;
