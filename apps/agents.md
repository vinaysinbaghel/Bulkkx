Work contract-first: write the OpenAPI spec and shared types before implementing
endpoints.
Test the state machine exhaustively (every transition, guard and timeout). Add
integration tests for the API and end-to-end tests for the four critical flows.
Use feature flags, seed data for two sample categories and the simulated adapters
throughout.
Never implement real money movement or compliance logic without an explicit
instruction.
Keep changes small, documented and traceable to a milestone, and record decisions in
a decision log.
When something is ambiguous or on the open-decisions list, ask or make it
configurable. Do not guess
The server is the only source of truth. The web app never imports transitionDeal, masking or matching to make decisions.
Money is integer paise, and percentages are basis points. No floats.
Never implement real money movement, GST or escrow logic. Build hooks and config, and add a line to DECISIONS.md.
Anything on the PDF’s open-decisions list becomes config, never a hardcoded value.
Every task needs a failing test first, then the fix, then pnpm test and pnpm -r build green.
Do not touch files outside the task’s listed scope.