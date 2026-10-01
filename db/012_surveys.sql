BEGIN;
CREATE TABLE IF NOT EXISTS surveys(id uuid PRIMARY KEY,title text NOT NULL,description text NOT NULL DEFAULT '',anonymous boolean NOT NULL DEFAULT true,required boolean NOT NULL DEFAULT false,status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PUBLISHED','CLOSED')),starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,privacy_threshold integer NOT NULL DEFAULT 5 CHECK(privacy_threshold BETWEEN 5 AND 100),audience_all boolean NOT NULL,targets jsonb NOT NULL DEFAULT '[]',questions jsonb NOT NULL,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),CHECK(ends_at>starts_at));
CREATE TABLE IF NOT EXISTS survey_participation(survey_id uuid NOT NULL REFERENCES surveys,user_id uuid NOT NULL REFERENCES users,PRIMARY KEY(survey_id,user_id));
-- Anonymous answers have no user reference, participation reference or timestamp.
CREATE TABLE IF NOT EXISTS survey_responses(id uuid PRIMARY KEY,survey_id uuid NOT NULL REFERENCES surveys,user_id uuid REFERENCES users,answers jsonb NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS survey_named_once ON survey_responses(survey_id,user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS surveys_active ON surveys(status,starts_at,ends_at);
CREATE OR REPLACE FUNCTION survey_response_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'Survey response is immutable'; END IF;
 IF NOT EXISTS(SELECT 1 FROM surveys s WHERE s.id=NEW.survey_id AND s.status='PUBLISHED' AND now() BETWEEN s.starts_at AND s.ends_at AND (s.anonymous=(NEW.user_id IS NULL))) THEN RAISE EXCEPTION 'Invalid survey response'; END IF; RETURN NEW; END $$;
DROP TRIGGER IF EXISTS survey_response_guard ON survey_responses;
CREATE TRIGGER survey_response_guard BEFORE INSERT OR UPDATE OR DELETE ON survey_responses FOR EACH ROW EXECUTE FUNCTION survey_response_guard();
COMMIT;
