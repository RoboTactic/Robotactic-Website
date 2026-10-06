# Dashboard frontend

Open `/dashboard` after starting the frontend with `npm run dev`. The current dashboard uses the admin API and requires an approved team account. Configure the frontend/backend as described in their existing setup documentation; authentication and database setup remain owned by the event administrator.

## Admin UI fixes

- A compact dashboard header contains the official shared Logo and the language switch. The desktop sidebar starts directly beneath it, without an extra language toolbar row.
- Arabic uses the same `--font-arabic` fallback stack as the public site; English uses IBM Plex Sans, including its local regular face. The switch uses the font and direction of its destination language.
- Navigation reuses shared Icon components for sections visible to the signed-in role. Users and logout icons extend the shared 24px line-icon system. Mobile navigation closes on Escape and returns focus to its trigger.
- Date/time fields use a branded in-page Gregorian calendar, with hour/minute controls, clear/today/done actions, keyboard arrows/Home/End/PageUp/PageDown, Escape dismissal and focus return. Manual entry is validated, including leap dates. The submitted local datetime format is unchanged, preserving existing API conversion. The calendar stays inside the viewport on phones and desktops, so it does not depend on the browser's white native popup.
- File chooser buttons use green surface/border tokens. The latest backend-connected forms accept image URLs instead of file uploads; this styling does not add an upload flow.
- Management lists show one column on phones, two from 700px, and three from 1280px. Details use adjacent overview/detail panels from 1280px, stacked below that. Every previously visible field appears once across the panels; long descriptions and arrays use a full-width row inside their panel so labels stay readable.

## Integration boundary

These fixes preserve the existing session checks, API requests, role-based navigation and create/update/delete flows introduced by the backend integration. No API endpoint, payload shape, backend authorization or database schema is changed. The UI role filter is not authorization: the backend remains responsible for every admin operation. No authentication bypass or sample credentials are added.

The public Navbar and Footer are unchanged. The dashboard keeps its own header, as in the latest integrated layout.

## Verification

Run `npm run build` from `frontend`. The older `src/data/dashboard.test.js` checks remain available but cover the original preview-data helpers, not the current API integration.

The UI was checked in a real browser across 320, 375, 390 and 1440px and Arabic/English, using intercepted fictional API responses. Checks cover navigation icons, header/sidebar positioning, overflow, keyboard menu dismissal/focus return, language switching without losing new-form values, restricted-role navigation, and the signed-out screen. This is UI verification, not an end-to-end test of the live database, passwords or sessions. No runtime dependency was added.

The compact card/detail layout was additionally checked in 80 displays across 320, 375, 390, 1024 and 1440px, both languages, and competition/workshop/announcement/user listings and details. These checks use long fictional labels, descriptions and URLs and verify column counts, field preservation, and the existing detail/edit links.

Calendar checks cover both languages at these five widths: green panel surfaces, viewport bounds, 44px day targets, valid/invalid leap dates, keyboard date navigation, hour/minute selection, local datetime form payload, language preservation, Escape/focus return and required-field clearing. Computed Arabic font families match the public Navbar and the local English regular face loads successfully.
