# Security Model

## Primary guarantees

- Closed catalog of section types and strict Zod schema validation.
- No arbitrary JavaScript, dynamic JSX, user-supplied HTML, generated CSS or `eval`.
- All text/attributes are HTML-escaped by a single renderer.
- Navigation links reject `javascript:`, `data:`, protocol-relative URLs, credentials and control characters.
- External images are restricted to two HTTPS hosts; the server does not fetch user-selected URLs.
- Safe hex palette input only. HTML export filenames are fixed and cannot contain user path segments.
- Sandboxed iframe without script permissions, with no referrer. Preview-only `about:srcdoc` base URL keeps internal anchor navigation in the generated document; ZIP-exported HTML does not include that base element.
- Provider key stays server-only and never uses a public-prefixed environment variable.
- API requests enforce streamed UTF-8 byte limits and Zod constraints: 8,000 bytes for initial generation and 300,000 bytes for regeneration, including multibyte text in otherwise schema-valid sites. The latter accommodates the website's 90,000-UTF-16-code-unit serialized limit plus the instruction envelope. Provider timeout and token caps are explicit.
- Live generation is disabled until `LLM_ENABLED=true` and a key/model are set on the server.
- Production live calls require an additional explicit `LLM_ALLOW_PRODUCTION=true`.
- LLM output is parsed and validated before use. Live regeneration requests and validates one replacement section only; the server checks its original id/type and retains every other section and site metadata. Live provider behavior is not validated against a paid API.
- No secrets or raw provider error payloads are returned to clients.
- GitHub Actions uses minimum read permissions and never requires paid provider secrets.

## Threat model

Untrusted prompts, malicious model output, browser-local storage corruption, XSS payloads in textual fields, harmful links, oversized documents and ZIP traversal are within the bounded MVP threat model. Tests cover representative cases.

## Known gaps and deployment warning

**Do not expose live paid generation publicly yet.** This demo has no authentication, tenant controls, account quotas, distributed rate limiting, abuse mitigation or cost budgets across users. The on/off environment flags reduce accidental spending but do not turn the endpoint into a safe public paid service. The model's real-world factual accuracy and possible copyright implications remain human-review concerns.

This project does not claim an external penetration test, full WCAG certification or full OWASP coverage. The browser may contact approved external image hosts if the user chooses to add such an image. LocalStorage is not encrypted or cross-device synced and should not be used for secrets. If browser policy denies access to localStorage, the editor still works with in-memory state, but changes cannot persist across reloads.
