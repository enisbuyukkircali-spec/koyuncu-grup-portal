BEGIN;
CREATE TABLE IF NOT EXISTS email_outbox(
 id uuid PRIMARY KEY,notification_id uuid NOT NULL UNIQUE REFERENCES workflow_notifications(id),
 recipient_id uuid NOT NULL REFERENCES users(id),recipient text NOT NULL,subject text NOT NULL,
 event_type text NOT NULL,payload jsonb NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'ProviderDisabled' CHECK(status IN('Pending','Sent','Failed','Cancelled','ProviderDisabled')),
 created_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz,failure_reason text,
 CHECK(status<>'Sent' OR sent_at IS NOT NULL));
CREATE INDEX IF NOT EXISTS email_outbox_status_created ON email_outbox(status,created_at);
CREATE INDEX IF NOT EXISTS email_outbox_recipient ON email_outbox(recipient_id,created_at DESC);
CREATE OR REPLACE FUNCTION notification_outbox_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO email_outbox(id,notification_id,recipient_id,recipient,subject,event_type,payload)
 SELECT NEW.id,NEW.id,NEW.recipient_id,u.email,NEW.title,NEW.event,
 jsonb_build_object('notificationId',NEW.id,'title',NEW.title,'message',NEW.message,'link',NEW.link)
 FROM users u WHERE u.id=NEW.recipient_id ON CONFLICT(notification_id) DO NOTHING;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS notification_outbox ON workflow_notifications;
CREATE TRIGGER notification_outbox AFTER INSERT ON workflow_notifications FOR EACH ROW EXECUTE FUNCTION notification_outbox_insert();
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS acknowledgement_required boolean NOT NULL DEFAULT false;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS acknowledgement_revision integer NOT NULL DEFAULT 1 CHECK(acknowledgement_revision>0);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS acknowledgement_required boolean NOT NULL DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS acknowledgement_revision integer NOT NULL DEFAULT 1 CHECK(acknowledgement_revision>0);
CREATE TABLE IF NOT EXISTS content_revisions(
 kind text NOT NULL CHECK(kind IN('announcements','documents')),content_id uuid NOT NULL,revision integer NOT NULL,
 snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(kind,content_id,revision));
CREATE TABLE IF NOT EXISTS content_acknowledgements(
 kind text NOT NULL,content_id uuid NOT NULL,revision integer NOT NULL,user_id uuid NOT NULL REFERENCES users,
 acknowledged_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(kind,content_id,revision,user_id),
 FOREIGN KEY(kind,content_id,revision) REFERENCES content_revisions(kind,content_id,revision));
CREATE INDEX IF NOT EXISTS content_acknowledgements_user ON content_acknowledgements(user_id,acknowledged_at DESC);
CREATE OR REPLACE FUNCTION content_revision_before() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF (to_jsonb(NEW)-ARRAY['updated_at','pinned','status','acknowledgement_revision']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['updated_at','pinned','status','acknowledgement_revision']) THEN
 NEW.acknowledgement_revision=OLD.acknowledgement_revision+1;
 ELSE NEW.acknowledgement_revision=OLD.acknowledgement_revision; END IF;RETURN NEW;END $$;
CREATE OR REPLACE FUNCTION content_revision_after() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 INSERT INTO content_revisions(kind,content_id,revision,snapshot) VALUES(TG_TABLE_NAME,NEW.id,NEW.acknowledgement_revision,to_jsonb(NEW)) ON CONFLICT DO NOTHING;RETURN NEW;END $$;
DROP TRIGGER IF EXISTS content_revision_before ON announcements;
CREATE TRIGGER content_revision_before BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION content_revision_before();
DROP TRIGGER IF EXISTS content_revision_after ON announcements;
CREATE TRIGGER content_revision_after AFTER INSERT OR UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION content_revision_after();
DROP TRIGGER IF EXISTS content_revision_before ON documents;
CREATE TRIGGER content_revision_before BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION content_revision_before();
DROP TRIGGER IF EXISTS content_revision_after ON documents;
CREATE TRIGGER content_revision_after AFTER INSERT OR UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION content_revision_after();
INSERT INTO content_revisions SELECT 'announcements',id,acknowledgement_revision,to_jsonb(c),now() FROM announcements c ON CONFLICT DO NOTHING;
INSERT INTO content_revisions SELECT 'documents',id,acknowledgement_revision,to_jsonb(c),now() FROM documents c ON CONFLICT DO NOTHING;
CREATE INDEX IF NOT EXISTS announcements_pinned_published ON announcements(status,pinned DESC,priority DESC,publish_at DESC);
CREATE OR REPLACE FUNCTION protect_content_revision() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Content revision history is immutable'; END $$;
DROP TRIGGER IF EXISTS protect_content_revision ON content_revisions;
CREATE TRIGGER protect_content_revision BEFORE UPDATE OR DELETE ON content_revisions FOR EACH ROW EXECUTE FUNCTION protect_content_revision();
COMMIT;
