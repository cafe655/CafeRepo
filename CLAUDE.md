@AGENTS.md

# cafe655.com — Project Guide

## What This Is

cafe655.com is a personal master website owned by David (goes by "Cafe"). It's a dark-themed hub that contains modular sub-sites for different aspects of his life. The site is live at https://cafe655.com.

## Owner

- **Name:** David / Cafe / Cafe655
- **Skill level:** Not a developer. Building everything with AI assistance. Walk through unfamiliar processes one step at a time — don't give multiple steps at once.
- **Design preference:** Dark mode forward — black, gray, white with HyperX Red (#E31837) accents.

## Tech Stack

| Layer | Tool | Account |
|-------|------|---------|
| Framework | Next.js 16 (App Router, TypeScript) | — |
| Styling | Tailwind CSS v4 | — |
| Database | Supabase (not yet configured with real credentials) | — |
| Hosting | Vercel (Hobby/free tier) | cafe655 |
| Domain | Cloudflare Registrar ($10.46/year) | baristabuildingcompany@gmail.com |
| Code repo | GitHub | cafe655 |

## How Everything Connects

```
You edit files here (local)
    ↓ git push
GitHub (github.com/cafe655/CafeRepo, branch: main)
    ↓ auto-deploy (within ~30 seconds)
Vercel (project: cafe-repo, team: cafe655s-projects)
    ↑ DNS points here
Cloudflare DNS (cafe655.com → A record 76.76.21.21)
                (www.cafe655.com → CNAME cname.vercel-dns.com)
```

**Deploy flow:** Edit code → `git add` → `git commit` → `git push` → Vercel auto-deploys → live at cafe655.com

## Project Structure

```
cafe655/
├── public/
│   ├── llms.txt                    # AI agent discoverability
│   └── ai-field-notes.html         # Static HTML: Claude Code Reference Guide
│
├── src/app/
│   ├── layout.tsx                  # Root shell: dark theme, navbar, footer, JSON-LD
│   ├── page.tsx                    # Landing page: hero + sub-site card grid
│   ├── globals.css                 # Tailwind v4 theme (HyperX Red #E31837)
│   ├── not-found.tsx               # 404 page
│   ├── loading.tsx                 # Loading spinner
│   ├── sitemap.ts                  # Auto-generated sitemap
│   ├── robots.ts                   # Crawler rules (Google + AI bots)
│   │
│   ├── (sites)/                    # Route group — sub-sites live here
│   │   ├── _template/              # Copy this to create a new sub-site
│   │   ├── hub/                    # The Hub — links to all sub-sites
│   │   ├── ai-field-notes/         # AI Field Notes landing (pill links)
│   │   │   └── claude-code-reference/  # Redirects to static HTML
│   │   ├── barista-painting/       # Coming Soon placeholder
│   │   └── personal/              # Coming Soon placeholder
│   │
│   └── api/health/                # Health check endpoint
│
├── src/components/
│   ├── layout/                    # Navbar, Footer
│   ├── seo/                       # JsonLd component
│   └── ui/                        # Container, SiteCard
│
├── src/lib/
│   ├── site-config.ts             # Central sub-site registry (drives navbar + landing)
│   ├── structured-data.ts         # JSON-LD schema helpers
│   ├── utils.ts                   # cn() utility (clsx + tailwind-merge)
│   └── supabase/                  # Server + browser clients (needs real credentials)
│
├── middleware.ts                   # Subdomain routing (e.g., hub.cafe655.com → /hub)
├── next.config.ts
└── .env.local                     # Supabase keys (not in git)
```

## How to Add a New Sub-Site

1. Copy `src/app/(sites)/_template/` to a new folder (e.g., `src/app/(sites)/projects/`)
2. Edit the page.tsx and layout.tsx inside it
3. Optionally add an entry to `src/lib/site-config.ts` to show it in the navbar and landing page
4. Commit and push — it auto-deploys

## How to Add a New Page Inside a Sub-Site

Example: adding a new pill link inside AI Field Notes:

1. Create a folder: `src/app/(sites)/ai-field-notes/new-page/page.tsx`
2. If it's a static HTML file, put it in `public/` and redirect to it
3. Add the link to the `fieldNotes` array in `src/app/(sites)/ai-field-notes/page.tsx`
4. Commit and push

## Required: Site Nav Bar on Every Static HTML Page

**Every static HTML file in `public/` MUST include the shared site nav bar at the top of `<body>`.** This is non-negotiable — the navbar provides consistent navigation back to the rest of the site and keeps the user inside the Cafe655 experience instead of stranded on a standalone page.

Reference implementations (copy from any of these):
- `public/claude-in-streamdeck.html`
- `public/claude-code-reference-guide.html`
- `public/cafe655-rag.html`
- `public/one-ounce-pour.html`

### What to copy

**1. The `.site-nav` CSS block** — add these rules inside the page's `<style>` (right after the `body` rules):

```css
.site-nav {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center;
  gap: 6px; padding: 10px 16px;
  border-bottom: 1px solid #2a2a2a; flex-wrap: wrap;
}
.site-nav .site-brand {
  font-size: 1.25em; font-weight: 700; color: #f5f5f7;
  text-decoration: none; margin-right: 18px; letter-spacing: -0.02em;
}
.site-nav .site-brand span { color: #E31837; }
.site-nav a.site-link {
  color: #9e9eb8; text-decoration: none; font-size: 0.85em;
  padding: 5px 12px; border-radius: 6px; transition: all 0.2s;
}
.site-nav a.site-link:hover { color: #f5f5f7; background: rgba(227, 24, 55, 0.12); }
.site-nav a.site-link.current { color: #E31837; background: rgba(227, 24, 55, 0.1); }
```

**2. The navbar HTML** — as the first child of `<body>`:

```html
<div class="site-nav">
  <a href="https://www.cafe655.com" class="site-brand">Cafe<span>655</span></a>
  <a href="https://www.cafe655.com/ai-field-notes" class="site-link">Ai Field Notes</a>
  <a href="https://www.cafe655.com/barista-painting" class="site-link">Barista Painting Services</a>
  <a href="https://www.cafe655.com/cafe655-on-twitch" class="site-link">Cafe655 on Twitch</a>
  <a href="https://www.cafe655.com/personal" class="site-link">Cafe655 Personal</a>
</div>
```

**3. Add `class="site-link current"`** to the link matching the section this page belongs to (e.g., an AI Field Notes page marks the "Ai Field Notes" link as `current`).

### Rule

Before committing a new or updated static HTML file in `public/`, verify the site nav bar is present. If Cafe hands you a raw HTML file to publish, add the navbar before pushing. Do not ship a public HTML page without it.

## Current Site Map

| URL | What's There |
|-----|-------------|
| cafe655.com | Landing page — hero + sub-site card grid |
| cafe655.com/hub | The Hub — pill links to AI Field Notes, Barista Painting, Personal |
| cafe655.com/ai-field-notes | AI Field Notes landing — pill links to reference guides |
| cafe655.com/ai-field-notes/claude-code-reference | Redirects to Claude Code Reference Guide HTML |
| cafe655.com/barista-painting | Coming Soon placeholder |
| cafe655.com/personal | Coming Soon placeholder |

## Key Files to Know

- **`src/lib/site-config.ts`** — Central registry. Controls what shows in navbar and landing page grid.
- **`src/app/(sites)/hub/page.tsx`** — Hub page with pill links to sub-sites.
- **`src/app/(sites)/ai-field-notes/page.tsx`** — AI Field Notes landing with pill links.
- **`src/app/globals.css`** — Theme colors. HyperX Red is `--color-accent: #E31837`.
- **`src/app/layout.tsx`** — Root layout. Navbar + footer wrap everything.

## Git Config

- **User:** cafe655
- **Email:** baristabuildingcompany@gmail.com
- **Remote:** https://github.com/cafe655/CafeRepo.git
- **Branch:** main

## Commands

```bash
npm run dev          # Start local dev server at localhost:3000
npm run build        # Build (verify before pushing)
git add <files>      # Stage changes
git commit -m "msg"  # Commit
git push             # Push to GitHub → auto-deploys to Vercel
```

## Things Not Yet Done

- [ ] Supabase credentials not configured (`.env.local` has placeholders)
- [ ] No auth system yet
- [ ] Barista Painting Services and Personal sub-sites are placeholders
- [ ] No custom favicon or OG image yet
- [ ] Wildcard subdomain (*.cafe655.com) not configured on Vercel yet

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
