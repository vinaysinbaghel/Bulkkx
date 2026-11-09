# BulkkX Dependency Registry & Justification Manifest

> This document is maintained per Section 17 & 18 of the *BulkkX Architecture and Interface Design Plan*.  
> All dependencies are pinned, license-verified, and scoped to their specific workspace.

---

## 1. Monorepo Root & Tooling

| Package | Workspace | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- | :--- |
| `turbo` | Root | MIT | Monorepo build pipeline, task graph caching, and parallel execution. | Nx, Lerna (heavier configuration overhead) |
| `typescript` | Root | Apache-2.0 | Type safety across all apps and shared packages in strict mode. | None (mandated default) |
| `tsx` | Root | MIT | Fast TypeScript script execution for seeders and dev runners. | `ts-node` (slower, complex ESM setup) |
| `tsup` | Root | MIT | Dual CJS/ESM zero-config bundler with `.d.ts` generation for shared packages. | Rollup, unbuild |
| `eslint` | Root | MIT | Code quality, import linting, and AST analysis. | Biome |
| `typescript-eslint` | Root | MIT | TypeScript ruleset for ESLint. | - |
| `eslint-plugin-boundaries` | Root | MIT | Enforces modular boundaries: prevents ORM leaks to domain and UI leaks across layers. | `dependency-cruiser` |
| `prettier` | Root | MIT | Opinionated formatting across TypeScript, JSON, and Markdown. | Biome |
| `knip` | Root | MIT | Detects unused files, unused exports, and orphan dependencies across workspaces. | `depcheck` |
| `lefthook` | Root | MIT | Fast polyglot Git hooks runner (pre-commit, pre-push lint and test gates). | Husky |
| `@stoplight/spectral-cli` | Root | Apache-2.0 | CLI for linting OpenAPI 3.1 contracts against industry standards. | Redocly CLI |

---

## 2. Shared Packages (`packages/*`)

### 2.1 `packages/shared`
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `zod` | MIT | Domain entity validation, input schemas, and type inference. | Yup, TypeBox |
| `xstate` | MIT | Single source of truth for deal state machine transitions, guards, and timeouts. | Robot, custom switch (fails edge cases) |
| `@xstate/graph` (dev) | MIT | Generates graph traversals and exhaustive test paths for state machine verification. | - |
| `ajv` & `ajv-formats` | MIT | Fast JSON Schema draft-07/2020-12 validator for dynamic commodity templates. | JSV |
| `date-fns` & `@date-fns/tz` | MIT | Immutable UTC/IST date manipulation without mutating native Date objects. | Moment (deprecated, avoid list), Day.js |
| `uuid` | MIT | Cryptographically secure UUID v7 generators for time-ordered entity IDs. | nanoid, cuid |
| `openapi-typescript` | MIT | Generates strict TypeScript types directly from the OpenAPI 3.1 schema. | swagger-codegen |
| `openapi-fetch` | MIT | Type-safe native `fetch` HTTP client typed with generated OpenAPI schema. | Axios (avoid list) |

### 2.2 `packages/ui`
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `@radix-ui/react-*` | MIT | Unstyled, accessible UI component primitives (dialogs, dropdowns, popovers, tabs). | Headless UI |
| `class-variance-authority` | Apache-2.0 | Type-safe component variant orchestrator for Tailwind classes. | - |
| `clsx` & `tailwind-merge` | MIT | Conditional class application with automated conflict resolution. | - |
| `lucide-react` | ISC | Accessible, tree-shakeable icons for commodity trade dashboards. | Feather, React Icons |

### 2.3 `packages/adapters`
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `zod` | MIT | Schema validation for adapter inputs, simulated webhooks, and outputs. | - |
| *Note* | - | Zero vendor SDKs installed per rule 17.9. Real providers sit behind simulators until PO decides. | - |

---

## 3. Applications (`apps/*`)

### 3.1 `apps/api` (Modular Monolith)
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `@nestjs/core`, `@nestjs/common` | MIT | Enterprise architecture, modular boundaries, dependency injection. | Express (avoid list) |
| `@nestjs/platform-fastify` | MIT | High-performance, low-overhead HTTP adapter for NestJS. | `@nestjs/platform-express` |
| `@nestjs/config` | MIT | Environment variable loading with Zod schema validation. | dotenv-safe |
| `@nestjs/swagger` | MIT | Automated OpenAPI 3.1 contract generation from route decorators. | - |
| `@nestjs/throttler` | MIT | Rate limiting and brute-force protection for OTP endpoints. | express-rate-limit |
| `@nestjs/terminus` | MIT | Production readiness, database, and health check probes. | - |
| `@nestjs/event-emitter` | MIT | In-process domain event dispatching across modular boundaries. | - |
| `nestjs-zod` | MIT | Native Zod pipe validation with automated Swagger schema synthesis. | class-validator |
| `drizzle-orm` & `pg` | Apache-2.0 / MIT | Type-safe SQL ORM supporting raw SQL row locks (`FOR UPDATE`). | Prisma (heavier engine), TypeORM |
| `drizzle-kit` (dev) | Apache-2.0 | Schema migration generator and database introspection. | - |
| `pg-boss` | MIT | Postgres-backed distributed queue for SLA timers, lock expiry, and outbox. | BullMQ/Redis (deferred per 17.12) |
| `jose` | Panva | Modern web crypto for JWT authentication tokens and webhook signatures. | jsonwebtoken |
| `argon2` | MIT | Resistant password hashing algorithm for staff administrative auth. | bcrypt |
| `otplib` | MIT | RFC 6238 TOTP/HOTP implementation for two-factor authentication. | speakeasy |
| `@casl/ability` | MIT | Role-based and object-level permission rules engine. | accesscontrol |
| `@fastify/helmet` & `@fastify/cors` | MIT | Security headers and cross-origin resource sharing protection. | - |
| `file-type` | MIT | MIME validation using magic numbers rather than vulnerable file extensions. | mime-types |
| `libphonenumber-js` | MIT | E.164 phone number formatting and Indian carrier validation. | google-libphonenumber |
| `pino` & `nestjs-pino` | MIT | High-speed, structured JSON logger with zero personally identifiable data leaks. | winston |
| `@sentry/node` | MIT | Exception tracking and unhandled rejection tracing. | - |

### 3.2 `apps/worker`
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `pg-boss` | MIT | Outbox consumer, supplier SLA monitor, 48h inspection countdown. | BullMQ |
| `drizzle-orm` & `pg` | Apache-2.0 / MIT | Direct DB updates on timer lapses (e.g., auto-accept deal, expire locks). | - |
| `pino` | MIT | Structured worker execution logs. | - |
| `@sentry/node` | MIT | Error capture for asynchronous worker failures. | - |

### 3.3 `apps/web` (Buyer & Supplier PWA)
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `next` | MIT | React server components, App Router, SSR, and static asset streaming. | Vite (not SSR/PWA native) |
| `tailwindcss` | MIT | Utility-first CSS engine. | - |
| `react-hook-form` | MIT | Performant un-controlled form validation engine. | Formik |
| `@hookform/resolvers` | MIT | Bridges React Hook Form with Zod schemas. | - |
| `@rjsf/core` & `@rjsf/validator-ajv8` | Apache-2.0 | Dynamic commodity specification form renderer driven by JSON Schema. | Custom form builder |
| `@tanstack/react-query` | MIT | Server state caching, optimistic updates, and automatic polling. | SWR |
| `serwist` & `@serwist/next` | MIT | Progressive Web App service worker for offline mandi operations. | next-pwa (unmaintained) |
| `idb-keyval` | Apache-2.0 | IndexedDB local key-value store for offline drafts and queued photo uploads. | localforage |
| `next-intl` | MIT | Internationalization for English and Hindi trader interfaces. | react-i18next |
| `sonner` | MIT | Lightweight accessible toast notifications. | react-hot-toast |
| `react-day-picker` | MIT | Calendar selection for delivery needed-by dates. | - |
| `browser-image-compression` | MIT | Client-side photo compression for low-bandwidth 2G/3G network uploads. | - |
| `@sentry/nextjs` | MIT | Client error reporting. | - |

### 3.4 `apps/admin` (Ops & Admin Console)
| Package | License | Purpose & Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| `next` | MIT | React App Router for desktop-first operational dashboard. | - |
| `@tanstack/react-table` | MIT | High-performance headless data grid for KYC queues and deals. | AG Grid (heavyweight) |
| `nuqs` | MIT | Bidirectional URL query state syncing for filters, tabs, and pagination. | useSearchParams |
| `recharts` | MIT | Visual charts for trading funnels, SLA breach rates, and ledger balances. | Chart.js |
| `react-dropzone` | MIT | Batch drag-and-drop document and inspection evidence ingestion. | - |

---

## 4. Prohibited Packages ("Avoid List" - Section 17.13)
* ❌ `express`: Replaced with NestJS on Fastify.
* ❌ `axios`: Replaced with native `fetch` and `openapi-fetch`.
* ❌ `moment`: Replaced with `date-fns`.
* ❌ `request`, `node-sass`, `enzyme`: Deprecated / obsolete.
* ❌ Full `lodash` imports: Only native methods or single-function imports.
* ❌ Floating-point arithmetic for currency: Mandated 64-bit integer paise.
