# Prosperr CMS — Book a call

Call booking for the Prosperr CMS: users list, user record, and the
appointment flow (create → review the email → confirm), with availability
read from the advisors' calendars.

This is the design prototype, unpacked into a source tree so it can be worked
on. It is a faithful copy — the application code is byte-for-byte what the
design published, not a reimplementation.

## Running it

No build step. Any static server will do:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. JSX is compiled in the browser by Babel
standalone, which is why `vendor/` is checked in — the page runs offline with
no install.

## Layout

```
index.html                        load order lives here
styles/
  fonts.css                       IBM Plex Mono faces
  design-system.css               tokens + .pc-* components
  app.css                         screen layout for this product
src/
  data.js                         sample data + shared helpers (window.BK)
  ds/prosperr-ds.js               design-system bundle (ProsperrAdvisorConsoleDS)
  lib/tweaks-panel.jsx            design-time panel — see note below
  screens/users.jsx               users list + user record
  components/time-picker.jsx      typeable 15-minute time field
  screens/book-a-call.jsx         the booking screen
  screens/email-draft.jsx         email review, shown before the invite goes out
  screens/confirmation.jsx        confirmation, reschedule, cancel
  app.jsx                         shell, routing, toasts
  mount.jsx                       entry point
assets/fonts/                     woff2 the stylesheets reference
vendor/                           React 18, ReactDOM, Babel standalone 7.29
```

Scripts must load in the order `index.html` lists them: the libraries, then
`data.js` and the design system (both plain scripts that populate globals),
then the JSX screens, then `mount.jsx`.

## Notes for whoever picks this up

**`lib/tweaks-panel.jsx` is not product code.** It is the design tool's
edit-mode panel, and `app.jsx` reads `TWEAK_DEFAULTS` from it to drive demo
switches (`googleDown`, `simulateConflict`, and so on). Useful while
demonstrating; delete both when the screens talk to a real API.

**The data is in-memory.** `src/data.js` pins today to 2026-09-23 and holds
every client, advisor and appointment. Nothing persists across a refresh.

**Three changes were made while unpacking, and nothing else:**

1. The published artifact inlined stylesheets, scripts and fonts as one HTML
   file. They are split into real files here; `index.html` keeps the original
   order.
2. Font URLs inside the stylesheets were repointed to `../assets/fonts/`, since
   the sheets now live one directory down.
3. The artifact host's branding chip was removed. It belonged to the preview,
   not the product.
