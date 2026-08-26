import 'dotenv/config';
import express from 'express';
import analyzeRouter from './routes/analyze.js';
import marketRouter from './routes/market.js';
import contextRouter from './routes/context.js';
import { config } from './config.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.dashboardOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'will-trader-backend', openaiConfigured: Boolean(process.env.OPENAI_API_KEY), marketProvider: 'twelvedata', marketConfigured: Boolean(process.env.TWELVEDATA_API_KEY) });
});

app.use('/api', analyzeRouter);
app.use('/api', marketRouter);
app.use('/api', contextRouter);

app.listen(config.port, () => console.log(`WILL TRADER backend running on port ${config.port}`));
