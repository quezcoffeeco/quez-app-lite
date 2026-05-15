# Quez Coffee Co. — Full Version Architecture Spec

**Document type:** Engineering architecture / RFP
**Author:** Drafted during the Lite-version build (May 2026), for activation post-launch
**Current product state:** "Lite" version — single-device React PWA running on localStorage + EmailJS
**Target product state:** All-in-one operations + POS + bookkeeping platform — multi-device, cloud-backed, hardware-integrated
**Working name:** Quez Operations Platform (rename TBD)

---

## 1. Executive Summary

The Lite version of the Quez app is operationally complete for the trailer's first year: training portal, daily/periodic checklists, time clock, order queue, drink guide, schedule, reports, audit log, dashboards per role. It runs entirely on localStorage and EmailJS, on a single device. That is intentional. It carries Quez Coffee Co. through soft open, grand opening, and the first 6–12 months of real operations.

The **Full Version** absorbs three categories the Lite version cannot serve:

1. **Real money** — point-of-sale with card processing, cash drawer, receipts, tax engine, refunds, gift cards
2. **Real books** — double-entry bookkeeping, bank sync, P&L / Balance Sheet / Cash Flow auto-generation, payroll, tax filing
3. **Real scale** — multi-device sync, cloud backup, second-location-ready, optional product-licensing model

This document is the architectural spec, written so it can be:
- Handed to a development contractor or agency for scope and cost
- Used to brief Claude (or another AI coding partner) when build time arrives
- Used by the owner to evaluate proposals against a single source of truth

Construction is not recommended before **Q1 2028** at the earliest. Year 1 of operations should generate the real-world feedback that refines this spec.

---

## 2. Vision & Goals

### 2.1 Vision

A single platform that runs Quez Coffee Co. — operations, customer service, training, and bookkeeping — without external SaaS dependencies for the core workflows. Aligned with the brand: veteran-owned, honey-crafted, community-rooted. Built so the same software can be licensed to other veteran-owned mobile food operations.

### 2.2 Primary Goals

| Goal | Success Criterion |
|---|---|
| Replace Square / Toast / Clover for POS | All sales run through the platform; no parallel terminal |
| Replace QuickBooks Online for daily bookkeeping | Owner reconciles books inside the platform monthly without exporting to QB |
| Replace separate scheduling tools (7shifts, Homebase) | Schedule, swaps, day-off, hour tracking all integrated |
| Carry the Lite version's training + ops workflows | No regression; training portal, checklists, drink guide retained |
| Be sellable | Architecture supports multi-tenancy if a Quez SaaS offering ever launches |

### 2.3 Non-Goals (for v1.0)

- Multi-location chain management (architecture supports it; product polish defers to v1.1)
- Online ordering / delivery integration (DoorDash, UberEats) — defer to v1.1
- Native iOS/Android apps — PWA is sufficient through v1.0
- Marketing automation / email campaigns — owner uses Mailchimp separately
- Custom hardware (we use commodity Stripe Terminal, Star printer, APG drawer)

---

## 3. Current State — What Carries Forward From Lite

About 60% of the Lite codebase survives the pivot. Specifically:

**Carried forward unchanged:**
- All React screen components (Dashboard, OrderScreen, Schedule, Reports, etc.)
- Training content (`src/data/trainingContent.js`) — Phase 1/2/3 lessons + quiz
- Drink recipes (`src/data/drinkRecipes.js`) — 15 drinks with builds
- Drink modifiers (`src/data/drinkModifiers.js`)
- Brand standards rotation (`src/data/brandStandards.js`)
- Periodic checklist items
- Daily checklist items
- LoginScreen visual + PIN system
- Brand assets (logo, seal, fonts, color palette)
- Bottom-nav structure, role-based menus, back-button stack

**Carried forward but rewritten:**
- All storage helpers in `src/utils/storage.js` — synchronous localStorage calls become async API calls to Supabase
- AppContext — session model becomes JWT-backed instead of localStorage object
- EmailJS calls — replaced with SendGrid (server-side) or kept for transactional emails only

**Replaced:**
- localStorage as data layer → PostgreSQL via Supabase
- Single-device session → multi-device with real auth
- PIN-only auth → PIN for staff floor use + password/SSO for managers when not on the bar

**Discarded:**
- Manual report email (`buildDailyDrinkReport`, `buildTimeClockReport`) — replaced by scheduled cloud jobs

---

## 4. System Architecture

### 4.1 High-Level Stack

```
┌────────────────────────────────────────────────────────┐
│ FRONTEND                                                │
│ React 18 + TypeScript (was JS — migrate for type safety │
│ on financial code)                                      │
│ Hosted on Vercel                                        │
│ PWA-installable, offline-first for order queue          │
└──────────────────┬─────────────────────────────────────┘
                   │ HTTPS
┌──────────────────┴─────────────────────────────────────┐
│ BACKEND — Supabase                                      │
│ • PostgreSQL (with Row-Level Security policies)         │
│ • Auth (JWT, email/password + custom PIN flow)          │
│ • Storage (receipts, reports, employee photos)          │
│ • Edge Functions (Deno) for: webhooks, scheduled jobs,  │
│   tax calculations, integration brokers                 │
│ • Realtime subscriptions (queue sync between devices)   │
└──────────────────┬─────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬────────────┬────────────┐
       │           │           │            │            │
   ┌───┴───┐  ┌────┴────┐  ┌───┴────┐  ┌────┴───┐  ┌─────┴────┐
   │Stripe │  │ Plaid   │  │ Gusto  │  │Veryfi  │  │ Tax1099  │
   │Terminal│  │ Bank    │  │Payroll │  │ OCR    │  │ Filing   │
   │+Connect│  │ Sync    │  │ API    │  │        │  │          │
   └────────┘  └─────────┘  └────────┘  └────────┘  └──────────┘
       │
   ┌───┴────────────────────┐
   │ HARDWARE — at trailer  │
   │ • WisePOS E reader     │
   │ • APG cash drawer      │
   │ • Star TSP100 printer  │
   │ • iPad / Android tablet│
   └────────────────────────┘
```

