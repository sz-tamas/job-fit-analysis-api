# AI Job Analysis

[![CI](https://github.com/amiagm/job-fit-analysis-api/actions/workflows/ci.yml/badge.svg)](https://github.com/amiagm/job-fit-analysis-api/actions/workflows/ci.yml)
![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

A standalone sample of the ai analysis in [Am I a Good Match?](https://amiagoodmatch.com): submit a LinkedIn job URL and a CV, then retrieve a structured AI fit analysis.

It demonstrates an HTTP API, background work, Apify job normalization, structured OpenAI output, input validation, and a Git-native Bruno collection. It intentionally does **not** include the private product's UI, account system, persistence, job discovery pipeline, or preference-scoring rules.

## Structure

```text
src/
├── cli/       # terminal commands; calls services directly
├── routes/    # Express controllers; translates HTTP to service calls
├── services/  # analysis workflow, Apify integrations, OpenAI integration
├── dtos/      # analysis, candidate, and job contracts
└── utils/     # logging, configuration guards, and safe CV file handling
```

Both the CLI and HTTP routes call the same services. Routes contain no matching, queue, Apify, or OpenAI logic.

## Run locally

Requires Node.js 22+, an OpenAI API key, and an [Apify](https://apify.com/) token. The API uses `data_direct/linkedin-job-scraper` to retrieve one LinkedIn job-detail page. Both providers require accounts and their API usage may incur costs; review current pricing and set account spending limits before use.

```sh
cp .env.example .env
# Copy your own PDF locally; it is ignored by Git.
cp /path/to/your-cv.pdf cv/sample-cv.pdf
npm install
npm run dev
```

The API listens on `http://localhost:3001` by default. To run it in Docker:

```sh
docker compose up --build
```

## CLI

The CLI uses the same worker as the HTTP API and does not require the server to be running:

```sh
npm run analyze -- \
  --job-url "https://www.linkedin.com/jobs/view/1234567890" \
  --cv-file sample-cv.pdf
```

Or use a public LinkedIn profile as the candidate source:

```sh
npm run analyze -- \
  --job-url "https://www.linkedin.com/jobs/view/1234567890" \
  --linkedin-profile-url "https://www.linkedin.com/in/your-public-profile"
```

It writes the normal structured progress logs to the terminal and prints the completed analysis JSON when done. Supply exactly one of `--cv-file` or `--linkedin-profile-url`.

## API

Create an analysis:

```sh
curl -X POST http://localhost:3001/analyses \
  -H 'content-type: application/json' \
  -d '{
    "jobUrl": "https://www.linkedin.com/jobs/view/1234567890",
    "cvFile": "sample-cv.pdf"
  }'
```

The endpoint responds with `202 Accepted`:

```json
{ "analysisId": "b4c5...", "status": "queued" }
```

Provide exactly one candidate source:

```json
{ "cvFile": "sample-cv.pdf" }
```

or:

```json
{ "linkedinProfileUrl": "https://www.linkedin.com/in/your-public-profile" }
```

`cvFile` must be the filename of a PDF in `cv/`, for example `cv/sample-cv.pdf`. The service reads it into memory and sends it directly to the OpenAI API as a PDF input. It cannot read paths outside that directory; PDFs are excluded from Git by default.

For `linkedinProfileUrl`, the worker uses Apify's `dev_fusion/linkedin-profile-scraper` actor and supplies its returned public profile data to the analysis. Public LinkedIn profiles can be incomplete, so a PDF CV generally produces more reliable results. Only process a profile you own or have permission to use.

The same request with a LinkedIn profile source is:

```sh
curl -X POST http://localhost:3001/analyses \
  -H 'content-type: application/json' \
  -d '{
    "jobUrl": "https://www.linkedin.com/jobs/view/1234567890",
    "linkedinProfileUrl": "https://www.linkedin.com/in/your-public-profile"
  }'
```

Poll until it completes:

```sh
curl http://localhost:3001/analyses/b4c5...
```

Each analysis response contains an `events` array. Those same secret-free structured events are written as JSON lines to stdout, making them easy to inspect locally or ingest from a container platform. A missing `OPENAI_API_KEY` or `APIFY_TOKEN` is rejected at `POST /analyses` with `503` and a structured `error` object; `GET /health` reports the missing variable names without revealing values.

Completed analyses return:

```json
{
  "status": "completed",
  "result": {
    "score": 87,
    "verdict": "strong_match",
    "summary": "Strong overlap in backend platform experience.",
    "strengths": ["Relevant Node.js experience"],
    "gaps": ["No stated Kubernetes experience"],
    "reasoning": ["The role's core API work matches the CV."],
    "cv_assessment": {
      "applicationUrgency": "Apply now — the core experience is well aligned.",
      "strongMatchSignals": ["Relevant Node.js experience"],
      "neutralSignals": [],
      "negativeSignals": [],
      "cvGapsToAddress": [],
      "hiddenRiskSignals": [],
      "missingInformation": [],
      "bestAngle": "Backend engineer with strong API experience.",
      "customShortCoverNote": "I am a backend engineer with relevant Node.js experience...",
      "threeBulletRelevancePitch": ["Node.js API experience"],
      "cvKeywordsToEmphasize": ["Node.js", "TypeScript"],
      "questionsToAskRecruiter": [],
      "redFlagsToVerifyEarly": [],
      "whyThisIsNotAFit": []
    }
  }
}
```

Open `bruno/` in [Bruno](https://www.usebruno.com/), select the `local` environment, run **Create analysis**, copy `analysisId` into the environment, then run **Get analysis**.

## Design decisions

The queue and analysis store are intentionally in memory: this keeps the example understandable in a few minutes. Restarting the service discards queued and completed analyses. A production deployment would use persistent storage plus a durable queue for retries, recovery, and horizontal scaling.

The fetcher uses an Apify actor to retrieve and normalize one LinkedIn job-detail page. If the listing is unavailable or the actor returns incomplete data, the analysis is marked `failed` with a clear error. A production deployment should use a compliant, authorized job-data provider and account for provider cost, retries, and rate limits.

## Privacy and responsible use

Use `linkedinProfileUrl` only for a profile you own or where you have the person's explicit authorization to process it. You are responsible for complying with applicable privacy laws and with the terms, policies, and acceptable-use requirements of LinkedIn, Apify, OpenAI, and any other provider you use. Do not commit CVs, profile data, API keys, or other personal data to this repository.

## Verification

```sh
npm test
npm run typecheck
```
