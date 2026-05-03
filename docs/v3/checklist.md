# V3 Checklist - Security, Reliability, and Expansion

## Scope
V3 focuses on hardening, backup/recovery, and optional integrations after core CRM stabilization.

## Data Security
- [ ] Run endpoint-by-endpoint RBAC audit
- [ ] Run page/route-level RBAC audit
- [ ] Implement encryption strategy for sensitive data fields
- [ ] Verify secure key/secret handling in runtime config and env files
- [ ] Add security test cases for access violations and ownership boundaries

## Backup and Recovery
- [ ] Implement scheduled cloud backup (daily)
- [ ] Implement scheduled cloud backup (weekly)
- [ ] Add backup retention policy
- [ ] Add backup monitoring/alerting
- [ ] Validate restore procedure in staging
- [ ] Document disaster recovery runbook

## Expansion Scope
- [ ] Design WhatsApp API integration interface
- [ ] Implement WhatsApp follow-up/alert use cases
- [ ] Design Facebook Lead Form sync adapter
- [ ] Implement Facebook lead auto-ingestion with dedupe checks
- [ ] Design customer portal login and self-service scope
- [ ] Build EMI/Payment tracking module specification
- [ ] Implement EMI/Payment tracking module

## V3 Exit Criteria
- [ ] Security and backup controls are operational and tested
- [ ] Recovery drill succeeds in staging
- [ ] At least one expansion integration is production-ready
- [ ] Remaining expansion items have approved implementation specs
