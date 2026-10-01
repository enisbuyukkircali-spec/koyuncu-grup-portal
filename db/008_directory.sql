BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_in_directory boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_birthday boolean NOT NULL DEFAULT false;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS backup_user_id uuid REFERENCES users(id);
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='leave_requests'::regclass AND conname='leave_backup_not_self') THEN ALTER TABLE leave_requests ADD CONSTRAINT leave_backup_not_self CHECK(backup_user_id IS DISTINCT FROM owner_id); END IF; END $$;
CREATE OR REPLACE FUNCTION portal_fold(value text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT lower(translate(coalesce(value,''),'ÇĞİIÖŞÜçğıöşü','cgiiosucgiosu')) $$;
CREATE INDEX IF NOT EXISTS directory_visible_idx ON users(company_id,location_id,department_id,unit_id,first_name,id) WHERE show_in_directory AND status IN('ACTIVE','ON_LEAVE') AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS directory_name_search_idx ON users USING gin(portal_fold(first_name||' '||last_name) gin_trgm_ops) WHERE show_in_directory AND status IN('ACTIVE','ON_LEAVE') AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS directory_contact_search_idx ON users USING gin(portal_fold(email||' '||coalesce(extension,'')) gin_trgm_ops) WHERE show_in_directory AND status IN('ACTIVE','ON_LEAVE') AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS directory_birthday_idx ON users((extract(month FROM birth_date)),(extract(day FROM birth_date))) WHERE show_birthday AND show_in_directory AND status IN('ACTIVE','ON_LEAVE') AND archived_at IS NULL;
CREATE INDEX IF NOT EXISTS directory_absence_idx ON leave_requests(owner_id,start_date,end_date) WHERE status='APPROVED';
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['companies','locations','departments','units','job_titles'] LOOP
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING gin(portal_fold(name) gin_trgm_ops)',t||'_directory_search_idx',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['announcements','news','events','documents'] LOOP
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I USING gin(portal_fold(title||'' ''||summary) gin_trgm_ops) WHERE status=''PUBLISHED''',t||'_portal_search_idx',t);
 END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS requests_own_search_idx ON requests USING gin(portal_fold(subject) gin_trgm_ops);
INSERT INTO announcements_categories(id,name) SELECT md5('portal-category-'||name)::uuid,name FROM (VALUES('Aramıza Katılanlar'),('Terfi & Yeni Görev'),('Organizasyon Değişikliği'))v(name) ON CONFLICT DO NOTHING;
COMMIT;
