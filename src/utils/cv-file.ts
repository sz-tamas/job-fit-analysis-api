import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { CvDocument } from '../dtos/candidate';

const directory = path.resolve(process.cwd(), 'cv');

export function validateCvFilename(value: unknown): string {
    const filename = typeof value === 'string' ? value.trim() : '';

    if (
        !filename ||
        path.basename(filename) !== filename ||
        !filename.toLowerCase().endsWith('.pdf')
    ) {
        throw new Error('cvFile must be the name of a PDF in the cv directory.');
    }

    return filename;
}
export async function readCvFile(value: unknown): Promise<CvDocument> {
    const filename = validateCvFilename(value);
    const filePath = path.resolve(directory, filename);

    if (!filePath.startsWith(`${directory}${path.sep}`)) {
        throw new Error('cvFile must be in the cv directory.');
    }

    let metadata;
    try {
        metadata = await stat(filePath);
    } catch {
        throw new Error(`CV file not found: ${filename}.`);
    }

    if (!metadata.isFile()) throw new Error(`CV file not found: ${filename}.`);
    if (metadata.size > 10 * 1024 * 1024) throw new Error('CV PDF must be 10 MB or smaller.');

    return { filename, contentBase64: (await readFile(filePath)).toString('base64') };
}
