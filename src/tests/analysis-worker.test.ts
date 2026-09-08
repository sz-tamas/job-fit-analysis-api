import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalysis, validateCandidateSource } from '../services/analysis-queue-service';

test('rejects a CV filename outside the cv directory', async () => {
    await assert.rejects(
        () =>
            createAnalysis({
                jobUrl: 'https://www.linkedin.com/jobs/view/123',
                cvFile: '../resume.pdf',
                linkedinProfileUrl: undefined,
            }),
        /cvFile/
    );
});

test('rejects a non-LinkedIn job URL before it is queued', async () => {
    await assert.rejects(
        () =>
            createAnalysis({
                jobUrl: 'https://example.com/job',
                cvFile: 'resume.pdf',
                linkedinProfileUrl: undefined,
            }),
        /LinkedIn/
    );
});

test('rejects a request when credentials are missing', async () => {
    const oldOpenAi = process.env.OPENAI_API_KEY;
    const oldApify = process.env.APIFY_TOKEN;
    delete process.env.OPENAI_API_KEY;
    delete process.env.APIFY_TOKEN;
    try {
        await assert.rejects(
            () =>
                createAnalysis({
                    jobUrl: 'https://www.linkedin.com/jobs/view/123',
                    cvFile: 'resume.pdf',
                    linkedinProfileUrl: undefined,
                }),
            { message: /Missing required configuration/ }
        );
    } finally {
        process.env.OPENAI_API_KEY = oldOpenAi;
        process.env.APIFY_TOKEN = oldApify;
    }
});

test('requires exactly one candidate source', () => {
    assert.throws(
        () => validateCandidateSource('resume.pdf', 'https://www.linkedin.com/in/example'),
        /exactly one/
    );
    assert.throws(() => validateCandidateSource(undefined, undefined), /exactly one/);
});
