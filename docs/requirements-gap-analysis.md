# Maxwell CRM — Requirements Gap Analysis

**Source:** `requirements.md` (3 Dec 25)  
**Compared against:** current codebase (`/Applications/maxwell/maxwell-crm`)  
**Date:** 10 Jul 2026

**Legend:** ✅ Implemented · ⚠️ Partial · ❌ Not implemented

---

## Executive Summary

The CRM has a **solid core**: leads, follow-ups, visits, properties, bills, tasks, roles/permissions, and kanban boards. Most day-to-day CRUD workflows exist.

What's largely **missing** is the **operations layer** from the requirements:

- Real dashboards & reports (home page uses mock data)
- Follow-up automation (reminders, daily queue, overdue highlights)
- Lead ops (import, bulk assign, transfer, duplicate warning)
- Deal closing & payment records
- Notifications (mock API only)
- Sales targets (weekly/monthly)
- Activity log UI
- Security hardening (encryption, cloud backup)
- Expansion integrations (WhatsApp, Facebook, customer portal, EMI)

---

## 1. Project Overview

| Requirement | Status | Notes |
|---|---|---|
| Custom Real Estate CRM for web | ✅ | Nuxt app, authenticated routes, Prisma/MySQL |
| Manage leads end-to-end | ⚠️ | Core CRUD + detail tabs; import/bulk/transfer missing |
| Track salesman activity (Google location) & performance | ❌ | `Visit.checkIn` JSON exists; no GPS capture or location reports |
| Follow-ups & conversion tracking | ⚠️ | Follow-ups per lead work; conversion metrics & automation missing |
| Property inventory | ✅ | Full CRUD, documents, lead mapping |
| Convenience/billing tracking | ⚠️ | Conveyance bills module; not full convenience reporting |
| Dashboards & reports | ❌ | `HomeStats`, `HomeChart`, `HomeSales` use random mock data |

---

## 2. User Roles & Permission Levels

### Super Admin

| Requirement | Status | Notes |
|---|---|---|
| View all leads | ✅ | `readAnyLeads` permission + scoped queries |
| Assign salesman | ✅ | `AssignableUser` / `AssignableTeam` on leads |
| Dashboard access | ❌ | No real admin dashboard |
| Manage property inventory | ✅ | Properties module with RBAC |
| View activity log | ❌ | `AuditLog` written server-side; no UI |
| Access to all segments | ⚠️ | Super Admin gets all permissions in seed; segments not fully built |

### Admin (DGM / AGM)

| Requirement | Status | Notes |
|---|---|---|
| View all leads | ⚠️ | Permission exists but **not granted by default** in seed (only Super Admin) |
| Assign salesman | ⚠️ | Same — needs role permission setup |
| Dashboard access | ❌ | Not built |
| Manage property inventory | ⚠️ | Module exists; default Admin permissions not seeded |
| View activity log | ❌ | No UI |

### Manager

| Requirement | Status | Notes |
|---|---|---|
| View assigned team leads | ⚠️ | Scoping is creator/assignee/team-member, not "manager sees all team leads" |
| Monitor follow-ups | ⚠️ | Per-lead follow-ups only; no manager follow-up dashboard |
| Report access | ❌ | No reports module |

### Salesman

| Requirement | Status | Notes |
|---|---|---|
| View only own leads | ⚠️ | `readOwnLeads` exists; default grants not seeded |
| Add/update own leads | ⚠️ | API checks exist; UI access helpers are permissive (`app/utils/access.ts`) |
| Create follow-ups | ✅ | `LeadFollowUpFormModal.vue`, `/api/followups` |
| Add notes | ✅ | Comments on lead detail |

### Access Note

| Requirement | Status | Notes |
|---|---|---|
| Strict role-based access only | ⚠️ | RBAC framework solid; default role grants incomplete; some UI gates weaker than API |

---

## 3. Lead Management Module

### Lead Fields

