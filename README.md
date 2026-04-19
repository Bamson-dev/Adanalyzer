# AdAnalyzer

Free ad copy analyzer for Nigerian businesses running Facebook/Instagram ads.

Supports both static ads and video script analysis.

## Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Cloudflare Worker (manual dashboard upload)
- Storage: Cloudflare KV (`ANALYTICS`)
- AI: DeepSeek API
- Hosting: Cloudflare Pages (GitHub auto-deploy)
- Domain: `adanalyzer.pdigitalhq.com`

## Features

- Mobile-first UI (large touch targets, single-column flow)
- Demo-first conversion flow
- Nigerian-focused copy review framework
- Creative-aware feedback (image + video script)
- Daily free usage counter on client
- Admin analytics dashboard

## Project Structure

```text
adanalyzer/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── style.css
│   ├── admin.css
│   ├── script.js
│   └── admin.js
├── worker.js
├── .gitignore
└── README.md
```

## Cloudflare Deployment (No Wrangler)

1. Create KV namespace `ANALYTICS` in Cloudflare Dashboard.
2. Create Worker, paste `worker.js`, deploy.
3. Add KV binding:
   - Variable name: `ANALYTICS`
4. Add Worker secrets:
   - `DEEPSEEK_API_KEY`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ALLOWED_ORIGIN=https://adanalyzer.pdigitalhq.com`
5. Push the `public/` files to GitHub repo root.
6. In Cloudflare Pages, connect repo:
   - Build command: _(empty)_
   - Build output directory: `/`
7. Add custom domain `adanalyzer.pdigitalhq.com`.

## Endpoints

- `POST /api/analyze` – Analyze ad copy (+ optional creative/video script)
- `POST /api/track` – Event tracking
- `POST /api/admin-login` – Admin login
- `GET /api/admin-stats` – Admin dashboard metrics
