import { Router } from 'express';
import { createAnalysis, getAnalysis } from '../services/analysis-queue-service';
import { log } from '../utils/logger';

export const analysesRouter = Router();

analysesRouter.post('/', async (req, res) => {
    try {
        const analysis = await createAnalysis({
            jobUrl: req.body?.jobUrl,
            cvFile: req.body?.cvFile,
            linkedinProfileUrl: req.body?.linkedinProfileUrl,
        });

        return res.status(202).json({ analysisId: analysis.id, status: analysis.status });
    } catch (error) {
        const typed = error as Error & { code?: string };
        const code = typed.code || 'INVALID_REQUEST';

        log('warn', 'analysis.rejected', typed.message || 'Invalid request.', { code });

        return res
            .status(code === 'CONFIGURATION_MISSING' ? 503 : 400)
            .json({ error: { code, message: typed.message || 'Invalid request.' } });
    }
});

analysesRouter.get('/:id', (req, res) => {
    const analysis = getAnalysis(req.params.id);

    if (!analysis) {
        log('warn', 'analysis.not_found', 'Analysis was not found.', { analysisId: req.params.id });

        return res
            .status(404)
            .json({ error: { code: 'NOT_FOUND', message: 'Analysis not found.' } });
    }

    return res.json(analysis);
});