| Field | Status | Notes |
|---|---|---|
| Lead ID (RL-0001…) | ✅ | `generateLeadSid.ts` |
| Lead Source | ✅ | Seeded options + form |
| Customer Name | ✅ | Linked `User` customer |
| Phone (duplicate check) | ⚠️ | Phone stored; `upsertCustomer` **silently merges** by phone — **no warning UX** |
| Area / Location | ✅ | `Address` model |
| Property Type Main/Sub | ✅ | `Option` enums |
| Block & Road | ✅ | Address fields |
| Budget Range | ✅ | `budgetMin` / `budgetMax` |
| Lead Status (Hot/Warm/Cold…) | ✅ | `LeadStatus` enum |
| Assigned Salesman | ✅ | `assignable.users` / teams |
| Follow-up Date | ❌ | Not a lead field; table column commented out |
| Conversation Notes | ✅ | Comments tab |
| Image/Document upload | ✅ | Attachments |
| Created Date | ✅ | Shown in overview |
| Last Activity Date | ⚠️ | `updatedAt` shown; no dedicated "last activity" from follow-ups/visits |

### Features

| Feature | Status | Notes |
|---|---|---|
| Auto serial ID | ✅ | |
| Duplicate number warning | ❌ | Silent merge in `server/utils/customer/upsertCustomer.ts` |
| Lead import (Excel/CSV) | ❌ | No production import route |
| Lead filtering | ✅ | Area, status, salesman, budget, search in `getLeads.ts` |
| Bulk assign to salesman | ❌ | Table select exists; `BaseCrud.vue` bulk actions commented out |
| Lead transfer | ❌ | Reassignment via edit only; no dedicated transfer workflow/audit |

---

## 4. Follow-up Management

### Fields

| Field | Status | Notes |
|---|---|---|
| Follow-up Date & Time | ✅ | |
| Type (Call / Visit / Message) | ✅ | `FollowUpType` enum (+ Email, Whatsapp) |
| Next Follow-up Date | ✅ | |
| Follow-up Notes | ✅ | |
| Status update option | ✅ | Follow-up status in form |

### Automation

| Feature | Status | Notes |
|---|---|---|
| Missed follow-up → red highlight | ❌ | No overdue styling or query |
| Daily follow-up list per salesman | ❌ | Nav link commented out; no `/followups` page |
| Auto reminder notification | ❌ | `@TODO: Notify` in lead create/update; no cron for follow-ups |

---

## 5. Property Inventory Module

### Fields

| Field | Status | Notes |
|---|---|---|
| Property ID | ✅ | `PROP-00001` style |
| Title, Location, Size, Block/Road, Face, Price, Status | ✅ | |
| Documents (PDF/Image) | ✅ | Attachments |
| Assigned Sales Manager | ✅ | `assignable.users` |

### Functions

| Function | Status | Notes |
|---|---|---|
| Property-wise lead mapping | ✅ | `LeadProperty` join; `LeadDetailProperties.vue` |
| Price history | ❌ | Only `previousPrice` snapshot |
| Available unit tracking | ❌ | Size stores Katha/Sqft, not unit count inventory |

---

## 6. Sales Pipeline (Deal Management)

| Requirement | Status | Notes |
|---|---|---|
| Stages: Lead → Prospect → Visit Done → Negotiation → Booking → Sold | ⚠️ | Kanban has extra stages (Contacted, Qualified, Visit Scheduled, Closed Lost); no explicit "Lead" column |
| Stage changing option | ✅ | Drag on leads kanban (`/leads`) |
| Deal closing form | ❌ | Not implemented |
| Payment record input | ❌ | Not implemented |

**Implementation issues:**

- New leads are placed in the **last board column** via `assignLeadToTheBoard.ts` (`columns.at(-1)` → "Closed Lost"), while seed puts existing leads in "New". Likely a bug.
- Lead temperature (Hot/Warm/Cold) is **separate** from kanban column — not synced on stage change.

---

## 7. Task & Activity Log Module

| Requirement | Status | Notes |
|---|---|---|
| Assign tasks to each salesman | ✅ | Tasks module + kanban |
| Weekly target assignment | ❌ | Overview derives targets from task counts, not admin-set targets |
| Monthly target assignment | ❌ | Same |
| Activity history (every update recorded) | ⚠️ | `AuditLog` via Prisma extension; **no viewer** |
| Track who updated lead and when | ⚠️ | `updatedAt` only; no user-facing change history |

**Extra gap:** Tasks page "top performers" uses hardcoded mock data.

---

## 8. Convenience + Bill

| Requirement | Status | Notes |
|---|---|---|
| Salesman convenience tracking | ⚠️ | Conveyance bills (`/bills`), not full convenience module |
| Date-wise view | ✅ | Date filter on bills |
| Month-wise view | ❌ | No monthly summary/report |
| Designation-wise view | ❌ | `User.designation` exists; bills not grouped by designation |

