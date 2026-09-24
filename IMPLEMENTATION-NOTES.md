# Implementation notes

Where this code departs from `design_handoff_wealth_onboarding`, and why.

## 1. There is no existing CMS codebase to extend

The handoff says:

> Recreate them inside the existing CMS codebase using its framework, component library,
> routing, and data layer. … Where the CMS already has an equivalent component (top bar,
> milestone list table, client header + stepper, right rail, side panels, Add MOM, Book
> Call), **reuse the existing component** and only extend it.

No such codebase was available — this repo was empty at the start and no CMS project
exists locally or in the account. Every shared component here is therefore **new**, not
reused: top bar, table, chips, tags, modals, stepper, action cards.

**Consequence:** this is a reference implementation, not a drop-in extension. When it
moves into the real CMS, the primitives in `src/components/ui/` and `src/styles/` should
be replaced by that codebase's equivalents. The domain layer (`src/domain/`) is the part
meant to port directly.

## 2. Stage 1 statuses — README and prototype disagree

| Source | Statuses | Exit criterion |
|---|---|---|
| `README.md` | New · Contacted | "RM sends first wealth message, or books a meeting" |
| `Wealth Onboarding P0.html` (`const ST`) | New · Contacted · **Interested** | `exit:'Interested'` → "Interest shown by client" |

**Followed the prototype**, on the grounds that it is the signed-off clickable artifact
and the handoff states interactions are final. Both paths out of stage 1 still work:
setting status to `Interested` advances to Intent, and `Send a message` / `Schedule a
meeting` advance as the README describes. If the README is authoritative instead,
`Interested` needs removing from `STAGES[1].statuses` in `src/domain/funnel.ts`.

## 3. Row tint rules are inferred

The handoff defines the tints ("red = RM action needed, amber = waiting") but not which
status maps to which. The mapping in `rowTint()` is a reading of intent, not a spec:

- **red** — New, Contacted, Schedule meeting, No-show, or ≥ 5 days in stage
- **amber** — Awaiting docs, Scheduled, Rescheduled, MoM pending
- **none** — closed

Worth a review pass.

## 4. Transacting recompute is not implemented

The handoff has stage 5 recomputed by the system on a rolling 30-day window. There is no
backend here, so `tx_status` is seeded and only changes via an explicit dispatch. Whether
`With others` should surface as Transacting is an open PRD question — currently it does
not.

## 5. Admin metrics are client-side

The handoff wants admin funnel metrics computed server-side by cohort. The admin
dashboard is not built yet; when it is, it will compute from in-memory state until a real
API exists.

## 6. Stubs

`Chat` and `Schedule` raise a toast rather than opening UI — both are explicitly
placeholder in the handoff, pending final designs from the product owner.
