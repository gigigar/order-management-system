# Order Management System

**Status: building.** v1 target: Nov 1, 2026.

An order management system for a small business that makes custom college rings, pins and dog tags. It replaces the paper notebook where orders are tracked today: schools, orders, production stages, and a dashboard of what's overdue or due soon. A public page will let customers check their order's status.

## Stack

Next.js (App Router) · TypeScript · PostgreSQL (Neon) · Drizzle · Tailwind CSS · Better Auth · Vitest · Playwright · GitHub Actions · Vercel

## Docs

- [`CONTEXT.md`](CONTEXT.md): the domain glossary (Order, Batch, Stage, Status…)
- [`docs/design.md`](docs/design.md): requirements, architecture and data model
- [`docs/adr/`](docs/adr/): architecture decisions

## Run it locally

Requires Node 24 (`nvm use`) and pnpm.

```sh
pnpm install
pnpm dev
```

## Data

This repo only ever contains made-up sample data. Real customers, prices and suppliers live only in the production database.

## How it's built

Built with Claude Code as a pair programmer; I made every design decision and can walk through any file.

Source shared for portfolio review.
