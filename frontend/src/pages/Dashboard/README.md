# Dashboard frontend

Open `/dashboard` after starting the frontend with `npm run dev`.

## Routes

- `/dashboard`: overview with sample metrics.
- `/dashboard/competitions`: competition cards, search, status and category filters.
- `/dashboard/workshops`: workshop cards, search, status and date filters.
- `/dashboard/projects`: project showroom management.
- `/dashboard/announcements`: content previews and management.
- `/dashboard/permissions`: role and password form UI.
- `/dashboard/teams`: registered teams; `?parent=<competition-id>` filters a competition.
- `/dashboard/participants`: workshop participants; `?parent=<workshop-id>` filters a workshop.
- Each section supports `/new`, `/:id`, and `/:id/edit`.

## Integration boundary

All records in `src/data/dashboard.js` are fictional preview data. Overview totals are calculated from these records, not live backend data. Search, filtering, navigation, form validation and password visibility work locally. Save, delete, disable and sign-out show an integration-pending notice and do not claim success. There are no API requests, participant storage, uploads, tokens or authentication changes. Password fields are cleared after a valid preview submission and are not persisted or logged.

The event administrator must add authenticated routing, server-side role authorization, API loading/mutations, actual uploads and sign-out as part of the auth/backend integration. The preview role is a label only and grants no access. The public site remains unchanged.

## Typography and design

Figma page 06 uses `thmanyah sans`; this implementation deliberately follows the existing public pages' `Thmanyah Serif Text` Arabic font and `IBM Plex Sans` English font, as requested. It uses the existing font import and shared design tokens. The Arabic font package loads its files from jsDelivr, as on the coworkers' pages.

The structure adapts from one mobile column to desktop cards and a 272px sidebar. The mobile menu supports keyboard input, and the Dashboard language button switches its own content between Arabic RTL and English LTR. The shared public Navbar/Footer remain in their current language.

Figma asset downloads were blocked by the execution network. The existing Navbar and Footer are reused; exact Figma logo, circuit decoration and icon assets remain a visual follow-up. Do not treat this initial structure as a pixel-perfect implementation.

## Regression checks

Run `node --test src/data/dashboard.test.js` from `frontend`, followed by `npm run build`.

The review also exercised lists and forms in a real browser at 320, 375, 390 and 1440px, Arabic/English switching, filtered detail/edit navigation, password validation and clearing, keyboard menu closing, invalid routes, and navigation back to the public competition/workshop/project pages. No new runtime dependency was added.
