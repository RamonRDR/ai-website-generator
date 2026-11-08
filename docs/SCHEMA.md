# Structured Website Schema (v1)

Source of truth: `src/domain/schema.ts`, using Zod v4.

## Website

| Field | Type | Constraint |
| --- | --- | --- |
| `schemaVersion` | `1` | Fixed literal |
| `id` | slug string | Lowercase letters/numbers/hyphens, 3–40 chars |
| `name` | string | 1–240 chars |
| `description` | string | Maximum 1,500 chars |
| `language` | enum | `en`, `pt-BR`, `es` |
| `category` | enum | `business`, `portfolio`, `institutional`, `product`, `services`, `event`, `restaurant` |
| `theme` | enum | `ocean`, `sunset`, `forest`, `mono` |
| `palette` | object | `background`, `surface`, `text`, `primary`, `accent`; six-digit hex strings |
| `sections` | array | Between 2 and 18, unique IDs |

Total JSON size is limited to 90,000 characters. Extra object keys are forbidden.

## Section

Each section has a slug `id`, `type`, `title` (1–240), `description` (up to 1,500), `items` (up to eight), optional `action`, optional `image` and a boolean `hidden`.

The closed section catalog is:

| Type | Intended purpose |
| --- | --- |
| `header` | Site identity and primary navigation action |
| `hero` | Main headline and introductory CTA |
| `features` | Capabilities and feature cards |
| `about` | Background narrative |
| `services` | Service cards |
| `pricing` | Price cards or placeholders |
| `testimonials` | Testimonials only when supplied as verified content |
| `faq` | Frequently asked questions |
| `cta` | Conversion section |
| `contact` | Contact information or placeholders |
| `footer` | Credits or closing notes |

Items use `{ heading, text, href? }`; actions use `{ label, href }`. Links accept HTTP(S), `mailto:`, `tel:`, local paths and hash anchors, but reject script/data protocols, control characters and credentials. Images require a useful `alt` and an HTTPS URL from `images.unsplash.com` or `placehold.co`. Images are not fetched by the server.

The schema does not contain HTML, JSX, JavaScript, style strings, arbitrary component names or arbitrary file paths. All text is escaped when rendered.

## Input and edit validation

Generation prompt: 10–1,500 characters. Name: 2–100. Audience and goal: up to 160. Regeneration instruction: 5–500. Regeneration requires an existing section ID. All server-side incoming JSON is parsed with Zod; all client edits are revalidated before updating website state.

## Future changes

A schema migration should be implemented before introducing `schemaVersion: 2` or breaking existing saved projects.
