BEGIN;
CREATE TABLE IF NOT EXISTS training_categories(id uuid PRIMARY KEY,name text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true);
INSERT INTO training_categories(id,name) SELECT md5('academy-category-'||name)::uuid,name FROM (VALUES('Zorunlu Eğitimler'),('Oryantasyon'),('İş Sağlığı ve Güvenliği'),('KVKK'),('Bilgi Güvenliği'),('Siber Güvenlik'),('Microsoft Office'),('Excel'),('PowerPoint'),('Dijital Yetkinlikler'),('Yapay Zekâ'),('Satış'),('Müzakere'),('İtiraz Yönetimi'),('Müşteri Deneyimi'),('Müşteri Hizmetleri'),('Telefonda Etkili İletişim'),('Kriz Yönetimi'),('Liderlik'),('Yöneticilik'),('Ekip Yönetimi'),('Geri Bildirim'),('Performans Görüşmeleri'),('İletişim'),('Sunum Teknikleri'),('Problem Çözme'),('Zaman Yönetimi'),('Stres Yönetimi'),('Kişisel Gelişim'),('Yabancı Dil'),('İngilizce'),('Diğer'))v(name) ON CONFLICT DO NOTHING;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES training_categories;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS cover text;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 30 CHECK(duration_minutes BETWEEN 1 AND 100000);
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'TR';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS method text NOT NULL DEFAULT 'ONLINE_SELF_PACED' CHECK(method IN('ONLINE_SELF_PACED','LIVE_ONLINE','FACE_TO_FACE','HYBRID'));
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS obligation text NOT NULL DEFAULT 'OPTIONAL' CHECK(obligation IN('LEGAL','COMPANY','MANAGER','OPTIONAL'));
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'INTERNAL';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'TEXT' CHECK(content_type IN('TEXT','LINK','VIDEO','SCORM','EXTERNAL_LMS'));
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS external_content_id text NOT NULL DEFAULT '';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS launch_url text NOT NULL DEFAULT '';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS package_reference text NOT NULL DEFAULT '';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS requirements jsonb NOT NULL DEFAULT '{"content":false,"exam":false,"attendance":false}';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS exam jsonb NOT NULL DEFAULT '[]';
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS passing_score integer NOT NULL DEFAULT 70 CHECK(passing_score BETWEEN 0 AND 100);
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS attempt_limit integer NOT NULL DEFAULT 3 CHECK(attempt_limit BETWEEN 1 AND 20);
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS certificate_available boolean NOT NULL DEFAULT false;
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS validity_months integer CHECK(validity_months BETWEEN 1 AND 120);
ALTER TABLE training_courses ADD COLUMN IF NOT EXISTS repeat_months integer CHECK(repeat_months BETWEEN 1 AND 120);
ALTER TABLE training_assignments DROP CONSTRAINT IF EXISTS training_assignments_status_check;
ALTER TABLE training_assignments ADD CONSTRAINT training_assignments_status_check CHECK(status IN('ASSIGNED','IN_PROGRESS','COMPLETED','FAILED','CANCELLED'));
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS starts_on date NOT NULL DEFAULT current_date;
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100);
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS content_completed_at timestamptz;
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS score integer CHECK(score BETWEEN 0 AND 100);
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS obligation text NOT NULL DEFAULT 'COMPANY' CHECK(obligation IN('LEGAL','COMPANY','MANAGER','OPTIONAL'));
ALTER TABLE training_assignments ADD COLUMN IF NOT EXISTS learning_snapshot jsonb NOT NULL DEFAULT '{}';
CREATE TABLE IF NOT EXISTS training_sessions(id uuid PRIMARY KEY,course_id uuid NOT NULL REFERENCES training_courses,title text NOT NULL,start_at timestamptz NOT NULL,end_at timestamptz NOT NULL,instructor text NOT NULL,platform text NOT NULL DEFAULT '',meeting_url text NOT NULL DEFAULT '',location_id uuid REFERENCES locations,venue text NOT NULL DEFAULT '',capacity integer CHECK(capacity>0),cancelled boolean NOT NULL DEFAULT false,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),CHECK(end_at>start_at));
CREATE TABLE IF NOT EXISTS training_session_participants(session_id uuid NOT NULL REFERENCES training_sessions,assignment_id uuid NOT NULL REFERENCES training_assignments,attendance text NOT NULL DEFAULT 'PENDING' CHECK(attendance IN('PENDING','ATTENDED','ABSENT','LATE','EXCUSED')),recorded_by uuid REFERENCES users,recorded_at timestamptz,PRIMARY KEY(session_id,assignment_id));
CREATE TABLE IF NOT EXISTS training_attempts(id uuid PRIMARY KEY,assignment_id uuid NOT NULL REFERENCES training_assignments,attempt integer NOT NULL,score integer NOT NULL CHECK(score BETWEEN 0 AND 100),answers jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(assignment_id,attempt));
CREATE TABLE IF NOT EXISTS training_certificates(id uuid PRIMARY KEY,assignment_id uuid NOT NULL REFERENCES training_assignments,kind text NOT NULL CHECK(kind IN('CERTIFICATE','ATTENDANCE','TRAINING')),issued_on date NOT NULL,valid_until date,reference text NOT NULL DEFAULT '',file jsonb NOT NULL,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),CHECK(valid_until IS NULL OR valid_until>=issued_on));
CREATE TABLE IF NOT EXISTS development_plans(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users,manager_id uuid REFERENCES users,title text NOT NULL,period text NOT NULL,goals text NOT NULL DEFAULT '',notes text NOT NULL DEFAULT '',created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS development_plan_items(plan_id uuid NOT NULL REFERENCES development_plans,assignment_id uuid NOT NULL REFERENCES training_assignments,PRIMARY KEY(plan_id,assignment_id));
CREATE TABLE IF NOT EXISTS orientation_templates(id uuid PRIMARY KEY,title text NOT NULL,layer text NOT NULL CHECK(layer IN('GROUP','COMPANY','DEPARTMENT','UNIT','ROLE')),target_id text,steps jsonb NOT NULL,active boolean NOT NULL DEFAULT true,updated_by uuid NOT NULL REFERENCES users,updated_at timestamptz NOT NULL DEFAULT now(),CHECK((layer='GROUP')=(target_id IS NULL)));
CREATE TABLE IF NOT EXISTS employee_orientations(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users,title text NOT NULL,buddy_id uuid REFERENCES users,template_ids uuid[] NOT NULL DEFAULT '{}',starts_on date NOT NULL,status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','COMPLETED')),completed_at timestamptz,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),CHECK((status='COMPLETED')=(completed_at IS NOT NULL)),CHECK(buddy_id IS DISTINCT FROM user_id));
CREATE UNIQUE INDEX IF NOT EXISTS orientation_one_active ON employee_orientations(user_id) WHERE status='ACTIVE';
CREATE TABLE IF NOT EXISTS employee_orientation_steps(id uuid PRIMARY KEY,orientation_id uuid NOT NULL REFERENCES employee_orientations,title text NOT NULL,description text NOT NULL DEFAULT '',stage text NOT NULL CHECK(stage IN('DAY','WEEK','MONTH')),kind text NOT NULL CHECK(kind IN('INFO','VIDEO','DOCUMENT','ACK','TRAINING','SESSION','TASK','PERSON','ASSET','LINK')),reference_id uuid,reference_kind text,url text NOT NULL DEFAULT '',responsible_id uuid REFERENCES users,due_date date NOT NULL,completed_at timestamptz,completed_by uuid REFERENCES users,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS academy_catalog ON training_courses(active,category_id,method,obligation);
CREATE INDEX IF NOT EXISTS academy_sessions_time ON training_sessions(start_at,end_at) WHERE NOT cancelled;
CREATE INDEX IF NOT EXISTS academy_participant_assignment ON training_session_participants(assignment_id);
CREATE INDEX IF NOT EXISTS academy_certificate_assignment ON training_certificates(assignment_id,valid_until);
CREATE INDEX IF NOT EXISTS development_plan_user ON development_plans(user_id,created_at);
CREATE INDEX IF NOT EXISTS orientation_user ON employee_orientations(user_id,created_at);
CREATE INDEX IF NOT EXISTS orientation_steps_parent ON employee_orientation_steps(orientation_id,due_date);
DROP TRIGGER IF EXISTS training_attempt_immutable ON training_attempts;
CREATE TRIGGER training_attempt_immutable BEFORE UPDATE OR DELETE ON training_attempts FOR EACH ROW EXECUTE FUNCTION workflow_immutable();
DROP TRIGGER IF EXISTS training_certificate_immutable ON training_certificates;
CREATE TRIGGER training_certificate_immutable BEFORE UPDATE OR DELETE ON training_certificates FOR EACH ROW EXECUTE FUNCTION workflow_immutable();
CREATE OR REPLACE FUNCTION academy_completion_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD.status='COMPLETED' AND (NEW.status,NEW.completed_at,NEW.course_id,NEW.user_id,NEW.learning_snapshot,NEW.score,NEW.content_completed_at) IS DISTINCT FROM (OLD.status,OLD.completed_at,OLD.course_id,OLD.user_id,OLD.learning_snapshot,OLD.score,OLD.content_completed_at) THEN RAISE EXCEPTION 'Training completion history immutable' USING ERRCODE='23514';END IF;RETURN NEW;END $$;
DROP TRIGGER IF EXISTS academy_completion_guard ON training_assignments;
CREATE TRIGGER academy_completion_guard BEFORE UPDATE OR DELETE ON training_assignments FOR EACH ROW EXECUTE FUNCTION academy_completion_guard();

CREATE OR REPLACE VIEW orientation_step_progress AS SELECT s.*,o.user_id,CASE
WHEN s.kind='TRAINING' THEN COALESCE((SELECT t.status='COMPLETED' AND (t.valid_until IS NULL OR t.valid_until>=current_date) FROM training_assignments t WHERE t.course_id=s.reference_id AND t.user_id=o.user_id ORDER BY t.assigned_at DESC,t.id DESC LIMIT 1),false)
WHEN s.kind IN('ACK','DOCUMENT') THEN EXISTS(SELECT 1 FROM content_acknowledgements ack WHERE ack.user_id=o.user_id AND ack.content_id=s.reference_id AND ack.kind=s.reference_kind AND ack.revision=CASE WHEN s.reference_kind='documents' THEN (SELECT acknowledgement_revision FROM documents WHERE id=s.reference_id) ELSE (SELECT acknowledgement_revision FROM announcements WHERE id=s.reference_id) END)
WHEN s.kind='ASSET' THEN EXISTS(SELECT 1 FROM asset_assignments aa WHERE aa.user_id=o.user_id AND aa.returned_at IS NULL AND (s.reference_id IS NULL OR aa.id=s.reference_id)) AND NOT EXISTS(SELECT 1 FROM asset_assignments aa WHERE aa.user_id=o.user_id AND aa.returned_at IS NULL AND (s.reference_id IS NULL OR aa.id=s.reference_id) AND NOT EXISTS(SELECT 1 FROM assignment_acceptances ac WHERE ac.assignment_id=aa.id AND ac.user_id=o.user_id AND ac.phase='DELIVERY'))
WHEN s.kind='SESSION' THEN EXISTS(SELECT 1 FROM training_session_participants sp JOIN training_assignments t ON t.id=sp.assignment_id JOIN training_sessions ts ON ts.id=sp.session_id WHERE sp.session_id=s.reference_id AND t.user_id=o.user_id AND sp.attendance='ATTENDED' AND ts.end_at<=now() AND NOT ts.cancelled)
ELSE s.completed_at IS NOT NULL END AS done FROM employee_orientation_steps s JOIN employee_orientations o ON o.id=s.orientation_id;
COMMIT;
