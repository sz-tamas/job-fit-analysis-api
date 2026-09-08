import { randomUUID } from 'node:crypto';
import type { Analysis, CreateAnalysisInput } from '../dtos/analysis';
import type { Candidate, CandidateSource } from '../dtos/candidate';
import { missingConfiguration } from '../utils/config';
import { log } from '../utils/logger';
import { readCvFile, validateCvFilename } from '../utils/cv-file';
import { analyze } from './analysis-service';
import { fetchJob, validateJobUrl } from './job-service';
import { fetchLinkedInProfile, validateLinkedInProfileUrl } from './profile-service';

const analyses = new Map<string, Analysis>();

export function validateCandidateSource(
    cvFile: unknown,
    linkedinProfileUrl: unknown
): CandidateSource {
    const hasCvFile = typeof cvFile === 'string' && cvFile.trim().length > 0;
    const hasProfile = typeof linkedinProfileUrl === 'string' && linkedinProfileUrl.trim().length > 0;

    if (hasCvFile === hasProfile) throw new Error('Provide exactly one of cvFile or linkedinProfileUrl.');

    return hasCvFile
        ? { type: 'pdf', filename: validateCvFilename(cvFile) }
        : { type: 'linkedinProfile', url: validateLinkedInProfileUrl(linkedinProfileUrl) };
}

export async function createAnalysis(input: CreateAnalysisInput): Promise<Analysis> {
    const jobUrl = validateJobUrl(input.jobUrl);
    const source = validateCandidateSource(input.cvFile, input.linkedinProfileUrl);
    const missing = missingConfiguration();

    if (missing.length) {
        log(
            'warn',
            'configuration.missing',
            'Analysis request rejected because required configuration is missing.',
            {
                missing: missing.join(','),
            }
        );

        const error = new Error(
            `Missing required configuration: ${missing.join(', ')}.`
        ) as Error & { code: string };

        error.code = 'CONFIGURATION_MISSING';

        throw error;
    }

    const document = source.type === 'pdf' ? await readCvFile(source.filename) : undefined;

    const analysis: Analysis = {
        id: randomUUID(),
        status: 'queued',
        createdAt: new Date().toISOString(),
        events: [],
    };

    analysis.events.push(
        log(
            'info',
            'analysis.queued',
            'Analysis accepted and queued.',
            {
                candidateSource: source.type,
                ...(source.type === 'pdf' ? { cvFile: source.filename } : {}),
            },
            analysis.id
        )
    );

    analyses.set(analysis.id, analysis);

    queueMicrotask(async () => {
        try {
            analysis.status = 'processing';

            analysis.events.push(
                log(
                    'info',
                    'analysis.processing',
                    'Fetching job details from Apify.',
                    undefined,
                    analysis.id
                )
            );

            analysis.job = await fetchJob(jobUrl);

            analysis.events.push(
                log(
                    'info',
                    'job.fetched',
                    'Job details fetched from Apify.',
                    { descriptionCharacters: analysis.job.description.length },
                    analysis.id
                )
            );

            const candidate: Candidate =
                source.type === 'pdf'
                    ? { type: 'pdf', document: document! }
                    : { type: 'linkedinProfile', profile: await fetchLinkedInProfile(source.url) };

            if (candidate.type === 'linkedinProfile') {
                analysis.events.push(
                    log(
                        'info',
                        'profile.fetched',
                        'LinkedIn profile data fetched from Apify.',
                        undefined,
                        analysis.id
                    )
                );
            }

            analysis.result = await analyze(analysis.job, candidate);
            analysis.status = 'completed';
            analysis.events.push(
                log(
                    'info',
                    'analysis.completed',
                    'AI analysis completed.',
                    { score: analysis.result.score, verdict: analysis.result.verdict },
                    analysis.id
                )
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Analysis failed.';

            analysis.status = 'failed';
            analysis.error = { code: 'ANALYSIS_FAILED', message };
            analysis.events.push(log('error', 'analysis.failed', message, undefined, analysis.id));
        }
    });
    return analysis;
}

export function getAnalysis(id: string): Analysis | undefined {
    return analyses.get(id);
}
