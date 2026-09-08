import { ApifyClient } from 'apify-client';
import type { LinkedInProfile } from '../dtos/candidate';

const actor = 'dev_fusion/linkedin-profile-scraper';

export function validateLinkedInProfileUrl(value: unknown): string {
    const raw = typeof value === 'string' ? value.trim() : '';
    let url: URL;

    try {
        url = new URL(raw);
    } catch {
        throw new Error('linkedinProfileUrl must be a valid URL.');
    }

    if (
        !['http:', 'https:'].includes(url.protocol) ||
        !/(^|\.)linkedin\.com$/i.test(url.hostname) ||
        !/^\/in\/[^/]+\/?$/i.test(url.pathname)
    ) {
        throw new Error('linkedinProfileUrl must be a LinkedIn public profile URL.');
    }

    url.hash = '';

    return url.toString();
}

export async function fetchLinkedInProfile(value: unknown): Promise<LinkedInProfile> {
    const url = validateLinkedInProfileUrl(value);
    const token = process.env.APIFY_TOKEN;

    if (!token) throw new Error('APIFY_TOKEN is not configured.');

    const client = new ApifyClient({ token });
    const run = await client.actor(actor).call({ profileUrls: [url] }, { waitSecs: 180 });
    const { items } = await client.dataset(run.defaultDatasetId).listItems({ limit: 1 });
    const profile = items[0] as Record<string, unknown> | undefined;

    if (!profile) {
        throw new Error('Apify returned no public LinkedIn profile data. Check visibility and the profile URL.');
    }

    const content = JSON.stringify(profile);

    if (content === '{}' || content.length < 30) {
        throw new Error('Apify returned incomplete LinkedIn profile data.');
    }

    return { url, content: content.slice(0, 30_000) };
}
