# RoboTactic Frontend

Simple React + Vite frontend structure for the RoboTactic event website.

## Pages

- Home
- About
- Competitions
- Workshops
- Project Showcase (`/projects`)
- Team
- Timeline

## Structure

- `src/components/` — reusable UI components
- `src/pages/` — website pages
- `src/data/` — editable event content
- `src/styles/` — global styles and design tokens
- `public/` — static assets such as logos, images, icons and fonts

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Registration and submissions are handled externally through Google Forms. No login, accounts, dashboard, attendance, certificates, or internal upload system are included in this scaffold.

> Note: `/projects` is the Project Showcase page.
