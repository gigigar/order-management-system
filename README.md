# Order Management System

[![CI](https://github.com/gigigar/order-management-system/actions/workflows/ci.yml/badge.svg)](https://github.com/gigigar/order-management-system/actions/workflows/ci.yml)

**Status: building v1.** The internal tracker goes live with the owners on Sat Nov 7, 2026.

An order management system for a small business that makes custom college rings, pins and dog tags. Sales Agents in different areas each track orders and payments in their own paper notebook. This replaces the notebooks with one shared record of Batches and Orders that shows what's overdue or due soon and **what each Agent still owes the main office**, without anyone having to notice money is missing. A public page will let customers check their order's status.

## What's built

- **Sign-in and roles:** Google sign-in, an admin-managed invite list, and role checks on the server
- **Reference data:** Areas, Schools, Agents, Designs and Stones
- **Batches and Individual orders**, with rings, pins, dog tags and other items on each Order
- **Batch entry table:** a whole class's orders saved in one database transaction, with stale-row detection and order-code retry
- **Payments** on Batches and Individual orders
- **Dashboard:** a business overview (rings by stage, money collected, balances owed) plus overdue and due-soon lists

## Milestones

| Date       | Milestone      | Scope                                                                                                       |
| ---------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| Sep 28–29  | ✅ Foundations | CI on every PR, protected `main`, [design doc](docs/design.md)                                              |
| Oct 1–9    | ✅ Core        | Sign-in and roles, reference data, Batches and Orders, batch entry table, Payments, Dashboard               |
| Sat Nov 7  | Tracker live   | Production stages, hosting and domain, first real orders entered by the owners                              |
| Sat Nov 21 | Money          | Commission rules, Commission earned on delivery, Remittances confirmed by the Owners, amount owed per Agent |
| Sat Dec 12 | Public site    | Homepage, sample gallery, rate-limited public status lookup, Playwright end-to-end tests                    |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS + shadcn/ui · PostgreSQL (Neon) · Drizzle ORM · Better Auth (Google sign-in) · Zod · Vitest · GitHub Actions

## Testing and CI

- **75 Vitest unit tests** on the domain logic: order codes, items, money, payments, Agent credits, validation and the Dashboard's due dates
- **Every PR runs:** lint, format check, typecheck, tests, all migrations against a real PostgreSQL service, and a production build. `main` only accepts PRs with green CI, squash-merged

## Design highlights

- **One Next.js app, no separate API.** Server Components read data and forms call Server Actions. The only public endpoint is the status lookup.
- **Money is stored as integer centavos**, never floats.
- **Amount owed is computed by query, never stored**, so it can't drift from the Payments, Commissions and Remittances behind it.

## Docs

- [`CONTEXT.md`](CONTEXT.md): the domain glossary (Order, Batch, Stage, Status…)
- [`docs/design.md`](docs/design.md): requirements, architecture and data model
- [`docs/adr/`](docs/adr/): architecture decisions

## Run it locally

Requires Node 24 (`nvm use`), pnpm and Docker.

```sh
pnpm install
cp .env.example .env    # fill in the values
docker compose up -d    # local PostgreSQL
pnpm db:migrate
pnpm dev
```

## Data

This repo only ever contains made-up sample data. Real customers, prices and suppliers live only in the production database.

Source shared for portfolio review.