### 4.2 Why Supabase

| Criterion | Supabase | Firebase | Roll-your-own (Postgres + Express + custom auth) |
|---|---|---|---|
| Cost at trailer scale | $0–$25/mo | $0–$30/mo | $40–$100/mo (hosting) + dev time |
| PostgreSQL (real SQL, joins, audit-grade) | ✅ | ❌ (Firestore is NoSQL) | ✅ |
| Auth included | ✅ | ✅ | Build it |
| Row-Level Security | ✅ (native Postgres) | Partial | Build it |
| Realtime subscriptions | ✅ | ✅ | Build it |
| Storage (receipts, photos) | ✅ | ✅ | S3 |
| Edge functions for webhooks/jobs | ✅ (Deno) | ✅ (Node) | Build it |
| Backup / point-in-time recovery | ✅ | ✅ | DIY |
| SOC 2 compliance certification | ✅ | ✅ | Major lift |
| Vendor lock-in risk | Low (export to any Postgres) | High | None |

**Recommendation: Supabase.** The PostgreSQL underpinning matters specifically for the bookkeeping module — financial reports written as SQL queries against a real ledger table are night-and-day more maintainable than NoSQL workarounds. Vendor lock-in is low because the schema is portable Postgres.

### 4.3 Why TypeScript (vs continuing in JS)

The Lite version is plain JavaScript. For Full version, migrate to TypeScript before adding the bookkeeping module. Reasons:

- Financial code has the lowest tolerance for runtime type errors. A debit/credit imbalance from a missing field is a legal compliance problem, not a UX bug.
- The data shapes for journal entries, payments, tax periods, bank transactions are complex enough that compile-time validation pays for itself within the first month.
- Migration is incremental — `.js` and `.tsx` co-exist; convert files as they're touched.

---

## 5. Data Model (Core Tables)

Naming convention: snake_case Postgres-standard. Every table has `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz`.

### 5.1 Identity & Auth

```sql
employees (
  id uuid pk,
  auth_user_id uuid (links to supabase auth.users),
  name text not null,
  role text not null,  -- 'owner' | 'manager' | 'leadBarista' | 'barista' | 'trainee'
  pin_hash text not null,  -- bcrypt-hashed 4-digit PIN, never stored plain
  must_change_pin boolean default false,
  wage_per_hour numeric(6,2),
  birthday text,  -- 'MM-DD'
  trainer_id uuid references employees(id),
  active boolean default true,
  training_bypass boolean default false,
  hired_at date,
  terminated_at date
)

audit_log (
  id uuid pk,
  actor_employee_id uuid references employees(id),
  action text not null,  -- 'pin_reset', 'role_upgrade', 'order_cancelled', etc.
  entity_type text,
  entity_id uuid,
  details jsonb,
  ip_address inet,
  at timestamptz default now()
)
```

### 5.2 Catalog (Menu + Modifiers + Recipes)

```sql
menu_items (
  id uuid pk,
  sku text unique,
  name text not null,
  name_es text,
  category text,  -- 'Honey Signature' | 'Espresso Classic' | etc.
  price_12oz numeric(6,2),
  price_16oz numeric(6,2),
  cost_basis numeric(6,2),  -- computed from recipe; cached
  is_eighty_sixed boolean default false,
  active boolean default true,
  display_order integer
)

modifiers (
  id uuid pk,
  group_id text,  -- 'milk' | 'espresso' | 'extras' | 'temp_ice'
  name text,
  name_es text,
  upcharge numeric(5,2) default 0,
  ingredient_cost numeric(5,3),
  active boolean default true
)

recipes (
  id uuid pk,
  menu_item_id uuid references menu_items(id),
  size text,  -- '12oz' | '16oz'
  prep_type text,  -- 'hot' | 'iced' | 'blended'
  ingredients jsonb,  -- [{ inventory_item_id, qty, unit }]
  build_steps text[],
  build_seconds_target integer,
  tip text
)
```

### 5.3 Orders & Sales

```sql
orders (
  id uuid pk,
  order_number integer,  -- daily-resetting display number
  taken_by_employee_id uuid references employees(id),
  status text,  -- 'open' | 'completed' | 'cancelled' | 'refunded'
  subtotal numeric(8,2),
  tax_amount numeric(8,2),
  tip_amount numeric(8,2),
  discount_amount numeric(8,2),
  total numeric(8,2),
  customer_id uuid references customers(id),
  channel text default 'in_person',  -- 'in_person' | 'mobile_order'
  order_note text,
  created_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text
)

order_items (
  id uuid pk,
  order_id uuid references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  size text,
  prep_type text,
  modifier_ids text[],
  custom_modifiers text[],
  item_note text,
  item_subtotal numeric(8,2),
  done boolean default false,
  done_at timestamptz
)

payments (
  id uuid pk,
  order_id uuid references orders(id),
  method text,  -- 'card' | 'cash' | 'gift_card' | 'comp'
  amount numeric(8,2),
  stripe_payment_intent_id text,
  card_brand text,
  card_last4 text,
  status text,  -- 'pending' | 'succeeded' | 'failed' | 'refunded' | 'partial_refund'
  receipt_url text,
  authorized_at timestamptz,
  captured_at timestamptz
)

refunds (
  id uuid pk,
  payment_id uuid references payments(id),
  amount numeric(8,2),
  reason text,
  refunded_by_employee_id uuid references employees(id),
  stripe_refund_id text,
  at timestamptz
)
```

