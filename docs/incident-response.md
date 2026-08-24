# Incident response

This guide is executable by the global administrator and the designated API
operator. It covers detection through recovery without assuming access to a
paid hosting shell.

## Severity and authority

| Severity | Definition | Initial response |
| --- | --- | --- |
| SEV-1 | Credential compromise, cross-event disclosure, destructive privacy failure, or broad outage | Acknowledge within 15 minutes; global administrator leads |
| SEV-2 | Material degradation, stuck notification delivery, repeated authorization denial, or one-event outage | Acknowledge within 30 minutes; API operator leads |
| SEV-3 | Contained defect with a safe workaround and no evidence of exposure | Triage within one business day |

The global administrator owns security decisions, key rotation, global QR
compatibility, account suspension, and external notification. The API operator
owns technical diagnosis and recovery. The event administrator supplies event
facts but cannot change global controls. One person records the timeline; no
responder edits or deletes source evidence.

## First 15 minutes

1. Start a timeline in UTC with detection source, reporter, affected event,
   symptoms, and the first safe request/correlation reference.
2. Classify severity and assign incident lead, technical lead, recorder, and
   communications owner.
3. Check public `/health` and `/ready`. A healthy liveness response does not
   overrule failed readiness.
4. As global administrator, inspect `/api/admin/operations/health` and metrics.
   Record values, not screenshots containing unrelated user data.
5. Stop the harmful workflow if necessary: suspend affected accounts, revoke or
   blacklist affected devices, disable legacy QR compatibility, or remove the
   service from traffic. Choose the smallest containment that protects users.
6. Preserve immutable audit/security evidence and current deployment,
   migration, database-backup, and configuration version identifiers.
7. Set the next update time even if diagnosis is incomplete.

## Evidence preservation

- Record request IDs, correlation IDs, UTC timestamps, event IDs, deployment
  identifiers, migration maximum ID/checksum, and alert values.
- Export only the minimum authorized audit window. Do not copy access tokens,
  refresh tokens, passwords, device tokens, private keys, provider payloads, or
  complete database URLs into the timeline.
- Do not update/delete evidence tables or terminal notification records.
- If privacy data is implicated, create a legal hold before any retention run
  and involve the communications/privacy owner.
- Preserve a verified database backup before destructive recovery. Restore
  testing must occur in an isolated target.

## Containment playbooks

### Account or credential exposure

Suspend the account for temporary containment; deactivate only when access must
remain disabled beyond the incident; use deletion only under the approved
privacy workflow. Revoke affected session families/devices, rotate only the
purpose-specific secret, and require reauthentication. Do not enable legacy QR
compatibility as a recovery shortcut.

### Cross-event authorization concern

Remove the affected operation from use, preserve the request reference, verify
event membership and resource ownership, and inspect the administrative and
security event rows. Treat confirmed cross-event disclosure as SEV-1.

### Notification backlog or provider failure

Compare worker heartbeat, queue age, expired leases, permanent failures, and
provider outcomes. Confirm provider configuration outside logs. Allow lease
recovery; do not manually rewrite terminal evidence or re-enqueue a broadcast
without explicit recipient confirmation.

### Database or migration failure

Remove the service from traffic when readiness fails. Confirm migration status
through the supported migration script, compare checksums, and never repair the
ledger manually. Restore only to an isolated verified target unless the global
administrator approves production recovery.

## Recovery and validation

1. Document the exact corrective change and rollback path.
2. Run type, test, build, migration-runtime, and operations-contract checks for
   the affected capability.
3. Restore traffic gradually and watch readiness, error rate, latency, pool
   waiting, worker heartbeat, queue age, and provider outcomes.
4. Exercise one representative authenticated read and the affected workflow
   only when the incident lead approves live validation.
5. Close containment only after the global administrator confirms no unsafe
   authority remains and evidence is preserved.

## Communications

Every update states severity, customer impact, known scope, containment,
evidence confidence, next action, owner, and next update time. Separate facts
from hypotheses. Do not disclose event attendee information or credentials.
External/legal notification is owned by the global administrator with the
privacy/communications owner.

## Post-incident review

Within five business days, record timeline, root cause, contributing controls,
detection quality, customer impact, recovery evidence, and owned corrective
actions with dates. Validate that alerts and this guide still match source.

## Tabletop exercise

Run at least twice yearly and after a material authority, notification, or
recovery change. Use a synthetic scenario, nominate roles, execute the first-15
minutes checklist, locate one administrative audit event by support reference,
walk containment and recovery, and record gaps as dated owned actions. A
tabletop is evidence of rehearsal, not evidence that hosted alert delivery or a
real restore works.
