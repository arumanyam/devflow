# DevFlow

An AI-orchestrated release/PR coordinator. Syncs GitHub issues and pull
requests into a local database, uses Claude to summarize PR diffs and flag
risk, and posts notifications to Slack — with a small dashboard to view it
all. Built with NestJS + Prisma + SQLite.

## Architecture

```
GitHub (Issues, PRs, Projects board)
   |  GitHub API (poll/sync)      |  Webhook (on PR/issue events)
   v                              v
NestJS App
   SyncModule   -> polls GitHub on a schedule, backfills on startup
   WebhookModule -> receives + verifies GitHub webhook events
   AgentModule  -> calls Claude API for PR summaries + risk flags
   NotifyModule -> posts summaries to Slack
   DashboardModule -> JSON API + simple server-rendered view
   all backed by PrismaService -> SQLite (dev.db)

GitHub Actions runs lint/build/test on every PR.
```

## Tech stack

- NestJS (TypeScript)
- SQLite (file-based) via Prisma ORM
- Anthropic API (`@anthropic-ai/sdk`) for PR summarization
- `@octokit/rest` for GitHub API access
- Slack Incoming Webhook for notifications
- GitHub Actions for CI
- Deploys to Railway or Render as a plain Node app

## Prerequisites

- Node.js 20+
- A GitHub repo to track, with a Personal Access Token (repo scope)
- A GitHub webhook secret (any random string)
- An Anthropic API key
- A Slack Incoming Webhook URL (optional — logs to console if omitted)

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Visit `http://localhost:3000` for the dashboard.

To receive GitHub webhooks locally:

```bash
npx ngrok http 3000
```

Then add `https://<your-ngrok-domain>/webhooks/github` as the webhook URL in
your repo's Settings → Webhooks, with content type `application/json` and
the same secret as `GITHUB_WEBHOOK_SECRET`.

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Run in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm run lint` | Lint + autofix |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run prisma:studio` | Open Prisma's DB browser UI |

## Deployment

Both Railway and Render support deploying Node apps directly from a GitHub
repo — they detect `package.json` and run
`npm install && npm run build && npm run start:prod` automatically. Set the
same environment variables from `.env.example` in their dashboard.