### 5.4 Bookkeeping (the General Ledger)

This is the heart of the bookkeeping module. Every financial event in the system writes to `journal_entries` + `journal_lines` with matching debits/credits.

```sql
accounts (  -- Chart of Accounts
  id uuid pk,
  number text unique,  -- '1010', '4000', etc.
  name text,
  type text,  -- 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  subtype text,  -- 'current_asset' | 'cogs' | 'operating_expense' | etc.
  parent_account_id uuid references accounts(id),
  is_archived boolean default false
)

journal_entries (
  id uuid pk,
  entry_date date not null,
  description text,
  source_type text,  -- 'order' | 'refund' | 'payroll' | 'bill' | 'manual' | 'reconciliation'
  source_id uuid,  -- FK to the originating record (order_id, payroll_run_id, etc.)
  created_by_employee_id uuid references employees(id),
  is_void boolean default false,  -- voids leave an audit trail, don't delete
  void_reason text,
  created_at timestamptz
)

journal_lines (
  id uuid pk,
  journal_entry_id uuid references journal_entries(id) on delete restrict,
  account_id uuid references accounts(id),
  debit_amount numeric(10,2) default 0,
  credit_amount numeric(10,2) default 0,
  memo text,
  constraint debit_or_credit_only check (debit_amount = 0 OR credit_amount = 0)
)
```

**Invariant:** for every `journal_entry`, `SUM(debit_amount) = SUM(credit_amount)`. Enforced by trigger or transaction wrapper. Violating this is a P0 incident.

**Standard postings:**
- Card sale: DR `1010 Cash in Bank (pending)`, DR `2300 Sales Tax Payable`, CR `4000 Sales Revenue`, CR `2200 Tip Liability` (if tip). On Stripe payout: DR `1000 Operating Cash`, CR `1010 Cash in Bank (pending)`, DR `6900 Processing Fees`.
- Cash sale: DR `1100 Cash Drawer`, similar split
- Refund: reverses the entries
- Payroll run: DR `6000 Wages`, DR `6010 Payroll Tax Expense`, CR `2100 Wages Payable`, CR `2110 Payroll Tax Liabilities`. On payout: DR `2100 Wages Payable`, CR `1000 Operating Cash`
- Inventory purchase: DR `1200 Inventory`, CR `2000 Accounts Payable` (or CR `1000 Cash`)
- Inventory consumed by sale: DR `5000 COGS`, CR `1200 Inventory` (auto on order_completed if recipe maps it)

### 5.5 Inventory

```sql
inventory_items (
  id uuid pk,
  sku text,
  name text,
  category text,
  unit text,  -- 'gal', 'btl', 'oz', 'each'
  on_hand numeric(10,3),
  par_level numeric(10,3),
  reorder_point numeric(10,3),
  unit_cost numeric(8,4),  -- weighted average
  vendor_id uuid references vendors(id),
  active boolean default true
)

inventory_movements (
  id uuid pk,
  inventory_item_id uuid references inventory_items(id),
  movement_type text,  -- 'purchase' | 'sale_consumption' | 'waste' | 'count_adjust' | 'transfer'
  qty_delta numeric(10,3),  -- negative for consumption
  source_type text,
  source_id uuid,
  unit_cost_at_time numeric(8,4),  -- snapshot for COGS
  at timestamptz,
  performed_by_employee_id uuid
)

waste_log (
  id uuid pk,
  drink_id uuid references menu_items(id),
  size text,
  prep_type text,
  reason text,
  note text,
  by_employee_id uuid references employees(id),
  at timestamptz,
  cost_estimate numeric(6,2)  -- computed from recipe
)
```

### 5.6 Vendors, Bills, A/P

```sql
vendors (
  id uuid pk,
  name text,
  contact_name text,
  email text,
  phone text,
  payment_terms text,  -- 'net_15' | 'net_30' | 'due_on_receipt'
  is_1099_contractor boolean default false,
  tax_id text encrypted,
  ytd_payments numeric(10,2)
)

bills (
  id uuid pk,
  vendor_id uuid references vendors(id),
  bill_number text,
  bill_date date,
  due_date date,
  amount numeric(10,2),
  paid_amount numeric(10,2) default 0,
  status text,  -- 'open' | 'partial' | 'paid' | 'overdue'
  expense_account_id uuid references accounts(id),
  receipt_storage_path text,
  ocr_data jsonb,  -- raw Veryfi response
  notes text
)

bill_payments (
  id uuid pk,
  bill_id uuid references bills(id),
  amount numeric(10,2),
  payment_date date,
  method text,
  bank_transaction_id uuid references bank_transactions(id),
  journal_entry_id uuid references journal_entries(id)
)
```

### 5.7 Bank Sync

```sql
bank_accounts (
  id uuid pk,
  plaid_account_id text unique,
  plaid_access_token text encrypted,
  name text,
  institution text,
  account_type text,  -- 'checking' | 'savings' | 'credit_card'
  mask text,  -- last 4
  current_balance numeric(10,2),
  available_balance numeric(10,2),
  linked_chart_account_id uuid references accounts(id),
  last_sync_at timestamptz
)

bank_transactions (
  id uuid pk,
  bank_account_id uuid references bank_accounts(id),
  plaid_transaction_id text unique,
  transaction_date date,
  amount numeric(10,2),
  description text,
  category text,  -- Plaid category
  matched_journal_entry_id uuid references journal_entries(id),
  is_reconciled boolean default false,
  is_excluded boolean default false  -- transfer between own accounts, etc.
)

categorization_rules (
  id uuid pk,
  match_description_pattern text,  -- regex or substring
  match_amount_range numrange,
  vendor_id uuid references vendors(id),
  expense_account_id uuid references accounts(id),
  priority integer
)
```

