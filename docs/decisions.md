# BulkkX Decision Log

> Maintained per Section 14, 15 & 18 of the *BulkkX Architecture and Interface Design Plan*.  
> Any architectural choice, package substitution, or open product question must be logged here.

---

## Decision Index

| ID | Title | Date | Status | Governed By |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-001** | Selection of Modular Monolith & Workspace Layout | 2026-11-09 | Approved | Section 4 & 17 |
| **DEC-002** | Resolution of Section 15 Open Decisions (POC Defaults) | 2026-11-09 | Approved | Section 15 |
| **DEC-003** | pnpm Supply-Chain Security Policy Configuration | 2026-11-09 | Approved | Section 18.7 |
| **DEC-004** | Dual Web App Separation (`apps/web` vs `apps/admin`) | 2026-11-09 | Approved | Section 4 & 12 |

---

### DEC-001: Selection of Modular Monolith & Workspace Layout
* **Context**: Need a single deployable backend with strict internal module boundaries, decoupled worker, and typed contracts.
* **Options Considered**: Microservices vs Modular Monolith.
* **Decision**: Adopt a Modular Monolith in `apps/api` using NestJS on Fastify. Domain logic is shared with `apps/worker` without code duplication. Split into services only when scale forces it.

---

### DEC-002: Resolution of Section 15 Open Decisions (POC Defaults)
Per Section 15 of the brief, open decisions are made configurable behind adapters:
1. **Reserve Structure**: Set as configurable field on the `Reserve` entity (`cash` | `credit`). POC default: Simulated non-custodial bank reserve (1000 basis points / 10%).
2. **Fee Collection**: Configurable parameter `fee_collection_mode: "SUPPLIER_INVOICE" | "RESERVE_DEDUCTION"`. POC default: Invoiced to the supplier after fulfilment.
3. **Discount Funding**: Configurable parameter `discount_funding_source: "PLATFORM_FEE" | "SUPPLIER_VOLUME"`. POC default: Funded from the platform fee. Guardrail: Floor tied to minimum platform margin (100 bps).
4. **Balance Payment Path**: Configurable `balance_payment_mode: "OFF_PLATFORM_DIRECT" | "ESCROW_SPLIT"`. POC default: Settled directly between buyer and supplier post-reserve.
5. **Withdrawal / Cancellation Consequences**: Configurable scorecard penalties and reserve refund triggers on state machine exit states (`withdrawn`, `cancelled`, `lapsed`).
6. **Tax & Regulatory Treatment**: GST hooks built with configurable HSN/SAC codes and tax rate flags (1800 bps); zero hardcoded tax calculation logic.
7. **Pilot Categories & Corridors**: Configurable initial categories: `Non-Basmati Paddy/Rice` and `Polypropylene Granules (PP)`. Primary corridor: Gujarat – Maharashtra.

---

### DEC-003: pnpm Supply-Chain Security Policy
* **Decision**: Configure `pnpm-workspace.yaml` with:
  * `minimumReleaseAge: 2880` (packages must be published for at least 48 hours to mitigate day-zero malicious package takeovers).
  * `blockExoticSubdeps: true`
  * `allowBuilds`: strictly explicit whitelist (`esbuild`, `argon2`, etc.).

---

### DEC-004: Dual Web App Separation
* **Decision**: Separate the responsive PWA for traders (`apps/web`) from the desktop-first operational queue (`apps/admin`).
* **Reasoning**: Traders in APMCs/mandis operate on mid-range Android phones requiring a strict ~200 KB initial JS budget, touch targets, and offline support. Ops staff operate desktop consoles needing dense multi-row data tables, high-bandwidth document review, and URL query filters (`nuqs`).
