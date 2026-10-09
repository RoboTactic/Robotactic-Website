# Dashboard frontend

Open `/dashboard` after starting the frontend with `npm run dev`. The current dashboard uses the admin API and requires an approved team account. Configure the frontend/backend as described in their existing setup documentation; authentication and database setup remain owned by the event administrator.

Sign-in uses a dropdown of active team account login names and a password. A Super Admin can create and edit accounts under Users and permissions, assign one or more dashboard sections, and disable accounts. Email is optional. The server checks permissions on every request.

## Admin UI fixes

- A compact dashboard header contains the official shared Logo and the language switch. The desktop sidebar starts directly beneath it, without an extra language toolbar row.
- Arabic headings retain the public `--font-arabic` stack. Controls and navigation use its existing IBM Plex Sans Arabic UI fallback for legibility; English uses IBM Plex Sans, including its local regular face. The switch uses the font and direction of its destination language.
- Navigation reuses shared Icon components for sections allowed for the signed-in account. Users and logout icons extend the shared 24px line-icon system. Mobile navigation closes on Escape and returns focus to its trigger.
- Date/time fields use a branded in-page Gregorian calendar, with hour/minute controls, clear/today/done actions, keyboard arrows/Home/End/PageUp/PageDown, Escape dismissal and focus return. Manual entry is validated, including leap dates. The submitted local datetime format is unchanged, preserving existing API conversion. The calendar stays inside the viewport on phones and desktops, so it does not depend on the browser's white native popup.
- File chooser buttons use green surface/border tokens. Competition, workshop, project, and announcement forms accept either an image URL or a JPEG/PNG/WebP upload. A selected file replaces the URL when the form is saved.
- Management lists show one column on phones, two from 700px, and three from 1280px. Details use adjacent overview/detail panels from 1280px, stacked below that. Every previously visible field appears once across the panels; long descriptions and arrays use a full-width row inside their panel so labels stay readable.
- The dashboard home cards display total record counts from the permission-filtered admin statistics API; they show loading and retry states instead of inventing counts when the request fails.

## Speaker management

Workshop managers and super admins see a Speakers section. Create a speaker with name, phone, optional private notes, a workshop selected by title, and a public-name checkbox that starts unchecked. A speaker's detail page can assign more workshops and change visibility independently for each workshop. The backend enforces the role checks. Public workshop responses include only names marked public, never phone numbers or notes.

The dashboard keeps its existing session checks and does not add sample credentials. The backend enforces permissions for every admin operation.

The dashboard keeps its own compact header and shares the latest Refined Dark surface tokens with public pages. Public Navbar, Footer and motion updates are preserved.

## Verification

Run `npm run build` from `frontend`. The older `src/data/dashboard.test.js` checks remain available but cover the original preview-data helpers, not the current API integration.

The UI was checked in a real browser across 320, 375, 390 and 1440px and Arabic/English, using intercepted fictional API responses. Checks cover navigation icons, header/sidebar positioning, overflow, keyboard menu dismissal/focus return, language switching without losing new-form values, restricted-role navigation, and the signed-out screen. This is UI verification, not an end-to-end test of the live database, passwords or sessions. No runtime dependency was added.

The compact card/detail layout was additionally checked in 80 displays across 320, 375, 390, 1024 and 1440px, both languages, and competition/workshop/announcement/user listings and details. These checks use long fictional labels, descriptions and URLs and verify column counts, field preservation, and the existing detail/edit links.

Calendar checks cover both languages at these five widths: green panel surfaces, viewport bounds, 44px day targets, valid/invalid leap dates, keyboard date navigation, hour/minute selection, local datetime form payload, language preservation, Escape/focus return and required-field clearing. Computed Arabic font families match the public Navbar and the local English regular face loads successfully.

## About and Team management

Super Admin has new About and event-team sections. About edits update both `/about` and the Home About section. Team profiles populate `/team` after publication and remain separate from sign-in accounts and competition teams. Forms reuse the current image uploader. Apply migration 005 before using these sections. See [setup and verification](../../../../docs/about-team-management.md).

## Dashboard layout polish

Editors and their headings share a centered 960px maximum width; lists use a centered 1280px maximum. About fields are grouped by purpose, with Arabic/English introductions, body text and values paired on desktop and stacked on phones. Introductions now allow multiple lines. Labels connect to their controls and each text field declares its content language and direction.

All management lists share a framed search toolbar with an icon, placeholder, result count and a clear button that returns focus to the input. Empty sections and unmatched searches have distinct messages. Desktop navigation uses 16px text, a proportionally larger official logo, and a separate account card and full-width logout button; long menus scroll while account actions stay visible.

Polish verification: 270 browser displays across 320, 375, 390, 1024, 1440 and 2048px in Arabic/English with fictional intercepted API data. Checks cover all eight lists, search/clear/empty states, editor field grouping, About save payload, desktop card/detail columns, mobile menu keyboard dismissal and horizontal overflow. Production build passes. These checks do not connect to the shared event database.

## Dashboard data cache

Administrative GET responses now share a memory cache scoped to the verified account, role and section permissions. Fresh results are reused for 60 seconds, concurrent reads share one request, and the cache holds at most 100 entries. Lists, statistics, detail views and lookups display their cached data immediately and revalidate expired data on navigation, window focus, or a visible-page timer. Failed background requests keep the last successful display with an error; unauthorized, forbidden and missing responses remove cached data. Nothing is written to localStorage or sessionStorage.

Editors use one initial snapshot and do not refresh their record while the form is open. Switching language preserves edits. About's Discard edits action explicitly fetches the server copy and resets the form. Successful writes install the server's saved record and invalidate related lists, lookups and statistics; failed writes leave the cache unchanged. Logout, dashboard unmount, account/permission changes and session expiry clear the cache. Responses from superseded sessions or pre-save reads cannot repopulate it. Server authentication and authorization remain enforced on every network operation.

Run `node --test src/services/api/dashboardCache.test.js src/data/dashboard.test.js` from `frontend`. Cache verification covers freshness, forced refresh, request deduplication, failures, account/permission isolation, expiry notifications, write/delete invalidation, related queries, late responses and memory bounds. Browser verification used fictional intercepted API responses at 320, 375, 390 and 1440px in Arabic and English. It checked repeated navigation without additional reads, mobile overflow and keyboard navigation, unsaved forms, failed/successful saves, discard, TTL/focus refresh, outage recovery, record deletion, logout/account-switch races, and 401/403 handling, including a 401 arriving after leaving its view. These checks do not use the shared event database or real sign-in credentials.
