# Contributing

Thanks for taking an interest in this small example project.

## Setup and verification

Use Node.js 22 or newer, then install dependencies and run the checks:

```sh
npm install
npm run typecheck
npm test
```

Format TypeScript with four-space indentation using the repository's Prettier configuration:

```sh
npx prettier@3.5.3 --write 'src/**/*.ts'
```

Keep route handlers and CLI commands thin. Put application logic in `src/services/`, reusable helpers in `src/utils/`, and contracts in `src/dtos/`.

## Sensitive files

Never commit `.env`, API tokens, or real CV PDFs. PDFs in `cv/` are ignored by Git; use only CVs and LinkedIn profiles that you own or are authorized to process.
