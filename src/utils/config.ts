export function missingConfiguration(): string[] {
    return ['OPENAI_API_KEY', 'APIFY_TOKEN'].filter((key) => !process.env[key]?.trim());
}
