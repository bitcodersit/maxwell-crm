# V1 Checklist - Core CRM Build

## Scope
V1 delivers foundation, role security baseline, and the first core modules needed for daily CRM usage.

## Foundation
- [ ] Finalize CRM permission taxonomy (`lead`, `followup`, `property`, `pipeline`, `task`, `report`, etc.)
- [ ] Update permission seeding for all required modules
- [ ] Enforce API-level permission checks for all new endpoints
- [ ] Replace demo/mocked customer data with persistent domain data
- [ ] Add shared enums/constants and request validation schemas

## Lead Management
- [ ] Add `Lead` data model and migration
- [ ] Implement auto serial ID format (`RL-0001`, `RL-0002`)
- [ ] Add duplicate phone detection rules and warning behavior
- [ ] Build lead CRUD endpoints
- [ ] Implement lead filters (area, status, salesman, budget, source)
- [ ] Build lead UI (list, create/edit form, details)
- [ ] Add bulk assign and transfer APIs + UI actions
- [ ] Implement CSV/Excel import flow with import result report

## Follow-up Management
- [ ] Add `FollowUp` data model and migration
- [ ] Build follow-up CRUD endpoints
- [ ] Add daily follow-up queue endpoint for salesman
- [ ] Implement missed follow-up automatic overdue state
- [ ] Add reminder trigger event support
- [ ] Build follow-up timeline and daily follow-up UI

## Property Inventory
- [ ] Add `Property` data model and migration
- [ ] Add property document upload/linking model
- [ ] Add property price history model
- [ ] Build property CRUD endpoints
- [ ] Implement property-wise lead mapping
- [ ] Build property inventory UI and property detail view

## V1 Exit Criteria
- [ ] Role-based visibility works for Super Admin/Admin/Manager/Salesman
- [ ] Lead-to-follow-up-to-property workflows run end-to-end
- [ ] Core APIs validated with integration tests
- [ ] No mock business data path remains in production routes
