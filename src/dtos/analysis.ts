import type { Job } from './job';
import type { LogEvent } from '../utils/logger';

export const verdicts = ['strong_match', 'match', 'weak_match', 'not_a_match'] as const;
export type Verdict = (typeof verdicts)[number];

export interface CvAssessment {
    applicationUrgency: string;
    strongMatchSignals: string[];
    neutralSignals: string[];
    negativeSignals: string[];
    cvGapsToAddress: string[];
    hiddenRiskSignals: string[];
    missingInformation: string[];
    bestAngle: string;
    customShortCoverNote: string;
    threeBulletRelevancePitch: string[];
    cvKeywordsToEmphasize: string[];
    questionsToAskRecruiter: string[];
    redFlagsToVerifyEarly: string[];
    whyThisIsNotAFit: string[];
}

export interface AnalysisResult {
    score: number;
    verdict: Verdict;
    summary: string;
    strengths: string[];
    gaps: string[];
    reasoning: string[];
    cv_assessment: CvAssessment;
}

export interface CreateAnalysisInput {
    jobUrl: unknown;
    cvFile?: unknown;
    linkedinProfileUrl?: unknown;
}

export interface Analysis {
    id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    createdAt: string;
    job?: Job;
    result?: AnalysisResult;
    error?: { code: string; message: string };
    events: LogEvent[];
}

const listSchema = {
    type: 'array',
    items: { type: 'string', maxLength: 500 },
    maxItems: 8,
} as const;

export const resultSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        score: { type: 'integer', minimum: 0, maximum: 100 },
        verdict: { type: 'string', enum: [...verdicts] },
        summary: { type: 'string', maxLength: 600 },
        strengths: { type: 'array', items: { type: 'string', maxLength: 300 }, maxItems: 5 },
        gaps: { type: 'array', items: { type: 'string', maxLength: 300 }, maxItems: 5 },
        reasoning: { type: 'array', items: { type: 'string', maxLength: 300 }, maxItems: 5 },
        cv_assessment: {
            type: 'object',
            additionalProperties: false,
            properties: {
                applicationUrgency: { type: 'string', maxLength: 600 },
                strongMatchSignals: listSchema,
                neutralSignals: listSchema,
                negativeSignals: listSchema,
                cvGapsToAddress: listSchema,
                hiddenRiskSignals: listSchema,
                missingInformation: listSchema,
                bestAngle: { type: 'string', maxLength: 1000 },
                customShortCoverNote: { type: 'string', maxLength: 2000 },
                threeBulletRelevancePitch: listSchema,
                cvKeywordsToEmphasize: listSchema,
                questionsToAskRecruiter: listSchema,
                redFlagsToVerifyEarly: listSchema,
                whyThisIsNotAFit: listSchema,
            },
            required: [
                'applicationUrgency',
                'strongMatchSignals',
                'neutralSignals',
                'negativeSignals',
                'cvGapsToAddress',
                'hiddenRiskSignals',
                'missingInformation',
                'bestAngle',
                'customShortCoverNote',
                'threeBulletRelevancePitch',
                'cvKeywordsToEmphasize',
                'questionsToAskRecruiter',
                'redFlagsToVerifyEarly',
                'whyThisIsNotAFit',
            ],
        },
    },
    required: ['score', 'verdict', 'summary', 'strengths', 'gaps', 'reasoning', 'cv_assessment'],
} as const;
