# Badge inventory and maintenance

This document records the evidence behind the **24 distinct badges** shown in each of the three READMEs. The technology versions are the concrete resolved versions in the feature branch's `package-lock.json`. Counts are a snapshot of successful GitHub Actions run [42853574386](https://github.com/RamonRDR/ai-website-generator/actions/runs/42853574386) on 2026-11-10.

## Audit inventory

| Technology or check   | Confirmed version or result | Evidence                                                                   | Included |
| --------------------- | --------------------------- | -------------------------------------------------------------------------- | -------- |
| CI                    | branch status               | .github/workflows/ci.yml; PR #1 CI run 42853574386                         | Yes      |
| Node.js               | 24 CI                       | .github/workflows/ci.yml (engines >=22.12.0 in package.json)               | Yes      |
| TypeScript            | 5.9.3                       | package-lock.json                                                          | Yes      |
| License               | MIT                         | LICENSE                                                                    | Yes      |
| Next.js               | 16.4.5                      | package-lock.json; app/                                                    | Yes      |
| React                 | 19.3.1                      | package-lock.json; src/ui/                                                 | Yes      |
| Zod                   | 4.6.7                       | package-lock.json; src/domain/schema.ts                                    | Yes      |
| JSZip                 | 3.10.2                      | package-lock.json; src/domain/export.ts                                    | Yes      |
| OpenAI API            | optional adapter            | src/server/provider.ts; disabled by default; not live-tested               | Yes      |
| Vitest                | 39 passing                  | CI run 42853574386, npm test (39/39; includes evaluation test)             | Yes      |
| Playwright E2E        | 11 passing                  | CI run 42853574386, npm run test:e2e (11/11)                               | Yes      |
| React Testing Library | 16.3.3                      | package-lock.json; tests/studio.test.tsx                                   | Yes      |
| jest-dom              | 6.9.1                       | package-lock.json; tests/setup.ts                                          | Yes      |
| ESLint                | 9.39.5 checked              | package-lock.json; eslint.config.mjs; CI                                   | Yes      |
| Prettier              | 3.9.10 checked              | package-lock.json; .prettierrc.json; CI                                    | Yes      |
| Typecheck             | strict passing              | tsconfig.json strict=true; CI npm run typecheck                            | Yes      |
| Next build            | passing                     | CI npm run build                                                           | Yes      |
| Demo eval             | 20 fixtures                 | tests/fixtures.ts; tests/evaluation.test.ts (1 Vitest test; not +20 tests) | Yes      |
| Vite                  | 7.3.7 test tooling          | package-lock.json; vitest.config.ts                                        | Yes      |
| jsdom                 | 27.4.0                      | package-lock.json; vitest.config.ts test.environment                       | Yes      |
| Vite React plugin     | 5.2.0                       | package-lock.json; vitest.config.ts                                        | Yes      |
| Export                | HTML CSS ZIP                | src/domain/export.ts                                                       | Yes      |
| History               | browser local               | src/domain/storage.ts                                                      | Yes      |
| Preview               | sandboxed                   | src/ui/GeneratorStudio.tsx                                                 | Yes      |

## Interpretation

- `Node.js 24 CI` describes the configured GitHub Actions runner, **not** the minimum engine (`>=22.12.0`).
- `OpenAI API optional adapter` identifies implemented server-side integration code, **not** a validated paid-provider connection.
- `Vitest 39 passing` reflects 39 distinct cases across nine files in the baseline successful CI run.
- `Demo eval 20 fixtures` means one Vitest evaluation test checks 20 synthetic inputs; the additional `npm run evaluate` re-executes that test and does not add 20 tests to the count.
- `Playwright E2E 11 passing` is the Chromium browser suite result.
- `Vite`, `Vite React plugin`, `jsdom` and `jest-dom` are direct development dependencies used by the test configuration and tests; they are **not** a separate Vite production app.
- `Next build passing`, `Typecheck strict passing`, `ESLint checked` and `Prettier checked` are backed by corresponding successful CI steps.
- The dynamic CI badge is restricted to `feat/structured-website-generator` because the PR is still in draft. **After a permitted merge**, repoint it to `main`; do not display an unverified main-branch passing status.
- `Export`, `History` and `Preview` are implemented technical capabilities, not third-party platforms.

## Excluded from badges

The repository does not implement pytest/Python, Tailwind CSS, a database, PostgreSQL, Redis, Docker/Compose, Alembic, MCP, RAG, embeddings, OAuth, OpenAPI/Swagger UI, PWA, a production deployment, cloud publishing, a security vulnerability scanner, or measured coverage. No such badges are included.

`eslint-config-next` and TypeScript/React typings are supporting configuration/types rather than independently advertised technology capabilities; no separate badges are added for these auxiliary packages. Transitive packages from the lockfile are likewise excluded.

## Reproducible update procedure

1. Check `package.json`, `package-lock.json`, tooling configs, source code, `.github/workflows/ci.yml` and new integrations.
2. Inspect the **successful** GitHub Actions run corresponding to the current PR or target branch.
3. Read Vitest's `Tests ... passed` line and Playwright's `... passed` line, including failures and skips; avoid counting duplicated `evaluate` runs or fixture prompts as extra test cases.
4. Update the numbers and version strings in **all three** READMEs and this inventory in one isolated documentation PR/commit.
5. Keep the official CI badge branch-specific; verify internal links and run `npm run format:check`, `npm test` and GitHub Actions CI.
6. Never auto-commit into `main` or claim coverage, paid AI validation, deployments or security certifications without evidence.

Last badge baseline: 39 Vitest passing, 11 Playwright E2E passing, 20 synthetic deterministic fixtures, 0 failures, 0 skips.
