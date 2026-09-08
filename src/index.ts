import 'dotenv/config';
import express from 'express';
import { analysesRouter } from './routes/analyses-router';
import { healthRouter } from './routes/health-router';

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use('/health', healthRouter);
app.use('/analyses', analysesRouter);
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

if (require.main === module)
    app.listen(Number(process.env.PORT || 3001), () =>
        console.log('AI analysis API listening on http://localhost:3001')
    );
export { app };
