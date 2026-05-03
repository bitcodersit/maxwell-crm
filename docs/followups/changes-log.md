# Follow-up Change Log

Tracks requested changes over time. Append each new request as a new entry.

## Status Keys
- `requested`: logged but not started
- `planned`: broken down into actionable tasks
- `in_progress`: actively being worked on
- `done`: completed
- `cancelled`: intentionally dropped

---

## Entry 001
- Date: 2026-05-03
- Requested By: User
- Status: planned
- Request:
  - Create implementation planning docs only, do not start feature build.
  - Create separate version folders under `/docs/` with nested `v1`, `v2`, `v3`.
  - Break down plan in each version and add checklist tracking for done/not done.
  - Create follow-up file(s) to keep track of requested changes and append future requests.
- Notes:
  - Initial structure created: `docs/v1/checklist.md`, `docs/v2/checklist.md`, `docs/v3/checklist.md`, and this log file.

---

## Entry 002
- Date: 2026-05-03
- Requested By: User
- Status: done
- Request:
  - Add a reusable `BaseCrud` component that can drive full CRUD from the outside (table, server pagination, search/filter query, multi-select, bulk action slot, create/update modal with Zod validation).
  - Implement it on `app/pages/(app)/roles/index.vue`.
- Notes:
  - Implemented `app/components/BaseCrud.vue` and refactored roles page to use it (permissions picked via checkbox list; edit uses exposed `openEdit`).
