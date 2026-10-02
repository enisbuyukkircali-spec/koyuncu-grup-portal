BEGIN;

-- Extend the Phase 2A-13 learning records in place. No second LMS or onboarding store.
ALTER TABLE training_courses
 ADD COLUMN IF NOT EXISTS requirement_type text NOT NULL DEFAULT 'COMPANY_MANDATORY' CHECK(requirement_type IN('LEGAL_MANDATORY','COMPANY_MANDATORY','MANAGER_ASSIGNED','OPTIONAL')),
 ADD COLUMN IF NOT EXISTS delivery_mode text NOT NULL DEFAULT 'SELF_PACED' CHECK(delivery_mode IN('SELF_PACED','LIVE_ONLINE','FACE_TO_FACE','HYBRID')),
 ADD COLUMN IF NOT EXISTS language_code text NOT NULL DEFAULT 'tr' CHECK(language_code IN('tr','en','other')),
 ADD COLUMN IF NOT EXISTS duration_minutes integer CHECK(duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 100000),
 ADD COLUMN IF NOT EXISTS validity_days integer CHECK(validity_days IS NULL OR validity_days BETWEEN 1 AND 36500),
 ADD COLUMN IF NOT EXISTS passing_score integer CHECK(passing_score IS NULL OR passing_score BETWEEN 0 AND 100),
 ADD COLUMN IF NOT EXISTS assessment jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(assessment)='array'),
 ADD COLUMN IF NOT EXISTS completion_rule text NOT NULL DEFAULT 'PROGRESS' CHECK(completion_rule IN('PROGRESS','PROGRESS_AND_ASSESSMENT','ATTENDANCE','ATTENDANCE_AND_ASSESSMENT')),
 ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS self_enrollment boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS provider_key text NOT NULL DEFAULT 'internal' CHECK(provider_key IN('internal','scorm','xapi','external_api')),
 ADD COLUMN IF NOT EXISTS provider_course_ref text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS provider_metadata jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(provider_metadata)='object'),
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE training_assignments
 ADD COLUMN IF NOT EXISTS enrollment_source text NOT NULL DEFAULT 'ADMIN' CHECK(enrollment_source IN('ADMIN','MANAGER','SELF','ORIENTATION')),
 ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 ADD COLUMN IF NOT EXISTS score integer CHECK(score IS NULL OR score BETWEEN 0 AND 100),
 ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0 CHECK(attempts>=0),
 ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
 ADD COLUMN IF NOT EXISTS provider_registration_ref text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS certificate_issuer text NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS certificate_number text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS training_sessions(
 id uuid PRIMARY KEY,course_id uuid NOT NULL REFERENCES training_courses,
 title text NOT NULL,starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 mode text NOT NULL CHECK(mode IN('LIVE_ONLINE','FACE_TO_FACE','HYBRID')),
 provider text NOT NULL DEFAULT 'OTHER' CHECK(provider IN('TEAMS','MEET','ZOOM','OTHER')),
 join_url text NOT NULL DEFAULT '',location_id uuid REFERENCES locations,venue text NOT NULL DEFAULT '',
 attendance_required boolean NOT NULL DEFAULT true,created_by uuid NOT NULL REFERENCES users,
 created_at timestamptz NOT NULL DEFAULT now(),cancelled_at timestamptz,
 CHECK(ends_at>starts_at),CHECK(join_url='' OR join_url ~* '^https://')
);
-- A Preview database may already contain the table from an interrupted/older
-- deployment. CREATE TABLE IF NOT EXISTS does not add columns to that table.
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
CREATE INDEX IF NOT EXISTS training_sessions_schedule ON training_sessions(starts_at,course_id) WHERE cancelled_at IS NULL;

CREATE TABLE IF NOT EXISTS training_session_participants(
 session_id uuid NOT NULL REFERENCES training_sessions,user_id uuid NOT NULL REFERENCES users,
 enrolled_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(session_id,user_id)
);
CREATE INDEX IF NOT EXISTS training_session_participant_user ON training_session_participants(user_id,session_id);

CREATE TABLE IF NOT EXISTS training_attendance(
 id uuid PRIMARY KEY,session_id uuid NOT NULL REFERENCES training_sessions,user_id uuid NOT NULL REFERENCES users,
 status text NOT NULL CHECK(status IN('PRESENT','ABSENT','EXCUSED')),
 checked_by uuid NOT NULL REFERENCES users,checked_at timestamptz NOT NULL DEFAULT now(),notes text NOT NULL DEFAULT '',
 UNIQUE(session_id,user_id)
);

-- Reuse the existing Phase 2A-13 onboarding checklist and task rows for orientation.
ALTER TABLE employee_checklists
 ADD COLUMN IF NOT EXISTS orientation_track text NOT NULL DEFAULT 'GENERAL' CHECK(orientation_track IN('GENERAL','COMPANY','DEPARTMENT','ROLE')),
 ADD COLUMN IF NOT EXISTS start_date date,
 ADD COLUMN IF NOT EXISTS buddy_id uuid REFERENCES users,
 ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments,
 ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units,
 ADD COLUMN IF NOT EXISTS job_title_id uuid REFERENCES job_titles;

ALTER TABLE employee_checklist_tasks
 ADD COLUMN IF NOT EXISTS step_kind text NOT NULL DEFAULT 'TASK' CHECK(step_kind IN('TASK','READ_ACKNOWLEDGEMENT','ASSET_ACCEPTANCE','TRAINING','DOCUMENT')),
 ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'FIRST_WEEK' CHECK(phase IN('FIRST_DAY','FIRST_WEEK','FIRST_MONTH')),
 ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 10000),
 ADD COLUMN IF NOT EXISTS required boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS training_course_id uuid REFERENCES training_courses,
 ADD COLUMN IF NOT EXISTS acknowledgement_kind text CHECK(acknowledgement_kind IS NULL OR acknowledgement_kind IN('announcements','documents')),
 ADD COLUMN IF NOT EXISTS acknowledgement_content_id uuid,
 ADD COLUMN IF NOT EXISTS acknowledgement_revision integer CHECK(acknowledgement_revision IS NULL OR acknowledgement_revision>0),
 ADD COLUMN IF NOT EXISTS asset_assignment_id uuid REFERENCES asset_assignments,
 ADD COLUMN IF NOT EXISTS asset_phase text CHECK(asset_phase IS NULL OR asset_phase IN('DELIVERY','RETURN')),
 ADD COLUMN IF NOT EXISTS resource_url text NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS orientation_user_steps ON employee_checklist_tasks(checklist_id,phase,position,id);
CREATE INDEX IF NOT EXISTS orientation_training_steps ON employee_checklist_tasks(training_course_id,checklist_id) WHERE step_kind='TRAINING' AND status='OPEN';

COMMIT;
