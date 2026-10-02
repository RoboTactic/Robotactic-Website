# RoboTactic design reference

The official UI and design-system source of truth is the [RoboTactic Figma file](https://www.figma.com/design/BwSFuMasbKkiGLZT0x9Fov/Robotactic).

- `01 · Foundations` (`0:1`): colors, typography, spacing, radii, and icons.
- `02 · Components` (`19:2`): shared component definitions and states.
- Home: `03 · Home`; mobile `30:2`, desktop `34:266`.
- Competitions: `04 · Competitions`; mobile `33:2`, desktop `36:717`.
- Workshops: use `07 · Workshops - Shimaa`; mobile NEW `190:470`, desktop NEW `190:440`, plus day-state frames on that page. Do not use the older Workshops page.
- Showroom: `08 · Showroom`; All mobile `190:2118`, All desktop `190:2093`, with filter and search states on that page.

Existing code tokens live in `frontend/src/styles/variables.css` and mirror the Figma variables. Preserve Arabic RTL layout, prefer logical CSS properties, and follow the dedicated 375px mobile and 1440px desktop frames rather than scaling one layout mechanically.

IBM Plex Sans is provided through the official `@ibm/plex-sans` package dependency rather than page-local font binaries. Official Thmanyah font files, the logo, and most Figma icons/patterns are not currently present in the repository. Export assets from Figma or obtain fonts from authoritative sources; do not approximate official assets.