---

## 9. Dashboard & Reports

### Admin Dashboard

| Metric | Status |
|---|---|
| Total leads | ❌ |
| Salesman-wise leads | ❌ |
| Hot/Warm/Cold segmentation | ❌ |
| Conversion rate | ❌ |
| Follow-up due today | ❌ |
| Area-based demand report | ❌ |
| Monthly sales report | ❌ |

### Salesman Dashboard

| Metric | Status |
|---|---|
| My leads | ❌ |
| Today's follow-ups | ❌ |
| Conversion percentage | ❌ |
| Monthly performance summary | ❌ |

**Evidence:** `app/pages/(app)/index.vue` renders `HomeStats`, `HomeChart`, `HomeSales` with `Math.random()` / `randomInt()` mock values.

---

## 10. Search & Filtering

| Requirement | Status | Notes |
|---|---|---|
| Phone number search | ✅ | `q` param in `getLeads.ts` |
| Customer name search | ✅ | Same |
| Budget range filter | ✅ | |
| Location filter | ✅ | Area filter |
| Salesman filter | ✅ | |
| Status-based filtering | ✅ | |

**Gap:** Global search in layout (`UDashboardSearch`) is template UI, not wired to CRM entities. Filters are lead-list focused, not global.

---

## 11. Notification System

| Requirement | Status | Notes |
|---|---|---|
| Follow-up reminder | ❌ |
| New lead assignment notification | ❌ |
| Status change alert | ❌ |
| Admin broadcast message | ❌ |

**Evidence:** `server/api/notifications.ts` returns static mock notifications. Bell UI exists but is not CRM-connected.

---

## 12. Data Security & Backup

| Requirement | Status | Notes |
|---|---|---|
| Role-based access control | ⚠️ | Framework exists; incomplete default grants |
| Data encryption | ❌ | Listed in `docs/v3/checklist.md` as unchecked |
| Cloud backup (Daily/Weekly) | ❌ | Not implemented; deploy also doesn't run `prisma migrate deploy` in prod |

---

## 13. Expansion Scope

| Requirement | Status | Notes |
|---|---|---|
| WhatsApp API Integration | ❌ | `docs/v3/checklist.md` |
| Facebook Lead Form Auto Sync | ❌ | |
| Customer Portal Login | ❌ | Customer role exists; no portal |
| EMI/Payment Tracking Module | ❌ | |

---

## Built Beyond Requirements (not in requirements.md)

These exist in code but are **not** specified in `requirements.md`:

| Feature | Status | Notes |
|---|---|---|
| **Site Visits module** | ⚠️ | `Visit` model, visits tab, `/api/visits`; optional assignees not in form; `—` placeholder when no assignees |
| **Comments module** | ✅ | Per-lead comments |
| **Bills approval workflow** | ✅ | Transitions, export, PDF |
| **Teams management** | ✅ | Teams CRUD |
| **Kanban boards (generic)** | ✅ | Leads + tasks boards |
| **Email auth flows** | ✅ | Login, forgot/reset password, verify email |

---

## Recommended Priority Order

### P0 — Core ops gaps

1. Real admin & salesman dashboards (replace mock home page)
2. Default permission seeding for Admin / Manager / Salesman
3. Fix new-lead board column placement (`assignLeadToTheBoard.ts`)
4. Follow-up daily queue page + overdue highlighting

### P1 — Lead operations

5. Duplicate phone warning on lead create
6. Lead import (CSV/Excel)
7. Bulk assign to salesman
8. Lead transfer workflow with audit trail

### P2 — Pipeline & deals

9. Deal closing form
10. Optional payment record capture
11. Align pipeline stages with requirements (or document intentional differences)

### P3 — Reporting & notifications

12. Wire real notifications (assignment, follow-up, status change)
13. Activity log viewer for admins
14. Admin reports (conversion, area demand, monthly sales)
15. Weekly/monthly sales target model (distinct from task counts)

### P4 — Hardening & expansion

16. Cloud backup + migrate deploy in CI/CD
17. Field encryption strategy
18. WhatsApp / Facebook / customer portal / EMI (per `docs/v3/checklist.md`)

---

## Related Internal Docs

- `docs/v1/checklist.md` — early CRM checklist
- `docs/v2/checklist.md` — pipeline, tasks, notifications
- `docs/v3/checklist.md` — security, backup, expansion
