import 'dotenv/config';
import { createAnalysis, getAnalysis } from '../services/analysis-queue-service';
import { log } from '../utils/logger';

export interface CliArguments {
    jobUrl: string;
    cvFile?: string;
    linkedinProfileUrl?: string;
}

export function parseArguments(args: string[]): CliArguments {
    const values: Record<string, string> = {};

    for (let index = 0; index < args.length; index += 2) {
        const key = args[index];
        const value = args[index + 1];

        if (
            !['--job-url', '--cv-file', '--linkedin-profile-url'].includes(key) ||
            !value ||
            value.startsWith('--')
        )
            throw new Error(
                'Usage: npm run analyze -- --job-url <LinkedIn job URL> (--cv-file <PDF filename> | --linkedin-profile-url <LinkedIn profile URL>)'
            );
        values[key] = value;
    }

    if (!values['--job-url']) throw new Error('Missing --job-url.');

    return {
        jobUrl: values['--job-url'],
        cvFile: values['--cv-file'],
        linkedinProfileUrl: values['--linkedin-profile-url'],
    };
}

const wait = (milliseconds: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main(): Promise<void> {
    const args = parseArguments(process.argv.slice(2));
    const analysis = await createAnalysis(args);
    const deadline = Date.now() + 5 * 60_000;
    while (analysis.status === 'queued' || analysis.status === 'processing') {
        if (Date.now() > deadline)
            throw new Error(`Analysis ${analysis.id} did not finish within five minutes.`);
        await wait(250);
    }
    const completed = getAnalysis(analysis.id);
    if (!completed) throw new Error(`Analysis ${analysis.id} was no longer available.`);
    if (completed.status === 'failed')
        throw new Error(completed.error?.message || 'Analysis failed.');
    console.log(JSON.stringify(completed, null, 2));
}

if (require.main === module)
    main().catch((error) => {
        log('error', 'cli.failed', error instanceof Error ? error.message : 'CLI analysis failed.');
        process.exitCode = 1;
    });
