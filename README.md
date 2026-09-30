# Order Management System

**Status: building.** Next milestone: the internal tracker, Sat Oct 17, 2026.

An order management system for a small business that makes custom college rings, pins and dog tags. Sales Agents in different areas each track orders and payments in their own paper notebook. This replaces the notebooks with one shared record of Batches and Orders that shows what's overdue or due soon and **what each Agent still owes the main office**, without anyone having to notice money is missing. A public page will let customers check their order's status.

## Milestones

| Date       | Milestone      | Scope                                                                                                                     |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Sep 28–29  | ✅ Foundations | CI on every PR, protected `main`, [design doc](docs/design.md)                                                            |
| Sat Oct 17 | Tracker        | Google sign-in with roles, Batches and Orders, Payments, production stages, overdue / due-soon dashboard, works on phones |
| Sat Oct 31 | Money          | Commission rules, Commission earned on delivery, Remittances confirmed by the Owners, amount owed per Agent               |
| Sat Nov 14 | Public site    | Homepage, sample gallery, rate-limited public status lookup                                                               |

## Stack

**In use now:** Next.js (App Router) · React · TypeScript · Tailwind CSS · ESLint + Prettier · GitHub Actions (lint, format check, typecheck and build on every PR; `main` only accepts PRs with green CI)

**Planned for v1:** PostgreSQL (Neon) · Drizzle · Better Auth (Google sign-in) · Zod · Vitest · Playwright · Vercel

## Design highlights

- **One Next.js app, no separate API.** Server Components read data and forms call Server Actions. The only public endpoint is the status lookup.
- **Money is stored as integer centavos**, never floats.
- **Amount owed is computed by query, never stored**, so it can't drift from the Payments, Commissions and Remittances behind it.

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

Source shared for portfolio review.
