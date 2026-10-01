BEGIN;
CREATE TABLE IF NOT EXISTS announcements_categories(id uuid PRIMARY KEY,name text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true);
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-0')::uuid,'Genel') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-1')::uuid,'İnsan Kaynakları') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-2')::uuid,'Bilgi Teknolojileri') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-3')::uuid,'Finans') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-4')::uuid,'Operasyon') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-5')::uuid,'Kurumsal İletişim') ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('announcements-category-6')::uuid,'Bilgi Güvenliği') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS news_categories(id uuid PRIMARY KEY,name text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true);
INSERT INTO news_categories(id,name) VALUES(md5('news-category-0')::uuid,'Genel') ON CONFLICT DO NOTHING;
INSERT INTO news_categories(id,name) VALUES(md5('news-category-1')::uuid,'Kurumsal') ON CONFLICT DO NOTHING;
INSERT INTO news_categories(id,name) VALUES(md5('news-category-2')::uuid,'Sürdürülebilirlik') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS documents_categories(id uuid PRIMARY KEY,name text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true);
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-0')::uuid,'İnsan Kaynakları') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-1')::uuid,'Bilgi Teknolojileri') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-2')::uuid,'Finans') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-3')::uuid,'Şirket Politikaları') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-4')::uuid,'Prosedürler') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-5')::uuid,'Formlar') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-6')::uuid,'KVKK') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-7')::uuid,'Bilgi Güvenliği') ON CONFLICT DO NOTHING;
INSERT INTO documents_categories(id,name) VALUES(md5('documents-category-8')::uuid,'Kurumsal') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS announcements(
 id uuid PRIMARY KEY,title text NOT NULL,slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),category_id uuid REFERENCES announcements_categories,
 summary text NOT NULL DEFAULT '',body text NOT NULL DEFAULT '',cover text,thumbnail text,
 author_id uuid NOT NULL REFERENCES users,priority integer NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 2),
 publish_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PUBLISHED','ARCHIVED','CANCELLED','COMPLETED')),
 audience_all boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at IS NULL OR expires_at>publish_at));
 CREATE INDEX IF NOT EXISTS announcements_published ON announcements(status,publish_at DESC);
 CREATE INDEX IF NOT EXISTS announcements_author ON announcements(author_id);
 CREATE TABLE IF NOT EXISTS announcements_audience(
 id uuid PRIMARY KEY,content_id uuid NOT NULL REFERENCES announcements ON DELETE CASCADE,
 company_id uuid REFERENCES companies,location_id uuid REFERENCES locations,department_id uuid REFERENCES departments,
 unit_id uuid REFERENCES units,role_id text REFERENCES roles,user_id uuid REFERENCES users,
 CHECK(num_nonnulls(company_id,location_id,department_id,unit_id,role_id,user_id)=1));
 CREATE INDEX IF NOT EXISTS announcements_audience_content ON announcements_audience(content_id);
 
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_company_id ON announcements_audience(content_id,company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_location_id ON announcements_audience(content_id,location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_department_id ON announcements_audience(content_id,department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_unit_id ON announcements_audience(content_id,unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_role_id ON announcements_audience(content_id,role_id) WHERE role_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_audience_user_id ON announcements_audience(content_id,user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS announcements_category ON announcements(category_id);
CREATE TABLE IF NOT EXISTS news(
 id uuid PRIMARY KEY,title text NOT NULL,slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),category_id uuid REFERENCES news_categories,
 summary text NOT NULL DEFAULT '',body text NOT NULL DEFAULT '',cover text,thumbnail text,
 author_id uuid NOT NULL REFERENCES users,priority integer NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 2),
 publish_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PUBLISHED','ARCHIVED','CANCELLED','COMPLETED')),
 audience_all boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at IS NULL OR expires_at>publish_at));
 CREATE INDEX IF NOT EXISTS news_published ON news(status,publish_at DESC);
 CREATE INDEX IF NOT EXISTS news_author ON news(author_id);
 CREATE TABLE IF NOT EXISTS news_audience(
 id uuid PRIMARY KEY,content_id uuid NOT NULL REFERENCES news ON DELETE CASCADE,
 company_id uuid REFERENCES companies,location_id uuid REFERENCES locations,department_id uuid REFERENCES departments,
 unit_id uuid REFERENCES units,role_id text REFERENCES roles,user_id uuid REFERENCES users,
 CHECK(num_nonnulls(company_id,location_id,department_id,unit_id,role_id,user_id)=1));
 CREATE INDEX IF NOT EXISTS news_audience_content ON news_audience(content_id);
 
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_company_id ON news_audience(content_id,company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_location_id ON news_audience(content_id,location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_department_id ON news_audience(content_id,department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_unit_id ON news_audience(content_id,unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_role_id ON news_audience(content_id,role_id) WHERE role_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_audience_user_id ON news_audience(content_id,user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS news_category ON news(category_id);
CREATE TABLE IF NOT EXISTS events(
 id uuid PRIMARY KEY,title text NOT NULL,slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 summary text NOT NULL DEFAULT '',body text NOT NULL DEFAULT '',cover text,thumbnail text,
 author_id uuid NOT NULL REFERENCES users,priority integer NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 2),
 publish_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PUBLISHED','ARCHIVED','CANCELLED','COMPLETED')),
 audience_all boolean NOT NULL DEFAULT true,event_start timestamptz NOT NULL,event_end timestamptz NOT NULL,venue text NOT NULL DEFAULT '',online boolean NOT NULL DEFAULT false,online_url text NOT NULL DEFAULT '',capacity integer CHECK(capacity>0),participation_required boolean NOT NULL DEFAULT true,rsvp_deadline timestamptz,CHECK(event_end>event_start),CHECK(rsvp_deadline IS NULL OR rsvp_deadline<=event_start),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at IS NULL OR expires_at>publish_at));
 CREATE INDEX IF NOT EXISTS events_published ON events(status,publish_at DESC);
 CREATE INDEX IF NOT EXISTS events_author ON events(author_id);
 CREATE TABLE IF NOT EXISTS events_audience(
 id uuid PRIMARY KEY,content_id uuid NOT NULL REFERENCES events ON DELETE CASCADE,
 company_id uuid REFERENCES companies,location_id uuid REFERENCES locations,department_id uuid REFERENCES departments,
 unit_id uuid REFERENCES units,role_id text REFERENCES roles,user_id uuid REFERENCES users,
 CHECK(num_nonnulls(company_id,location_id,department_id,unit_id,role_id,user_id)=1));
 CREATE INDEX IF NOT EXISTS events_audience_content ON events_audience(content_id);
 
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_company_id ON events_audience(content_id,company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_location_id ON events_audience(content_id,location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_department_id ON events_audience(content_id,department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_unit_id ON events_audience(content_id,unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_role_id ON events_audience(content_id,role_id) WHERE role_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_audience_user_id ON events_audience(content_id,user_id) WHERE user_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS documents(
 id uuid PRIMARY KEY,title text NOT NULL,slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),category_id uuid REFERENCES documents_categories,
 summary text NOT NULL DEFAULT '',body text NOT NULL DEFAULT '',cover text,thumbnail text,
 author_id uuid NOT NULL REFERENCES users,priority integer NOT NULL DEFAULT 0 CHECK(priority BETWEEN 0 AND 2),
 publish_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','PUBLISHED','ARCHIVED','CANCELLED','COMPLETED')),
 audience_all boolean NOT NULL DEFAULT true,version text NOT NULL DEFAULT '1.0',file_name text NOT NULL,file_type text NOT NULL CHECK(file_type IN('application/pdf','text/plain')),file_data text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(expires_at IS NULL OR expires_at>publish_at));
 CREATE INDEX IF NOT EXISTS documents_published ON documents(status,publish_at DESC);
 CREATE INDEX IF NOT EXISTS documents_author ON documents(author_id);
 CREATE TABLE IF NOT EXISTS documents_audience(
 id uuid PRIMARY KEY,content_id uuid NOT NULL REFERENCES documents ON DELETE CASCADE,
 company_id uuid REFERENCES companies,location_id uuid REFERENCES locations,department_id uuid REFERENCES departments,
 unit_id uuid REFERENCES units,role_id text REFERENCES roles,user_id uuid REFERENCES users,
 CHECK(num_nonnulls(company_id,location_id,department_id,unit_id,role_id,user_id)=1));
 CREATE INDEX IF NOT EXISTS documents_audience_content ON documents_audience(content_id);
 
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_company_id ON documents_audience(content_id,company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_location_id ON documents_audience(content_id,location_id) WHERE location_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_department_id ON documents_audience(content_id,department_id) WHERE department_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_unit_id ON documents_audience(content_id,unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_role_id ON documents_audience(content_id,role_id) WHERE role_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS documents_audience_user_id ON documents_audience(content_id,user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS events_start ON events(event_start) WHERE status='PUBLISHED';
CREATE TABLE IF NOT EXISTS event_participants(event_id uuid NOT NULL REFERENCES events,user_id uuid NOT NULL REFERENCES users,attending boolean NOT NULL,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(event_id,user_id));
CREATE INDEX IF NOT EXISTS event_participant_user ON event_participants(user_id);
CREATE TABLE IF NOT EXISTS homepage_content(id integer PRIMARY KEY CHECK(id=1),settings jsonb NOT NULL CHECK(jsonb_typeof(settings)='object'),updated_by uuid REFERENCES users,updated_at timestamptz NOT NULL DEFAULT now());
COMMIT;
