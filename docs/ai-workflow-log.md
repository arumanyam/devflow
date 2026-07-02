# AI Workflow Log

This log documents how Claude Code was used to build features in this project —
prompts given, diffs produced, review decisions made, and what was changed
before merge. Kept as a running record for process transparency.

---

## Entry format

Each entry follows this structure:

- **Feature / Issue:** link to the GitHub issue this addresses
- **Date:**
- **Prompt(s) given to Claude Code:** the actual prompt(s), verbatim
- **Diff produced:** link to the PR / commit
- **Review notes:** what I checked, what I changed or rejected, why
- **Outcome:** merged as-is / merged with edits / rejected and redone

---

## Entry 1

- **Feature / Issue:** #3 — Set up Prisma schema for Issue/PullRequest/Dependency models
- **Date:** 2026-07-03
- **Prompt(s) given to Claude Code:**
  > "Add a Prisma schema for a NestJS + SQLite project with Issue, PullRequest,
  > Dependency, and SyncLog models. Issue needs a self-referencing many-to-many
  > for 'depends on' relationships. Use DateTime defaults and @updatedAt where
  > appropriate."
- **Diff produced:** [PR #4](link)
- **Review notes:**
  - Claude's first pass used a plain many-to-many `@relation` for dependencies,
    which SQLite doesn't support directly in the way Postgres does — had to
    correct it to an explicit join model (`Dependency`) with two named relations.
  - Verified field types matched what `SyncService` and `WebhookController`
    would actually write (e.g. `labels` as a comma-joined string, since SQLite
    has no native array type).
  - Ran `prisma migrate dev` locally to confirm the migration applied cleanly
    before committing the generated SQL.
- **Outcome:** Merged with edits (join table correction, field type fixes).

---

## Entry 2

- **Feature / Issue:** #7 — PR summarizer via Claude API in AgentService
- **Date:** 2026-07-05
- **Prompt(s) given to Claude Code:**
  > "Write an AgentService for NestJS that calls the Anthropic API to summarize
  > a PR diff and return a structured risk flag (low/medium/high). Must handle
  > API failures gracefully and never throw — return a safe fallback instead."
- **Diff produced:** [PR #8](link)
- **Review notes:**
  - Initial version didn't truncate large diffs before sending to the API —
    added a length cap to avoid hitting token limits on big PRs.
  - Confirmed the JSON-only system prompt actually produces parseable JSON
    across a handful of manual test diffs; added a `.replace()` guard to strip
    stray markdown fences since the model occasionally wrapped output in
    \`\`\`json blocks despite instructions.
  - Added the try/catch fallback path myself after noticing the original
    version would let an API timeout bubble up and crash the webhook handler.
- **Outcome:** Merged with edits (truncation, fence-stripping, error fallback).

---

## Entry 3

- **Feature / Issue:** #11 — GitHub webhook signature verification
- **Date:** 2026-07-08
- **Prompt(s) given to Claude Code:**
  > "Add HMAC SHA-256 signature verification for incoming GitHub webhooks in
  > a NestJS controller, comparing against x-hub-signature-256 header."
- **Diff produced:** [PR #12](link)
- **Review notes:**
  - Claude's first draft compared signatures with plain string equality —
    flagged this as a timing-attack risk and asked for `crypto.timingSafeEqual`
    instead, which requires equal-length buffers (added a length check first
    to avoid a runtime error on mismatched lengths).
  - Confirmed Nest's default body parser strips the raw body needed for HMAC
    verification — required a `main.ts` change to capture `req.rawBody`,
    which the original diff didn't include and had to be added separately.
- **Outcome:** Merged with edits (timing-safe comparison, raw body capture).

---

## Entry 4

- **Feature / Issue:** [next feature]
- **Date:**
- **Prompt(s) given to Claude Code:**
  >
- **Diff produced:** [link]
- **Review notes:**
  -
- **Outcome:**

---

## Retrospective notes (update periodically)

- What's working well in the AI-assisted workflow so far:
- Where Claude Code needed the most correction / oversight:
- Any prompt patterns that consistently produced better first drafts:
