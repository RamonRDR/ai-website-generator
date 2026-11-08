# Testing

Prerequisites: Node.js 22.12+ and npm.

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run evaluate
npm run build
npx playwright install chromium
npm run test:e2e
npm run format:check
```

| Layer | Coverage |
| --- | --- |
| Zod | Input limits, unknown components, invalid schemas, URL controls, image host restrictions |
| Domain | Deterministic generation, 7 categories, 4 themes, 3 languages, scoped regeneration |
| Renderer | HTML escaping, hidden sections, semantics, responsive styles, reject unsafe links |
| Export | Fixed files, HTML/CSS/metadata integrity, ZIP round trip, path traversal resistance |
| History | Corrupt local data rejection, 15-snapshot retention |
| Provider | Paid LLM disabled by default; no unauthorized HTTP calls |
| React Testing Library | Form inputs, device toggle, generation, editor, checkpoint |
| Playwright | Main browser flow, proposed regeneration acceptance/rejection, ZIP download, health |
| Evaluations | 20 synthetic deterministic fixtures |

CI uses standard GitHub-hosted `ubuntu-latest` runners with Node 24 and Chromium. Tests do not require any API key, paid endpoint or user computer. CI does not deploy or merge.

The live model is not automatically called. To report real LLM performance later, run a separately authorized evaluation with costs, model/version, dataset and reproducible metrics explicitly disclosed.
