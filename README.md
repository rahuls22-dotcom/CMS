# CMS-Chat — Prosperr Advisor Chat Console

Redesign of the advisor + admin chat workflow. Two self-contained HTML files: a clickable prototype and the product spec.

| File | What it is |
|---|---|
| [`index.html`](index.html) | Clickable prototype — advisor and admin views |
| [`spec.html`](spec.html) | Product spec — principles, definitions, 4 phases |

Open either in a browser. No build step, no dependencies.

---

## The problem

- **49%** of client chats got zero advisor reply, ever
- Open chats grew **47%** Jun→Jul while volume grew only **17%**
- SLA measures **first response only** — "ok, will check" passes it
- Chats are rarely closed, so we have no reliable closure signal

**Root cause:** advisors are rewarded for replying, never asked to finish.

---

## Core ideas

### Two clocks
| Clock | Target | Counts |
|---|---|---|
| First response | 12 hours | Business hours only — 09:00–20:00, Saturdays excluded |
| Resolution / close | 48 hours | Flat for every chat |

### Status is derived, never picked
| Status | Rule |
|---|---|
| **New chats** | Client sent the last message |
| **Action pending** | Advisor sent last **and** flagged, or sent a holding reply |
| **Open session** | Advisor sent last, nothing flagged — or a reopened chat |
| **Closed** | Disposition recorded |

### A reply is not a resolution
Sending a message never takes a chat off your plate. Only **Close** or **"Not on me"** does.
A holding reply ("ok, will check") is detected and pushed back into **Action pending**.

### Priority — three inputs only
```
score = (aging + 2 × recent action) × approaching SLA
```
- **Aging** — chat created → now
- **Recent action** — last action → now (double weight; an untouched chat is the real risk)
- **Approaching SLA** — 1× under 50% consumed, up to 4× beyond

Actions that reset the recent-action clock: response sent · task created · marked action pending · document requested · session closed.

**Bands:** At Risk ≥ 150 · Less Risky 60–149 · Later < 60

**Always At Risk**, whatever the score:
1. Not closed in time — past the 48h close target
2. No response sent — zero advisor reply past 12 business hours

An **agent** is flagged at risk if they hold even one at-risk chat.

### Reopening
A client message on a closed chat reopens it into **Open session** (not New — it's an existing session resuming). The prior disposition is kept as history.

### Ownership
Every chat has a primary owner; some carry a secondary advisor. Shown as **filter chips + a row tag** — not tabs, not a switch, so no chat is ever hidden behind a control you forgot to flip.

---

## Phases

| Phase | Focus |
|---|---|
| **1** | Advisor triage + respond. Admin gets 2 dashboard widgets, read-only. |
| **2** | Admin can act — nudge, reassign, escalate. Task-gated closure. |
| **3** | Tuning + closure quality — audit queue, threshold calibration. |
| **4** | Scale — routing, trends, capacity planning. |

---

## Trying the prototype

Open `index.html` and use the **Advisor / Admin** switch in the top bar.

**Advisor**
- Dashboard tiles and every row open the exact chats behind them
- Chat tabs: All · New · Open · Action, with Primary/Secondary chips
- Reply with `Requires my action` checked → stays in Action pending
- Reply `ok, will check` → flagged as a holding reply, stays on you
- Add a task → **Close is blocked** until it's done
- Open a closed chat → **Simulate client message** to see it reopen

**Admin**
- Open Chats widget, split into response pending vs waiting for closure
- Agents at risk, with the condition that fired
- Click through to the agent grid

---

## Open questions

- **Third at-risk condition** — two are defined; a third was mentioned but not named
- **Sundays** — the response clock excludes Saturdays and pauses 20:00–09:00; Sunday handling not yet stated

---

## Deploy

Static site — no build step.

**Vercel:** import the repo at [vercel.com/new](https://vercel.com/new). Framework preset **Other**, build command **empty**, output directory **root**. `vercel.json` just enables clean URLs (`/spec` instead of `/spec.html`).

Or from the CLI:
```bash
npx vercel --prod
```

Routes: `/` → prototype · `/spec` → spec.

---

*Status: Phase 1 spec + prototype. Not production code — the prototype is a design artefact with in-memory data.*
