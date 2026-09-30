# Contributing

## Development

```bash
npm install
npm run check:secrets
npm run typecheck
npm test
npm run build
npm run check:package
```

The runtime package has no production dependencies. Please keep the public API
small, preserve Node.js 18+ support, and add unit tests for behavior changes.

## Pull requests

- Explain the behavior change and compatibility impact.
- Include tests for new behavior.
- Do not include real webhook URLs, tokens, `.env` files, or generated secrets.
- Keep generated `dist/` artifacts out of commits; the release workflow builds them.