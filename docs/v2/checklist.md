# V2 Checklist - Operations and Insights

## Scope
V2 delivers pipeline operations, tasking, activity logs, convenience/bill tracking, dashboards, and global filtering.

## Sales Pipeline (Deal Management)
- [ ] Add pipeline/deal data model and migration
- [ ] Implement pipeline stages (`Lead -> Prospect -> Visit Done -> Negotiation -> Booking -> Sold`)
- [ ] Add stage transition API with role checks
- [ ] Build deal closing form flow
- [ ] Add optional payment record capture
- [ ] Build pipeline board UI (kanban/list view)

## Task & Activity Log
- [ ] Add task assignment data model
- [ ] Add weekly target data model
- [ ] Add monthly target data model
- [ ] Add immutable activity log model for all updates
- [ ] Auto-write logs from lead/follow-up/property/pipeline updates
- [ ] Build admin task/target management UI
- [ ] Build salesman task list UI

## Convenience + Bill
- [ ] Add convenience entry model and migration
- [ ] Build entry create/update/list endpoints
- [ ] Build date-wise view endpoint
- [ ] Build month-wise view endpoint
- [ ] Build designation-wise summary endpoint
- [ ] Build convenience and billing UI screens

## Dashboard & Reports
- [ ] Build admin KPI report endpoints
- [ ] Build salesman KPI report endpoints
- [ ] Add conversion rate and monthly performance calculations
- [ ] Add follow-up due today and area demand metrics
- [ ] Build admin dashboard UI
- [ ] Build salesman dashboard UI

## Search & Filtering + Notifications
- [ ] Implement global search for phone and customer name
- [ ] Standardize budget/location/salesman/status filtering across modules
- [ ] Add follow-up reminder notifications
- [ ] Add new lead assignment notifications
- [ ] Add status change alerts
- [ ] Add admin broadcast messaging

## V2 Exit Criteria
- [ ] Operations team can manage tasks, targets, and pipeline stages daily
- [ ] KPI dashboards show role-correct numbers
- [ ] Notification flows are visible and testable
- [ ] Search/filter behavior is consistent across pages
