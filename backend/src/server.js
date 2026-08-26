import 'dotenv/config';
import express from 'express';
import analyzeRouter from './routes/analyze.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const dashboardOrigin = process.env.DASHBOARD_ORIGIN || '*';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', dashboardOrigin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'will-trader-backend', openaiConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.use('/api', analyzeRouter);

app.listen(port, () => console.log(`WILL TRADER backend running on port ${port}`));
