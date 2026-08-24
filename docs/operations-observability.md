# Operations and observability

VeriGate emits bounded structured logs and low-cardinality metrics. These
contracts provide source-level instrumentation; a production log drain,
metrics collector, notification channel, and alert routing must still be
configured and exercised in the hosting environment.

## Access and trace handling

- `GET /api/admin/operations/metrics` exposes Prometheus text only to an active
  global administrator.
- `GET /api/admin/operations/health` reports notification-worker heartbeat and
  queue state with the same authority requirement.
- Every HTTP response returns a server request ID and a correlation ID. Search
  logs using those values. Never paste passwords, tokens, message bodies, or
  database/provider configuration into incident notes.
- Each response produces exactly one `http-request` terminal log event, whether
  it finishes normally or the connection closes early.

## Metric catalog

| Metric | Purpose |
| --- | --- |
| `verigate_http_requests_total` | Requests by method, route group, and status class |
| `verigate_http_aborts_total` | Connections closed before response completion |
| `verigate_http_request_duration_seconds` | HTTP latency histogram |
| `verigate_database_query_timeouts_total` | Classified PostgreSQL query timeouts |
| `verigate_database_pool_total`, `_idle`, `_waiting` | PostgreSQL pool pressure |
| `verigate_notification_worker_cycles_total` | Idle, processed, and failed worker cycles |
| `verigate_notification_provider_requests_total` | FCM/APNs outcomes |
| `verigate_notification_provider_duration_seconds` | Provider latency histogram |
| `verigate_notification_queue_depth` | Pending and leased recipient deliveries |
| `verigate_notification_queue_oldest_age_seconds` | Age of oldest unleased delivery |
| `verigate_notification_expired_leases` | Processing leases that need recovery |
| `verigate_notification_permanent_failures` | Terminal delivery failures |
| `verigate_notification_worker_heartbeat_age_seconds` | Age of newest worker heartbeat |
| `verigate_process_resident_memory_bytes`, `_heap_used_bytes` | Process memory |
| `verigate_event_loop_delay_seconds` | Event-loop delay at p99 |

Metrics deliberately exclude event IDs, user IDs, request IDs, URLs, device
tokens, emails, and provider error messages.

## Elevated HTTP failures

Page the API operator when 5xx responses exceed 5% with at least 20 requests
over five minutes. Confirm `/ready`, inspect status-class and route-group
metrics, then use support references to correlate safe logs. Escalate a
confirmed customer-impacting failure using [incident response](incident-response.md).

## Request latency

Page when HTTP p99 exceeds 2.5 seconds for ten minutes. Check database pool
waiting, query timeouts, queue contention, event-loop delay, and dependency
health before increasing capacity.

## Database pool pressure

Page when `verigate_database_pool_waiting` remains above zero for five minutes.
Do not increase pool size until provider connection limits and slow/blocked
queries have been identified.

## Database query timeouts

Page when more than three classified query timeouts occur in five minutes.
Preserve request/correlation references, inspect database locks and query plans,
and treat repeated timeouts as an availability incident.

## Worker heartbeat stale

Page when heartbeat age exceeds 45 seconds for two minutes. Confirm that the
backend process is running, `/ready` is healthy, migrations are current, and
the worker is not repeatedly restarting. Do not enqueue test notifications in
production merely to create a heartbeat.

## Notification queue age

Page when the oldest queued delivery exceeds 300 seconds for ten minutes.
Compare queue depth, provider outcomes, worker heartbeat, and expired leases.

## Expired delivery leases

Page when any expired lease remains for five minutes. Verify that another
worker can reclaim it and that attempts are not duplicated.

## Permanent delivery failures

Create a ticket when permanent failures increase by more than ten in ten
minutes; page when the growth affects multiple events or both providers. Error
codes may be retained, but provider response bodies and tokens must not be.

## Event-loop delay

Page when p99 event-loop delay exceeds 250 ms for five minutes. Inspect CPU,
memory, synchronous work, and request volume before restarting the service.

## Source alert contract

The machine-checked thresholds live in
`scripts/operations/alerts.json`. `npm run verify:operations-contracts`
rejects unsafe production console calls, missing runbook anchors, duplicate
alert IDs, or an incomplete administrative route inventory. Hosting-platform
alert rules must be reconciled with this file during final deployment
validation.
