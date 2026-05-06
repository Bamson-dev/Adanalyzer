# AdAnalyzer

AdAnalyzer helps business owners check if an ad will perform before spending money on traffic.

It is built for the Nigerian market and gives direct, practical feedback on Facebook/Instagram ad copy, creative direction, CPM risk signals, engagement potential, and policy issues.

## Live App

[https://adanalyzer.pdigitalhq.com/](https://adanalyzer.pdigitalhq.com/)

## What It Does

- Analyzes ad copy in about 1-2 minutes
- Flags CPM killers before you launch
- Scores Nigerian market fit and buyer psychology alignment
- Checks likely policy risks and unsafe phrasing
- Gives rewrite suggestions with clear before/after improvements
- Supports optional creative/video context for richer feedback

## Project Structure

- `index.html`, `style.css`, `script.js` - public web app
- `worker.js` - Cloudflare Worker API for analysis, tracking, and admin endpoints
- `admin.html`, `admin.css`, `admin.js` - admin analytics dashboard

## API Endpoints (Cloudflare Worker)

- `POST /api/analyze` - run ad analysis
- `POST /api/track` - track product events
- `POST /api/admin-login` - admin authentication
- `GET /api/admin-stats` - admin metrics

## Deployment Notes

### Frontend

Host static files (`index.html`, CSS, JS) on your preferred static host.

### Worker

Deploy `worker.js` to Cloudflare Workers and configure:

- `DEEPSEEK_API_KEY`
- `ALLOWED_ORIGIN` (e.g. `https://adanalyzer.pdigitalhq.com`)
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ANALYTICS` (KV binding, if analytics is enabled)

## Ownership

AdAnalyzer is solely provided and created by **Bamidele Matthew**.
