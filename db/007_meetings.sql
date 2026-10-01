BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS meeting_rooms(
 id uuid PRIMARY KEY,name text NOT NULL,code text NOT NULL,location_id uuid NOT NULL REFERENCES locations(id),
 floor text NOT NULL DEFAULT '',capacity integer NOT NULL CHECK(capacity>0 AND capacity<=10000),description text NOT NULL DEFAULT '',image text,
 features jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(features)='array'),active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(location_id,code));
CREATE TABLE IF NOT EXISTS meeting_reservations(
 id uuid PRIMARY KEY,room_id uuid NOT NULL REFERENCES meeting_rooms(id),organizer_id uuid NOT NULL REFERENCES users(id),
 title text NOT NULL,description text NOT NULL DEFAULT '',start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','CANCELLED','COMPLETED')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(start_at<end_at));
CREATE INDEX IF NOT EXISTS meeting_room_location_idx ON meeting_rooms(location_id,active);
CREATE INDEX IF NOT EXISTS meeting_slot_idx ON meeting_reservations(room_id,start_at,end_at) WHERE status='ACTIVE';
CREATE INDEX IF NOT EXISTS meeting_owner_time_idx ON meeting_reservations(organizer_id,start_at DESC);
CREATE INDEX IF NOT EXISTS meeting_status_time_idx ON meeting_reservations(status,start_at);
CREATE INDEX IF NOT EXISTS agenda_event_participant_idx ON event_participants(user_id,event_id) WHERE attending;
CREATE INDEX IF NOT EXISTS agenda_leave_idx ON leave_requests(owner_id,start_date,end_date) WHERE status='APPROVED';
-- Native exclusion constraint protects concurrent writers, including direct SQL and
-- repeatable-read transactions. Adjacent half-open intervals remain valid.
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='meeting_reservations'::regclass AND conname='meeting_no_overlap') THEN
  ALTER TABLE meeting_reservations ADD CONSTRAINT meeting_no_overlap
  EXCLUDE USING gist(room_id WITH =,tstzrange(start_at,end_at,'[)') WITH &&) WHERE(status='ACTIVE');
 END IF;
END $$;
CREATE OR REPLACE FUNCTION protect_meeting_slot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Reservation history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.organizer_id<>OLD.organizer_id OR OLD.status<>'ACTIVE') THEN
  RAISE EXCEPTION 'Reservation history is immutable' USING ERRCODE='23514';
 END IF;
 IF NEW.status='ACTIVE' THEN
  IF NOT EXISTS(SELECT 1 FROM meeting_rooms r JOIN locations l ON l.id=r.location_id JOIN companies c ON c.id=l.company_id WHERE r.id=NEW.room_id AND r.active AND l.active AND l.archived_at IS NULL AND c.active AND c.archived_at IS NULL) THEN
   RAISE EXCEPTION 'Inactive room' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS meeting_slot_guard ON meeting_reservations;
CREATE TRIGGER meeting_slot_guard BEFORE INSERT OR UPDATE OR DELETE ON meeting_reservations FOR EACH ROW EXECUTE FUNCTION protect_meeting_slot();
COMMIT;
