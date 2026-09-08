import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArguments } from '../cli/analyze';

test('parses a PDF-based CLI invocation', () => {
    assert.deepEqual(
        parseArguments([
            '--job-url',
            'https://www.linkedin.com/jobs/view/123',
            '--cv-file',
            'resume.pdf',
        ]),
        {
            jobUrl: 'https://www.linkedin.com/jobs/view/123',
            cvFile: 'resume.pdf',
            linkedinProfileUrl: undefined,
        }
    );
});

test('requires a job URL and a valid flag shape', () => {
    assert.throws(() => parseArguments(['--cv-file', 'resume.pdf']), /Missing --job-url/);
    assert.throws(() => parseArguments(['--unknown', 'value']), /Usage/);
});
