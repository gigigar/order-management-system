# Design: Order Management System v1

_Sep 30, 2026. Based on a client discovery interview with the owners (kept private); terms follow [`CONTEXT.md`](../CONTEXT.md)._

## Goal

Replace the Agents' separate notebooks with one shared record of Batches and Orders that's faster than paper, shows what's overdue, and shows what each Agent still owes the Main office. Individual orders can arrive any time; School orders come in bulk around graduation season.

**Requirements** (from discovery)

1. One shared record of every Batch and Order, fast to enter from a Rep's paper list, on phones and laptops, in English.
2. Payments per Batch or Order, and what each Agent still owes the Main office, visible without anyone having to notice money is missing.
3. Which Batches and Orders are overdue or due soon, and where each is in production.
4. Simpler than the notebook; under 10 users, all with Google accounts.

**Out of scope for v1:** file attachments (agreements, mold photos), importing order lists from files, generating receipts, per-role visibility limits, supplier tracking, changing how Agents take Commission.

| Milestone                   | Scope                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sat Oct 17: tracker**     | Google sign-in (invite list), roles; Areas, Agents, Schools, Designs; Batches with Batch entry table; School and Individual orders; ring, dog tag, pin (Batch item) and Other items; prices saved per item; Payments (deposit, balance); Deal and Production stages with per-Order hold-back; overdue / due-soon dashboard; works on phones |
| **Sat Oct 31: money**       | Commission rules (admin), Commission earned on Delivered, Remittances with Owner confirmation, Amount owed per Agent with days since delivery                                                                                                                                                                                               |
| **Sat Nov 14: public site** | Homepage, sample gallery, public status lookup (rate-limited); `ARCHITECTURE.md`                                                                                                                                                                                                                                                            |

**Oct 10 checkpoint:** if Orders and Payments aren't working, cut in order: Other items → Designs (become a text field) → dog tag details.

## Architecture

```
Browser (phone / laptop)
   │  HTTPS
Next.js on Vercel ── Server Components (reads) · Server Actions (writes)
   │                 Better Auth (Google, invite list) · Zod validation
   │  Drizzle ORM
PostgreSQL on Neon ── branches: prod · demo · one per PR
```

- **One Next.js app, no separate API.** Pages read data in Server Components; forms call Server Actions. The only public HTTP endpoint is the status lookup (Nov 14). A separate REST API would add a layer with no second client to use it.
- **Local:** Postgres in Docker (`docker compose`); CI runs the same image for Playwright.
- **Environments:** local → PR preview (own Neon branch) → **demo** (fake data, "Sample Jewelry Co.", one-click demo login, nightly reset) → **prod**. The business name exists only as a prod environment variable (`BUSINESS_NAME`); code and demo never contain it.

## Data model

Money is stored as integer centavos. Every table has `created_at`/`updated_at`; Batches, Orders and Payments also record `created_by`/`updated_by`.