### 5.8 Payroll & Time

```sql
time_punches (
  id uuid pk,
  employee_id uuid references employees(id),
  clock_in_at timestamptz,
  clock_out_at timestamptz,
  location text,
  edited_at timestamptz,
  edited_by_employee_id uuid,
  notes text
)

shifts (
  id uuid pk,
  shift_date date,
  employee_id uuid references employees(id),
  start_time time,
  end_time time,
  note text,
  is_swap_drop boolean default false
)

swap_requests (
  id uuid pk,
  employee_id uuid references employees(id),
  request_type text,  -- 'shift_drop' | 'day_off'
  shift_id uuid references shifts(id),
  date_str date,
  reason text,
  status text,  -- 'pending' | 'approved' | 'denied'
  resolved_by_employee_id uuid,
  resolved_at timestamptz
)

payroll_runs (
  id uuid pk,
  gusto_payroll_run_id text,
  pay_period_start date,
  pay_period_end date,
  pay_date date,
  total_gross numeric(10,2),
  total_taxes numeric(10,2),
  total_net numeric(10,2),
  status text,  -- 'draft' | 'submitted' | 'paid' | 'reversed'
  journal_entry_id uuid references journal_entries(id)
)

payroll_line_items (
  id uuid pk,
  payroll_run_id uuid references payroll_runs(id),
  employee_id uuid references employees(id),
  regular_hours numeric(6,2),
  overtime_hours numeric(6,2),
  gross_pay numeric(8,2),
  taxes_withheld numeric(8,2),
  net_pay numeric(8,2),
  tips_paid numeric(8,2)
)
```

### 5.9 Customers & Loyalty

```sql
customers (
  id uuid pk,
  name text,
  email text,
  phone text,
  notes text,
  loyalty_stamps integer default 0,
  total_drinks integer default 0,
  total_spent numeric(10,2) default 0,
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  preferred_drink_id uuid references menu_items(id),
  preferred_size text,
  birthday text  -- MM-DD, optional, for free-drink-on-birthday
)

loyalty_transactions (
  id uuid pk,
  customer_id uuid references customers(id),
  order_id uuid references orders(id),
  stamps_change integer,  -- +1 per drink, -10 for redemption
  type text,  -- 'earn' | 'redeem' | 'manual_adjust'
  at timestamptz
)
```

### 5.10 Operations Modules (carry over from Lite)

These are mostly mechanical migrations from Lite localStorage:

- `daily_checklist_submissions` (date, section, items_status jsonb, submitted_by, submitted_at)
- `periodic_checklist_submissions` (date, type 'weekly'/'monthly'/'quarterly'/'annual', items_status, submitted_by, submitted_at)
- `training_records` (employee_id, phase1/2/3 passed/date/trainer)
- `handoff_notes` (text, by, at — 24h auto-expire)
- `calendar_notes` (date, text, by, at)
- `mood_pulse` (anonymous_id, rating 1-3, at)

---

## 6. Module Specifications

### 6.1 Auth & Roles

**PIN-based fast sign-in** (carry from Lite) for floor operations. PINs are bcrypt-hashed server-side. PIN entry hits a Supabase Edge Function that returns a short-lived JWT tied to the employee record.

**Password / SSO** for managers and owners when working off-floor (laptop, phone, browsing analytics). Same `employees` row, alternate auth method on the linked `auth.users`.

**Role hierarchy:**
```
owner > manager > leadBarista > barista > trainee
```

**RLS policies enforced at the database level** for every table. Examples:
- `employees`: SELECT all if role ≥ manager; UPDATE all if owner; SELECT self only otherwise
- `journal_entries` and `journal_lines`: SELECT/INSERT if role ≥ manager; UPDATE never (immutable, use voiding journal entries)
- `orders`: SELECT all if currently on shift; INSERT if staff role
- `payments`: SELECT all if role ≥ manager; INSERT via service role only (server-side)

**Session timeout:** 30 minutes idle (carry from Lite), force PIN re-entry.

**Audit log:** every mutation to sensitive tables (employees, accounts, journal entries, payments, refunds, bills) writes an audit_log row. Owner has a dedicated Audit Log screen with filtering.

### 6.2 POS / Order Management

**Order lifecycle:**
1. Barista builds order in the Order screen (carried from Lite)
2. On "Send to Queue" → order persists, queue updates realtime across devices
3. As items completed, real-time check-offs visible to other devices
4. On "Mark Complete" → triggers payment flow

**Payment flow:**
1. Tap "Charge" on the order
2. Choose payment method: card / cash / split / gift card / comp
3. Card: Stripe Terminal `processPayment(amount)` → device prompts customer → success/decline
4. Cash: prompt for tendered amount, calculate change, cash drawer opens via printer pin
5. Split: configure tender splits before charging
6. Receipt: print + optional SMS/email to customer (with their consent)
7. On success: order status → 'completed', triggers journal entries automatically

**Refunds:**
- Full refund: reverses order's journal entries; deducts loyalty stamps
- Partial refund: line-item or amount-based; pro-rates tax/tip
- All refunds require manager PIN
- 30-day window for card refunds (Stripe limit); beyond that, manual store credit

**Discounts:**
- Pre-defined: "Friends & Family 20%", "Free drink redemption", "Comp"
- Custom: amount or percent, requires reason
- Discount amount books to `5500 Discounts & Comps` (contra-revenue)

**Voids vs Refunds:** Void = pre-capture, no money moved. Refund = money returned.

### 6.3 Bookkeeping Engine

**Auto-postings** — every business event books journal entries automatically:

