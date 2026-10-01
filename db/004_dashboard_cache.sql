-- Shared last-good public provider data; no user/session secrets.
CREATE TABLE IF NOT EXISTS dashboard_data_cache (
 cache_key text PRIMARY KEY,
 payload jsonb,
 fetched_at timestamptz,
 fresh_until timestamptz NOT NULL DEFAULT '-infinity',
 retry_at timestamptz NOT NULL DEFAULT '-infinity',
 lease_until timestamptz NOT NULL DEFAULT '-infinity',
 lease_owner uuid
);
