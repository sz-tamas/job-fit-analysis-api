import { ApifyClient } from 'apify-client';
import type { Job } from '../dtos/job';

const actor = 'data_direct/linkedin-job-scraper';
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export function validateJobUrl(value: unknown): string {
    const raw = String(value || '').trim();
    let url: URL;

    try {
        url = new URL(raw);
    } catch {
        throw new Error('jobUrl must be a valid URL.');
    }

    if (
        !['http:', 'https:'].includes(url.protocol) ||
        !/(^|\.)linkedin\.com$/i.test(url.hostname) ||
        !/\/jobs\/view\//i.test(url.pathname)
    ) {
        throw new Error('jobUrl must be a LinkedIn job-detail URL.');
    }

    url.hash = '';

    return url.toString();
}

export async function fetchJob(value: unknown): Promise<Job> {
    const url = validateJobUrl(value);
    const token = process.env.APIFY_TOKEN;

    if (!token) throw new Error('APIFY_TOKEN is not configured.');

    const client = new ApifyClient({ token });
    const run = await client.actor(actor).call({ url }, { waitSecs: 180 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 1 });
    const row = items[0] as Record<string, unknown> | undefined;

    if (!row) {
        throw new Error('Apify returned no job details. Check that the LinkedIn listing is public and still available.');
    }

    const job: Job = {
        url: text(row.url) || url,
        title: text(row.title),
        company: text(row.company),
        location: text(row.location),
        description: text(row.description).slice(0, 20_000),
    };

    if (!job.title || !job.company || !job.description) {
        throw new Error('Apify returned incomplete job details.');
    }

    return job;
}