| Event | Debits | Credits |
|---|---|---|
| Card sale completed | `1010 Cash Pending`, `2300 Sales Tax Payable` | `4000 Sales Revenue`, `2200 Tip Liability` |
| Cash sale completed | `1100 Cash Drawer` (same other postings) | |
| Stripe payout received (via Plaid) | `1000 Operating Cash`, `6900 Processing Fees` | `1010 Cash Pending` |
| Refund issued | (reverses original entry) | |
| Inventory purchase | `1200 Inventory` or `5000 COGS` | `2000 A/P` or `1000 Cash` |
| Drink served (recipe-driven) | `5000 COGS` | `1200 Inventory` |
| Drink waste logged | `5100 Waste Expense` | `1200 Inventory` |
| Payroll run (Gusto webhook) | `6000 Wages`, `6010 Payroll Tax Expense` | `2100 Wages Payable`, `2110 PR Tax Liab` |
| Payroll paid | `2100 Wages Payable`, `2110 PR Tax Liab` | `1000 Operating Cash` |
| Bill received | `6xxx Expense Account` | `2000 A/P` |
| Bill paid | `2000 A/P` | `1000 Operating Cash` |
| Tip-out to staff | `2200 Tip Liability` | `1000 Operating Cash` or `2100 Wages Payable` |
| Owner draw | `3100 Owner Draw` | `1000 Operating Cash` |
| SBA loan payment | `2700 SBA Loan Payable`, `6800 Interest Expense` | `1000 Operating Cash` |

**Manual journal entries** — for accountant adjustments, year-end, depreciation. Owner/CPA-only access. Always requires a balanced entry (debit = credit) enforced server-side.

**Financial statements** — generated on-demand:

- **Profit & Loss (Income Statement)** — for any date range
  - Revenue (sum of revenue accounts, less contra-revenue)
  - − COGS = Gross Profit
  - − Operating Expenses = Operating Income
  - − Interest = Net Income

- **Balance Sheet** — as of any date
  - Assets, Liabilities, Equity (sum of balances on that date)
  - Assets must equal Liabilities + Equity (validated, alarm if off by > $0.01)

- **Cash Flow Statement** — derived from journal entries categorized as operating/investing/financing

- **Trial Balance** — list every account with current balance, debit and credit columns must equal

- **Sales Tax Liability Report** — quarterly, ready for Iowa filing

### 6.4 Bank Sync & Reconciliation (Plaid)

**Connection:** owner links business checking + business credit card via Plaid Link UI. Tokens stored encrypted server-side.

**Daily sync:** Edge function runs nightly via cron, pulls latest transactions from Plaid, stores in `bank_transactions`.

**Auto-matching:** for each new bank transaction:
1. If amount + date matches an existing journal entry within ±2 days → suggest match
2. If matches a categorization rule → auto-categorize and suggest journal entry
3. If unmatched → goes to a "Needs Review" queue for owner to categorize

**Manual reconciliation:** monthly, owner ticks off transactions matched to journal entries. Goal: book balance matches bank balance. Variances flagged for investigation.

### 6.5 Inventory & COGS

**Par levels** carry from Lite. New: recipe-driven auto-deduction.

When `order.status` flips to 'completed':
1. For each order_item, look up the matching recipe (menu_item_id + size + prep_type)
2. For each recipe ingredient, decrement `inventory_items.on_hand` by qty
3. Write an `inventory_movements` row for each decrement
4. Compute COGS for this order = sum of (qty × unit_cost) for all ingredients
5. Book a journal entry: DR `5000 COGS` (computed amount), CR `1200 Inventory` (same)

**Modifier costs:** modifiers also link to inventory items (e.g. "Extra Honey" → 0.5 oz honey syrup). Auto-deducted same way.

**Low-stock alerts:** every 4 hours, edge function checks for items below reorder_point, posts to owner Dashboard.

**Purchase orders & receiving:** owner creates a PO, marks it received, qty is added to `inventory_items.on_hand`, unit cost averaged in, bill auto-created in A/P.

### 6.6 Payroll (Gusto Partner API)

Gusto handles the actual payroll runs. We provide the data and read back the results.

**Setup:**
- Owner authorizes Quez platform to access their Gusto account via OAuth
- Employees mapped 1:1 by SSN (entered in Gusto, not here)
- Pay periods configured to match Gusto setup

**Per pay period:**
1. Edge function sums approved time_punches per employee for the pay period
2. Sums tips to be paid out per employee (computed by tip-pool rules — see 6.7)
3. POSTs to Gusto API: hours per employee + tips + adjustments
4. Gusto runs payroll on their schedule
5. Webhook fires back with payroll_run data → we book the journal entries
6. Tax filings (941, W-2, etc.) all handled by Gusto

**1099 contractors:**
- Vendors flagged `is_1099_contractor = true`
- YTD payments tracked per vendor
- Year-end: export to Tax1099 API, files with IRS, sends form to vendor

### 6.7 Tip Pool

**Configurable rules** per shift type. Defaults:
- Cash tips: pooled, distributed by hours worked that shift
- Card tips: same
- Owner draw / manager exempt unless explicitly opted in

**Workflow:**
1. End of shift: closing employee counts cash tip jar, enters total
2. Card tips computed from `payments.tip_amount` for the shift
3. Total tips ÷ total hours worked = $/hr rate
4. Each employee's share = their hours × rate
5. Tip-out either: (a) paid in cash from drawer + journal entry, or (b) added to next payroll via Gusto + journal entry

### 6.8 Reports & Analytics

**Standard reports:**
- Sales by Day / Week / Month / Year (with YoY comparison)
- Sales by Drink (units + revenue + % of total)
- Sales by Daypart (hour-of-day buckets)
- Modifier Popularity
- Labor Hours + Cost
- Waste Log
- Inventory Movement
- Per-Customer history (top customers by visits, by spend)
- Tax Liability (sales tax + 1099 YTD)