| Table                        | Key columns                                                                                                                                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`, `session`, `account` | Better Auth's tables, plus `role` (`admin` \| `member`)                                                                                                                                                                                                                       |
| `invite`                     | `email`: only invited emails can sign in                                                                                                                                                                                                                                      |
| `area`                       | `name`                                                                                                                                                                                                                                                                        |
| `agent`                      | `name`, `area_id`, `user_id` (nullable)                                                                                                                                                                                                                                       |
| `school`                     | `name`, `area_id`                                                                                                                                                                                                                                                             |
| `design`                     | `school_id`, `year` (nullable), `description`                                                                                                                                                                                                                                 |
| `batch`                      | `school_id`, `design_id`, `rep_name`, `rep_phone`, `due_date`, `deal_stage`, `production_stage`, `agreement_signed_on`, `cancelled_at`                                                                                                                                        |
| `order`                      | `code` (public lookup), `batch_id` (null = Individual order), `school_id`, `customer_name`, `customer_phone`, `address`, `due_date` (Individual only), `production_stage` (Individual: its own; School: null = follows the Batch, set = held back), `cancelled_at`            |
| `item`                       | `order_id` **or** `batch_id` (Batch item), `kind` (`ring` \| `dog_tag` \| `pin` \| `other`), `quantity`, `unit_price`, `base_price` (dog tags); ring: `ring_type`, `material`, `karat`, `size`, `stone`, `engraving`; dog tag: `birthday`, `blood_type`; other: `description` |
| `agent_credit`               | `batch_id` **or** `order_id`, `agent_id`, `share_percent`: at most 2 per Batch or Individual order; shares add up to 100                                                                                                                                                      |
| `payment`                    | `batch_id` **or** `order_id`, `kind` (`deposit` \| `balance`), `amount`, `method` (cash \| gcash \| bank \| check), `collected_by_agent_id`, `receipt_no`, `paid_on`                                                                                                          |
| `commission_rule` (Oct 31)   | `item_kind`, `material`, `type` (`percent` \| `flat` \| `markup`), `value`, `effective_from`                                                                                                                                                                                  |
| `commission` (Oct 31)        | `item_id`, `agent_id`, `amount`, `rule_snapshot`, `earned_on`                                                                                                                                                                                                                 |
| `remittance` (Oct 31)        | `agent_id`, `amount`, `method`, `reference`, `sent_on`, `confirmed_by`, `confirmed_on`                                                                                                                                                                                        |

- **"Exactly one parent" columns** (`order_id` or `batch_id`) are enforced with a `CHECK` constraint. Rules that span tables or rows (Payments and Agent credits for a School order go on its Batch; at most 2 Agent credits adding up to 100) are enforced in Server Actions, with unit tests.
- **A Batch can be saved half-filled during the deal;** once `agreement_signed`, a `CHECK` requires its Design, Rep and Due date.
- **Cancelling** sets `cancelled_at` and keeps the Stage reached; dashboard, Commission and Amount owed skip cancelled rows.
- **Stages are Postgres enums;** the Stage → Status mapping is one TypeScript function with unit tests. An Order's Stage is its own `production_stage` if set, otherwise its Batch's (or its own for Individual orders).
- **Order codes** are 6 random characters (no ambiguous letters). They're not the primary key, and they don't encode anything about the business.
- **The index I'll justify:** a partial index on `batch(due_date) WHERE production_stage <> 'delivered' AND cancelled_at IS NULL` (and the same on `order`), because the dashboard's overdue / due-soon query runs on every page load and only ever looks at undelivered work.
- **Amount owed** is computed by query (Payments collected − Commission on Delivered Orders − confirmed Remittances), never stored, so it can't drift.

## Security and privacy

- **Sign-in:** Google only, and only for invited emails. **Admin** (Owners): users, invites, deletes, commission rules, confirming Remittances. **Member** (Staff, Agents): everything else, and they see all data, as the Owners asked.
- **Every Server Action checks the session and role on the server**, and validates input with Zod. Secrets live only in Vercel and local `.env` (git-ignored); `.env.example` lists the names.
- **Sensitive data:** birthday and blood type are collected only for dog tags, never shown on the public page, and covered by a short privacy notice on the order form (Philippine Data Privacy Act).
- **Public status lookup:** order code + last 4 digits of the Customer's phone, rate-limited, shows only Status and Due date.
- **Checked against the OWASP Top 10** before Oct 31.

## Testing and CI

- **Vitest:** Stage → Status mapping, commission math (all three rule types, splitting between two Agents, cancelled Orders), Amount owed, order-code generation, Zod schemas.
- **Playwright:** sign in → create a Batch → enter 5 students in the Batch entry table → move a Stage → see it on the dashboard.
- **CI adds:** unit tests, then e2e against Postgres in Docker, on every PR.

## Trade-offs

- **One `item` table with nullable columns** instead of a table per item kind: 4 kinds with few fields each, and one query for a Batch's items. Check constraints keep each kind's required fields filled in.
- **Prices and commission rules are copied onto each item/commission when saved:** material prices change, and old Orders must not be recalculated.
- **Agents keep deducting their own Commission** (net Remittances) instead of the Main office paying it out: changing their process is the fastest way to "too complicated". The system checks the math instead.
- **No file storage in v1** (agreements, mold photos): paper and Messenger work for now (ADR 0001).

## Open questions

- Commission on Other items (medals, plaques): not decided by the owners yet.
- Vercel's Hobby plan is non-commercial: pay for Pro (~$20/month) or move production to another host before real Orders go in. Decide by Oct 17 (ADR either way).
- Google sign-in is in Testing mode (test users only, an "unverified app" warning). Publishing needs a `/privacy` page (also the dog-tag privacy notice) and the final domain. Do it by Oct 17.
- Neon preview branches copy production, so once real Orders exist, previews hold real customer data. Before Oct 17, branch previews from a seeded fake-data branch instead.
- Rate-limit store for the status lookup: a Postgres table or a hosted Redis. Decide by Nov 7.
