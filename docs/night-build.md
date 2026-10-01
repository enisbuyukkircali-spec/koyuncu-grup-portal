# Night build checkpoints

## Phase 2A-10
- Reuses workflow_notifications; atomic insert trigger creates one email_outbox row per notification, including set-based content fanout. No historical backfill/mail spam.
- EmailProvider contract defaults DISABLED, outbox status ProviderDisabled. No outbound provider/network call or new secret/config required. Delivery/retry worker is deliberately not installed.
- News and explicit new-joiner/promotion/organization announcement publication reuse existing audience/RBAC. Birthday self-notification is date-only, Istanbul, showBirthday-respecting, on-demand when portal bell mounts (no scheduled delivery).
- Announcement pinning and existing priority/expiry retained. Announcement/document read acknowledgements bind to immutable content revision snapshots and current user, preserving previous acceptance history. Content changes require rereading. Management report uses current eligible audience; first 100 names and full aggregate totals.
- Test fixtures were updated to use General category for normal announcement no-spam assertion: new-joiner categories now intentionally notify under this phase.
- Storage remains existing inline Neon storage. No email credentials, production changes, external integrations, or paid services.