**Financial reports** (covered in 6.3): P&L, Balance Sheet, Cash Flow, Trial Balance.

**Custom reports:** owner builds reports against any combination of date range + dimension (drink / employee / hour / payment method / location). SQL-backed via Supabase.

**Export formats:** CSV, PDF (via server-side rendering), and a one-click "Send to Accountant" that bundles the standard year-end pack as a zip.

### 6.9 Hardware Integration

**Stripe Terminal (WisePOS E):**
- Wi-Fi connected to the trailer router
- Paired with the iPad/tablet via Stripe Terminal JavaScript SDK
- All card transactions flow through it
- Reader cost: $299. No monthly fee. Stripe fees: 2.6% + $0.10 per transaction.

**Receipt printer (Star TSP100 III LAN):**
- Networked, prints via direct TCP
- Receipt template: brand seal, item lines, totals, tax breakdown, tip line, signature line
- Optional thermal-print kitchen tickets for catering orders later

**Cash drawer (APG Vasario):**
- Connected to printer via RJ11 pin port
- Opens when triggered by printer driver (cash sale)
- Cost: ~$110

**Total hardware: ~$700–$1,200** depending on which models.

### 6.10 Customer-Facing (v1.0 minimal)

**Receipt by email/SMS:** opt-in checkbox at payment screen. SendGrid for email, Twilio for SMS. Brand-template receipt with seal, items, totals, tip line.

**Loyalty:** existing stamp card model digitized. Customer's phone number is the key. After 10 stamps, next drink free. Surfaces automatically at payment when the phone number is entered.

**Birthday freebie:** if customer has a birthday on file and today is their birthday, free drink coupon prompts at payment.

**Customer Display (v1.1):** secondary tablet at the window showing the order being built + order-ready announcements. Defer to v1.1.

**Mobile order-ahead (v1.1):** customer-facing PWA that talks to the same backend. Defer.

---

## 7. Third-Party Integrations

| Service | Purpose | Pricing | Setup time |
|---|---|---|---|
| **Supabase** | Backend + DB + Auth + Storage + Functions | $0 free → $25/mo Pro | Same day |
| **Stripe Connect + Terminal** | Card payments, payouts | 2.6% + $0.10 per swipe | 1–3 weeks (account verification) |
| **Plaid** | Bank sync | ~$0.30–$1.30/mo per account | 1–2 weeks (production access review) |
| **Veryfi** | Receipt OCR | $0.08 per receipt (volume tier) | Same day |
| **Gusto Partner API** | Payroll | Owner pays Gusto ~$40/mo, free API access | 4–8 weeks (partner program approval) |
| **Tax1099** | 1099 / W-2 e-filing | $2.99 per form | Same day |
| **Twilio** | SMS receipts, schedule alerts | $0.0075 per SMS | Same day |
| **SendGrid** | Transactional email | $0–$20/mo (volume tier) | Same day |
| **Vercel** | Frontend hosting | $0–$20/mo | Same day |
| **OneSignal** | Push notifications | $0 free tier | Same day |

**Monthly recurring (internal-only use):** ~$60–$130/mo.

---

## 8. Security & Compliance

### 8.1 PCI-DSS

Using Stripe Terminal + Stripe Connect, **the merchant qualifies for SAQ-A** — the simplest self-assessment questionnaire. We do not store card data ever; Stripe handles all of it. The application's exposure to PCI scope is limited to:
- Not storing PAN, CVV, or full mag-stripe data
- Using only Stripe-provided UI flows for card entry
- Annual self-attestation (signed by owner)

Cost of compliance: ~2 hours/year of owner time, $0 in fees.

### 8.2 Data Protection

- All PII (employee SSNs are in Gusto, never here; phone numbers, emails, etc. in our DB) encrypted at rest by Supabase
- Bank access tokens encrypted with libsodium server-side
- TLS 1.3 in transit
- Row-Level Security enforced for every table

### 8.3 Audit & Retention

- All financial records retained for 7 years (IRS requirement)
- All payroll records retained for 4 years (DOL/FLSA)
- Customer data retention configurable (default: indefinite, with opt-out per CCPA)
- Audit log retained indefinitely for sensitive tables

### 8.4 Legal Documents Required

- Privacy Policy (covering customer phone/email collection)
- Terms of Service (employee use)
- Cookie / data collection notices
- Vendor data processing agreements with each integration (Stripe, Plaid, etc.)

### 8.5 Liability Insurance Recommendation

- Cyber liability rider on the business policy (~$500/yr at this scale)
- E&O coverage if licensing the platform to others later

---

## 9. Deployment & DevOps

### 9.1 Environments

- **Development:** local dev, Supabase local emulator, Stripe test mode, Plaid sandbox
- **Staging:** Vercel preview branch, Supabase staging project, Stripe test, Plaid sandbox
- **Production:** Vercel production, Supabase production project, Stripe live, Plaid production

### 9.2 CI / CD

- GitHub Actions on every PR: TypeScript build, lint, run automated tests
- Deploy to staging on merge to `main`
- Manual promote to production after staging review

### 9.3 Backups

- Supabase: daily automated backups, point-in-time recovery for 7 days (Pro plan)
- Weekly off-site backup to S3 via scheduled edge function
- Monthly full-export to owner-controlled storage

### 9.4 Monitoring

- Sentry for frontend error tracking
- Supabase built-in logging
- Health-check endpoint pinged every 5 min by an external uptime monitor (Better Uptime, $10/mo)
- Owner gets SMS/email if production is down

---

## 10. Migration Plan from Lite

A clean cutover, not a long-running dual system. Estimated 4–6 hours of downtime planned for a slow Sunday.

