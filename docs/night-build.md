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

## Phase 2A-13
- Onboarding/offboarding checklists reuse User/Department and own-task view. Server ownership/department gates task completion; closing with open tasks/assets requires explicit offboarding.override and reason retained in existing AuditLog details.
- HR-only departure record; no automatic account closure. Training courses, audience assignment, immutable completed cycles, protected certificates/validity dates. These are the foundation Phase 2A-17 extends, not a parallel LMS.
- Existing asset assignments snapshot category delivery/return requirements. Immutable handover forms retain separate delivery/return photos, documents, condition and accessory checklists. Owner-only acceptance stores form version/timestamp; no qualified electronic-signature claim. Required return acceptance blocks final return.
- Delivery acceptance is collected after assignment creation (employee must be able to see the record first); pending acceptance remains visible. Inventory service records append only.
- Storage uses existing inline PostgreSQL approach: individual file maximum 200 KB, handover attachments combined maximum 220 KB. Large original photos require resizing; no paid storage/provider added.
- New permissions: training.view_own/manage, onboarding.manage, offboarding.manage/override, departures.manage, people_tasks.view_own/update_own. Existing inventory permissions reused.

## Phase 2A-14
- Separate fleet vehicles, immutable allocations/returns and service records; unique active allocation and database consistency guard. Protected documents, scoped admin actions, real aggregate dashboard.
- Checkpoint a33dafa; 334 tests, typecheck/build and Preview passed.

## Phase 2A-15
- HR, inventory, tickets/SLA, surveys, training, fleet and people reports aggregate existing sources. Same authorization for screen and CSV; spreadsheet formula escaping. Anonymous survey minimum-response suppression retained. No reporting database.
- Checkpoint dba97b3; 341 tests, typecheck/build and Preview passed. No migration.

## Phase 2A-16
- Organization projection reuses manager_user_id and directory visibility. Company public contact fields, expertise search, organization changes in existing AuditLog details, due-date projection and personal summary. No scheduler or second source of truth.
- Checkpoint 0d1c209; 348 tests, typecheck/build and Preview passed.

## Phase 2A-17
- Extends training_courses/training_assignments from 013. Migration 017 adds category metadata, immutable assignment snapshots, exam attempts, sessions/attendance, certificates, development plans and orientation templates/steps.
- Four delivery methods and four obligation types. Employee self-enroll only optional courses; manager assignment/development/orientation writes require direct current reporting relationship. HR audience assignment reuses organization/role targeting and notification/outbox foundation.
- Server grading, bounded attempts and all-required completion conditions. Completed assignment snapshots and attempts remain immutable; renewed training creates another cycle. External SCORM/LMS content cannot be manually declared complete while provider is unconfigured.
- Existing calendar query projects assigned training sessions. Orientation combines group/company/department/unit/role templates, buddy and manager tasks. Progress projects current training completion, current acknowledgement revision and assignment acceptance; no duplicate business records.
- Catalog/assignment lists paginated at 20, bounded dropdowns, aggregate reports. Dashboard design unchanged. Existing session cache retained; no additional authentication lookups in read services.
- 368 tests pass including 20 Academy integration tests; typecheck and production build pass. Prior agenda test was narrowed to auth session table references because training_sessions is intentionally part of the single agenda query.
- No new environment variables. Email and LMS providers remain unconfigured. No cron, production/domain changes or paid services.
- Limits: inline certificate/image files remain 200 KB. Content completion is an employee acknowledgement, not a legal certification or SCORM runtime. Repeat period is metadata; no automated recurring assignment job. Live links are manually entered; attendance is recorded by authorized staff.
