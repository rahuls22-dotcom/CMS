# Prosperr CMS — Wealth Onboarding Milestone

React + TypeScript implementation of the **Wealth Onboarding Milestone (P0)** funnel from
`design_handoff_wealth_onboarding`. Phase 1 covers the funnel core: the data model and
state machine, the client list, the client milestone page, and the three funnel dialogs.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
```

## What's here

| Area | Files |
|---|---|
| Entities | [`src/domain/types.ts`](src/domain/types.ts) |
| Stage table, derived state, flags | [`src/domain/funnel.ts`](src/domain/funnel.ts) |
| State machine (R3 / R4 / R5 / R7) | [`src/domain/store.ts`](src/domain/store.ts) |
| Mock data | [`src/domain/seed.ts`](src/domain/seed.ts) |
| Client list | [`src/features/clientList/ClientList.tsx`](src/features/clientList/ClientList.tsx) |
| Client milestone page | [`src/features/clientPage/ClientPage.tsx`](src/features/clientPage/ClientPage.tsx) |
| Dialogs | [`src/features/dialogs/`](src/features/dialogs/) |
| Design tokens | [`src/styles/tokens.css`](src/styles/tokens.css) |

## Funnel rules enforced in code

All transitions go through the reducer in `store.ts`, so no screen can move a client
without a history entry being written.

- **R1** — one milestone per client; seeded at Not started / New.
- **R3** — stage advances only on its exit criterion; every change logs actor + timestamp.
- **R4** — drop allowed from stages 1–4 only. Reason required; "Other" requires free text;
  no-show captures N. `dropped_at_stage` is recorded and the client keeps that stage.
- **R5** — a closed milestone (Converted or Dropped) rejects further mutation.
- **R7** — Completed without a MoM stays in Wealth call with a `MoM pending` flag.
  Saving the MoM moves the client to Onboarding / KYC pending.

Flags are derived, never stored: `Dropped`, `Converted`, `MoM pending`, `No-show ×N`,
`Stuck Nd` (≥ 5 days in stage). Row tint follows the same derivation — red = RM action
needed, amber = waiting, closed rows untinted.

## Screens

| Screen | Role | Status |
|---|---|---|
| RM dashboard — milestone strip, At risk, Upcoming wealth calls | RM | Built |
| Advisor dashboard — Wealth calls, MoM pending | Advisor | Built |
| Admin funnel — KPIs, per-stage bars, cohort conversion, drop-off, closed×stage | Admin | Built |
| Client list | all | Built |
| Client milestone page + right rail (Milestone / Chat / Documents / Meetings) | all | Built |
| Update status · Mark as dropped · Add MoM | RM / Advisor | Built |

Seeded with 240 milestones matching the prototype's funnel shape: 141 in progress,
41 converted, 58 dropped, 64/38/22/17 across the open stages.

## Not built yet

- **Book / Reschedule call dialog** — books with a fixed slot; no date/advisor picker
  (placeholder in the handoff pending final designs)
- **Call Booking Flow** — the handoff's second feature, untouched
- **Prototype "simulate" panel** — package activation / re-activation / reset
- Admin period filters (Week / Month / Quarter / Custom) are rendered but do not yet
  filter, since every milestone shares one seeded cohort

## Deviations from the handoff

See [`IMPLEMENTATION-NOTES.md`](IMPLEMENTATION-NOTES.md).