**Pre-cutover (week of):**
1. Supabase production project provisioned
2. Schema deployed
3. Stripe Terminal hardware on-site and tested in test mode
4. Plaid + Gusto sandboxes wired up
5. Migration script tested against a clone of the Lite localStorage

**Migration script (Python or Node, run once):**
1. Owner exports Lite localStorage as a single JSON blob (button in Lite settings — TODO: add this to Lite)
2. Script maps Lite keys → Full Version tables:
   - `quez_employees` → `employees`
   - `quez_training_*` → `training_records`
   - `quez_time_punches` → `time_punches`
   - `quez_drink_log_*` → `orders` + `order_items` (synthesized retroactively, status='completed_lite')
   - `quez_schedule` → `shifts`
   - `quez_inventory` → `inventory_items`
   - `quez_audit_log` → `audit_log`
3. Script generates retroactive journal entries for all Lite-era completed orders, dated as they occurred (this gives the new books a full prior-period history)
4. Owner reviews migrated data, signs off

**Cutover day:**
1. Last Lite shift closed
2. Migration run
3. Quick reconciliation: total orders in Full == total orders in Lite, total hours == total hours, etc.
4. Switch DNS / app URL to Full Version
5. Run a test order, test payment, test refund
6. Open for business

**Rollback plan:** Lite still installed on a backup tablet for 30 days. If Full Version has a critical bug in week 1, revert + re-export.

---

## 11. Phased Build Plan

Sequence chosen to minimize risk: build the foundation, then add money, then add bookkeeping. Each phase is independently deployable and useful.

### Phase 0 — Spec sign-off + accounts (Weeks 0–1)
- Owner reviews this doc, refines based on year-1 operational learnings
- Apply for: Stripe Connect, Plaid production, Gusto Partner, Tax1099
- Order hardware: Stripe Terminal, printer, cash drawer
- Set up Supabase production project

### Phase 1 — Foundation (Weeks 1–4)
- TypeScript migration of Lite codebase
- Supabase schema deployed (everything in Section 5)
- Auth migrated (PIN + password for managers)
- All Lite screens rewritten to use Supabase async APIs
- Multi-device realtime sync working
- Lite migration script written and tested

**Deliverable:** Lite version + multi-device + cloud backup. No new user-facing features yet. Tested with two tablets running side-by-side at the trailer for one week.

### Phase 2 — POS (Weeks 4–8)
- Stripe Terminal integration
- Cash drawer + printer integration
- Receipt template + email/SMS receipt
- Tax engine (Iowa 7%)
- Refunds + voids
- End-of-day cash reconciliation
- Live shift testing for two weeks before relying on it exclusively

**Deliverable:** POS replaces Square (or whatever interim solution is being used). All sales running through Quez platform.

### Phase 3 — Bookkeeping core (Weeks 8–13)
- Chart of accounts seeded with Quez-specific accounts
- Journal engine with debit/credit invariant enforcement
- Auto-postings for every event in section 6.3
- P&L, Balance Sheet, Cash Flow, Trial Balance reports
- Manual journal entry UI for CPA adjustments
- Inventory deduction from sales (recipe-driven)
- COGS auto-booked

**Deliverable:** Run-rate books in the platform. Run parallel to QuickBooks for 60 days to validate.

### Phase 4 — Bank & A/P (Weeks 13–16)
- Plaid bank sync
- Auto-categorization rules
- Manual reconciliation UI
- Bills / A/P module
- Veryfi receipt capture for expense entry

**Deliverable:** Owner reconciles books inside the platform monthly. QuickBooks subscription can be cancelled if 60-day parallel run passed.

### Phase 5 — Payroll + Tax filing (Weeks 16–19)
- Gusto Partner API integration
- Tip pool calculator with payroll integration
- Payroll journal entries auto-posted
- 1099 contractor tracking
- Year-end W-2 / 1099 export to Tax1099

**Deliverable:** Payroll runs through Gusto via the platform; tax forms file electronically.

### Phase 6 — Customer & polish (Weeks 19–22)
- Customer database + loyalty (digitized stamp card)
- SMS receipts + schedule alerts (Twilio)
- Birthday freebie automation
- All Lite-era polish items (handoff notes, briefing, dashboards) carried forward
- Performance pass

**Deliverable:** Production-ready v1.0. Soft-launch.

### Phase 7 — Hardening (Weeks 22–24)
- Edge case testing (declined cards, refunds, partial payments, network drops)
- Backup + restore tested
- Disaster recovery drill (owner can re-up everything from scratch in <24h)
- Production go-live, Lite retired

**Total: 24 weeks (~6 months) elapsed time** if working with a single full-time contractor, or ~3–4 months elapsed time with AI-assisted development (Claude Max) and aggressive owner-side testing.

---

## 12. Cost Estimates

### 12.1 Development Cost

| Approach | Cost | Timeline |
|---|---|---|
| Solo contractor at $150/hr, 20 hrs/wk | ~$72,000 | 24 weeks |
| Boutique agency (2 devs + PM) | ~$150,000–$200,000 | 16–20 weeks |
| Owner + Claude Max + occasional contractor consults for security/compliance | ~$5,000–$10,000 in contractor fees + Claude Max ($200/mo × 6 = $1,200) + owner's time | 16–20 weeks elapsed |

### 12.2 Recurring Cost (Internal Use)

