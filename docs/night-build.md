# Night build checkpoints

## Phase 2A-10
- Reuses workflow_notifications; atomic insert trigger creates one email_outbox row per notification, including set-based content fanout. No historical backfill/mail spam.
- EmailProvider contract defaults DISABLED, outbox status ProviderDisabled. No outbound provider/network call or new secret/config required. Delivery/retry worker is deliberately not installed.
- News and explicit new-joiner/promotion/organization announcement publication reuse existing audience/RBAC. Birthday self-notification is date-only, Istanbul, showBirthday-respecting, on-demand when portal bell mounts (no scheduled delivery).
- Announcement pinning and existing priority/expiry retained. Announcement/document read acknowledgements bind to immutable content revision snapshots and current user, preserving previous acceptance history. Content changes require rereading. Management report uses current eligible audience; first 100 names and full aggregate totals.
- Test fixtures were updated to use General category for normal announcement no-spam assertion: new-joiner categories now intentionally notify under this phase.
- Storage remains existing inline Neon storage. No email credentials, production changes, external integrations, or paid services.

## Phase 2A-11
- Existing requests/type routing retained. Additional accepted/assigned/waiting states, need urgency/date, acceptance fields, deadline history, completion timestamp, rejection reason.
- SLA per request type/priority: hours or whole business days, weekends excluded in Istanbul, no public-holiday integration. SLA target snapshotted on creation; manual estimate is separate.
- Ticket tasks are parent-scoped. Employee own-task list exposes only assigned task fields and ticket number, not another employee's private ticket description/attachments. No independent project framework.

- Recovery: fixed nested SQL quote syntax without weakening TypeScript. Assignment history now records ASSIGNED; task assignment notifies only its assignee and routes to own tasks.

## Phase 2A-12
- Surveys reuse users, organization/role audience semantics, RBAC and Notification V2/outbox; no scheduler/provider.
- Anonymous participation deduplication is separate from randomly identified answers. Answers have no user, participation link, timestamp or demographic snapshot. Results expose aggregates, never response rows/identities. All anonymous results including text are hidden below configurable minimum 5 responses; no small-cohort breakdown endpoint.
- Published survey questions/audience/privacy are frozen. Submission validates each answer and atomically records participation plus answers; global transaction lock and primary key prevent duplicates. Responses immutable in PostgreSQL.
- Catalog/admin lists paginated, aggregate participation counts, no per-user result query loop. Draft editor, seven question types, date window, manual publish/close, target audience picker and result summaries.
