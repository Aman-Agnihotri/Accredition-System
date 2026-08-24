# Administrative audit inventory

This inventory is the source review boundary for privileged mutations. A
successful administrative change and its `administrative_audit_events` row must
commit in the same PostgreSQL transaction. A failed attempt is recorded
separately in `security_events` after the failed transaction is rolled back.

Audit summaries are bounded metadata, not payload archives. Passwords, tokens,
credentials, authorization material, message bodies, email addresses, and phone
numbers are excluded by the audit service.

## Transactional administrative mutations

| Capability | Routes | Audit actions |
| --- | --- | --- |
| Events | `POST /api/events`, `PUT /api/events/:id` | `event.create`, `event.update` |
| Event membership | `POST /api/events/:id/members`, `DELETE /api/events/:id/members/:userId` | `event_membership.grant`, `event_membership.revoke` |
| Access levels | `POST /api/access`, `PUT /api/access/:id`, `DELETE /api/access/:id` | `access_level.create`, `access_level.update`, `access_level.deactivate` |
| Area assignments | `POST /api/access/assignments`, `DELETE /api/access/assignments/:id` | `access_assignment.grant`, `access_assignment.revoke` |
| Areas | `POST /api/areas`, `PUT /api/areas/:id`, `DELETE /api/areas/:id` | `area.create`, `area.update`, `area.deactivate` |
| Accounts | `POST /api/users`, `PUT /api/users/:id`, `PUT /api/users/:id/status`, `DELETE /api/users/:id` | `user.create`, `user.update`, `account_status.*` |
| Enrollment | `POST /api/users/bulk-import`, `POST /api/users/:id/reissue-activation`, `POST /api/users/:id/reset-password` | `user.bulk_import`, `identity.activation_reissue`, `identity.password_reset_issue` |
| Devices | `POST /api/devices/events/:event_id/registrations/:id/deregister`, `/blacklist`, `/unblacklist` | `device_registration.*` |
| Notification commands | `POST /api/notifications/send` | `notification.enqueue` |
| Operational cases | `POST /api/incidents/:id/actions/:action`, `POST /api/incidents/overrides`, `POST /api/incidents/overrides/:id/actions/:action` | `incident.*`, `emergency_override.*` |
| Privacy policy | `POST /api/privacy/retention/policies`, `POST /api/privacy/retention/policies/:version/approve` | `retention_policy.create`, `retention_policy.approve` |
| Legal holds | `POST /api/privacy/retention/holds`, `POST /api/privacy/retention/holds/:id/release` | `legal_hold.create`, `legal_hold.release` |
| Retention batches | `POST /api/privacy/retention/runs/batch` | `retention.dry_run`, `retention.execute` |
| Global security setting | `PUT /api/admin/qr-compatibility` | `qr_compatibility.update` |

## Reviewed exclusions

- Read-only routes do not mutate administrative state.
- `GET /api/users/export/csv`, scan exports, and privacy subject exports use
  existing immutable requested/completed/failed export evidence because a
  streaming response cannot share one transaction with the completed outcome.
- Account login, refresh, activation, and self password change are identity
  operations rather than administrator commands. Their security/session
  evidence remains in the dedicated identity tables.
- Device session registration, device-token registration, sync heartbeat,
  scanner verification, scan upload, and incident report submission are
  authenticated operational workflows. Administrative transitions within
  those domains are included above.
- `/health` and `/ready` are public probes. Operational metrics and worker
  health under `/api/admin/operations/*` require active global-administrator
  authority.

Review this inventory whenever a privileged mutation route is added or its
transaction boundary changes.