| Item | Monthly |
|---|---|
| Supabase Pro | $25 |
| Vercel | $20 |
| Stripe (per-transaction only, no monthly) | varies |
| Plaid (2 accounts) | $3 |
| Veryfi (50 receipts/mo) | $4 |
| Twilio (200 SMS/mo) | $2 |
| SendGrid | $0 (free tier) |
| OneSignal | $0 (free tier) |
| Better Uptime | $10 |
| Gusto Payroll (owner's subscription) | $40 |
| Sentry (error tracking) | $26 |
| **Total operational** | **~$130/mo** |

For comparison, the same workflow on commercial tools: QuickBooks Online Plus ($90) + Square Subscription ($60) + 7shifts ($30) + Gusto ($40) = ~$220/mo + per-transaction fees. Internal-only Full Version saves ~$90/mo, $1,080/yr.

### 12.3 Hardware (one-time)

| Item | Cost |
|---|---|
| Stripe Terminal WisePOS E | $299 |
| Star TSP100 III LAN printer | $249 |
| APG Vasario cash drawer | $110 |
| Mounting + cabling | $50 |
| Backup tablet (for the 30-day rollback window) | $0 (use existing) |
| **Total hardware** | **~$710** |

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Schema mistake in week 2 propagates to month 6 | Medium | High | Architecture review with CPA + DBA before Phase 1 ships |
| Stripe production approval delays | Medium | Medium | Apply in Phase 0; have backup payment option (Square) running in parallel |
| Gusto Partner Program rejection | Low | Medium | Fallback: direct Gusto product use (no API integration), manual journal entries |
| Real-world card edge cases not surfaced in testing | High | Medium | 30-day soft-launch with full Square fallback available |
| Owner doesn't have time to test alongside dev | Medium | High | Lock 8 hrs/wk of owner time for Phases 2–7 |
| Tax law change mid-build | Low | Medium | Tax engine designed as plug-in tables, not hard-coded rates |
| Bookkeeping errors in early weeks corrupt month-end reports | Medium | High | 60-day parallel run with QuickBooks before retiring it |
| Hardware fails on opening day | Low | High | Backup tablet on Square + paper receipts as last resort |
| Migration script loses data | Low | High | Full Lite export retained for 1 year; nightly Supabase backups |
| Single-developer key-person risk if contracting out | Medium | High | Architecture doc (this one) + heavy code commenting + open-source stack |

---

## 14. Open Decisions (resolve before Phase 0)

These need owner input before construction begins:

1. **Tip-pool rules** — flat hours-based? Position-weighted? Manager exempt or included? CPA recommendation.
2. **Discount approval threshold** — does any discount need manager PIN, or only over $5?
3. **Refund window** — strict 30 days (Stripe limit) or store credit beyond?
4. **Customer data retention** — keep indefinitely or auto-purge after 2 years of inactivity?
5. **Multi-location readiness** — design assumes single location for v1.0; do we wire location-awareness in schema now (cheap) or add later (expensive)?
6. **Cash counting** — do we require dual-count at end of day (two people) or single?
7. **Owner draw cadence** — track as scheduled distributions or one-off?
8. **Year-1 actual books** — does the migration script reconstruct full GL history for year 1, or do we open at $0 with a snapshot transfer?
9. **Hosting region** — Supabase US-East (cheaper) or US-Central (closer to Iowa)?
10. **Domain / branding** — is this `app.quezcoffeeco.com` or its own domain?

---

## 15. Appendix A — Lessons from Lite Version

Documenting what was learned during the Lite build, for the Full Version team:

1. **Role strings must be normalized at one source.** Lite had `'leadBarista'` vs `'lead_barista'` mismatch that broke periodic checklist access for an entire role. Single constant file, validated.

2. **Audit log limits matter.** Lite caps at 500 entries (memory-efficient). Full Version retains indefinitely with archival to cold storage past 1 year.

3. **PIN default `'0000'` + force-change-on-first-login** worked well. Carry forward as-is.

4. **Honey-in-cold-drink warning** is a brand-specific safety net. Generalize: per-modifier conditional warnings in the menu config, surfaced contextually in the queue.

5. **Hand-off notes** were the single most-praised Lite feature in user testing. Promote to first-class table with admin review log, not 24h auto-expire.

6. **Brand assets:** when owner provides a PNG, use it directly. Don't recreate with CSS/SVG. Background of asset must match container background exactly.

7. **Empty states matter.** "Inbox zero. Nice." reads warmer than "No pending requests." Apply across the Full Version.

8. **The `currentUser` vs `session` bug.** Context aliasing must be set up correctly at the start. Storage helpers that take an ID parameter should never accept undefined silently.

9. **Settings drift.** Owner-row guarding by ID (`'emp-owner-001'`) was stale because the actual ID was different. Always role-based checks, not ID-based.

10. **Don't ship inline `window.confirm` for destructive actions.** Lite has a handful; Full Version uses custom modal with undo where appropriate.

---

## 16. Appendix B — Glossary

- **GL** — General Ledger
- **A/P** — Accounts Payable (money we owe vendors)
- **A/R** — Accounts Receivable (money owed to us; rarely relevant for direct-pay coffee)
- **COGS** — Cost of Goods Sold
- **P&L** — Profit & Loss Statement (Income Statement)
- **BS** — Balance Sheet
- **CoA** — Chart of Accounts
- **PCI-DSS** — Payment Card Industry Data Security Standard
- **SAQ-A** — Self-Assessment Questionnaire A (simplest PCI form, applies when card data never touches your servers)
- **RLS** — Row-Level Security (Postgres feature for per-row access control)
- **JWT** — JSON Web Token (auth token format)
- **PWA** — Progressive Web App
- **TCS** — Time/Temperature Control for Safety (food code term)

---

**Document version:** 1.0 — Drafted May 2026 during Lite Version Session 14
**Next review:** After 90 days of Lite operations post grand-opening, ~July 2027
**Owner:** Ryan Rodriquez · Quez Coffee Co. LLC · Council Bluffs, Iowa
**Status:** Awaiting activation when owner is ready to commission Full Version build
