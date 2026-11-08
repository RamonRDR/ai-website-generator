# Evaluation Protocol

The suite `tests/evaluation.test.ts` defines **20 synthetic inputs** covering the requested categories, visual choices, incomplete or ambiguous prompts, long text, link attacks, prompt injection, complex layouts, export and version restoration language.

For each input the deterministic engine is asked to:

1. Generate a site using the given category, language and theme.
2. Validate the site through Zod.
3. Render it through the allowlisted HTML renderer.
4. Export its static files.

Measured fields: schema validation result, render success, export success and generation/render/export duration. An assertion checks that all 20 fixtures complete successfully. The suite does not make external API calls and therefore **cannot estimate actual LLM reliability, token usage, cost, hallucination rate or generation latency**.

Possible future live evaluation metrics, only with explicit paid-call authorization:

- Valid schema rate and recovery attempts.
- Human-rated visual fidelity and instruction adherence.
- Export success and screenshot similarity.
- Accessibility scans and manual keyboard inspection.
- Latency distributions, token usage and actual provider cost.
- Prompt injection robustness under an adversarial dataset.

Do not present deterministic demo measurements as live model results. Current CI status is the source of truth about whether tests passed.
