import { Router } from 'express';
import { missingConfiguration } from '../utils/config';
import { log } from '../utils/logger';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
    const missing = missingConfiguration();
    const status = missing.length ? 'degraded' : 'ok';

    log(missing.length ? 'warn' : 'info', 'health.checked', `Health check returned ${status}.`, {
        missingConfiguration: missing.length,
    });

    return res.status(missing.length ? 503 : 200).json({ status, missingConfiguration: missing });
});
