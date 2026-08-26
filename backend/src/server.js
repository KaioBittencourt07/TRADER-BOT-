import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'will-trader-backend',
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.listen(port, () => {
  console.log(`WILL TRADER backend running on port ${port}`);
});
