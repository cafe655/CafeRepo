# cafe655.com

Personal master website and digital hub. Dark theme with HyperX Red (#E31837) accents.

**Live at:** https://cafe655.com

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (not yet configured)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Domain:** Cloudflare Registrar

## Architecture

The site is a container for modular sub-sites. Each sub-site is a folder under `src/app/(sites)/`. The Hub page links to all sub-sites. Adding a new sub-site is: create a folder, add content, push.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build (verify before pushing)
```

## Deployment

Push to `main` on GitHub → Vercel auto-deploys in ~30 seconds.

```bash
git add <files>
git commit -m "description of change"
git push
```

## AI Assistants

Read `CLAUDE.md` for full project context, structure, accounts, and how everything connects.
