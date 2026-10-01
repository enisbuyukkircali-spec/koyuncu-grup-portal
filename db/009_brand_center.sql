CREATE TABLE IF NOT EXISTS brand_categories(id uuid PRIMARY KEY,name text NOT NULL UNIQUE,active boolean NOT NULL DEFAULT true);
INSERT INTO brand_categories(id,name) SELECT md5('brand-category-'||name)::uuid,name FROM (VALUES('Koyuncu Grup Logoları'),('Şirket Logoları'),('PowerPoint Şablonları'),('E-posta İmza Şablonları'),('Antetli Kağıt & Doküman Şablonları'),('Kurumsal Sunumlar'),('Brandbook / Kurumsal Kimlik Kılavuzları'),('Onaylı Şirket Fotoğrafları'))v(name) ON CONFLICT DO NOTHING;
INSERT INTO announcements_categories(id,name) VALUES(md5('portal-category-İnsan & Organizasyon')::uuid,'İnsan & Organizasyon') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS brand_assets(id uuid PRIMARY KEY,title text NOT NULL,category_id uuid NOT NULL REFERENCES brand_categories,company_id uuid REFERENCES companies,audience_all boolean NOT NULL DEFAULT true,description text NOT NULL DEFAULT '',usage_note text NOT NULL DEFAULT '',tags text[] NOT NULL DEFAULT '{}',archived boolean NOT NULL DEFAULT false,created_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),CHECK(audience_all OR company_id IS NOT NULL));
CREATE TABLE IF NOT EXISTS brand_asset_versions(id uuid PRIMARY KEY,asset_id uuid NOT NULL REFERENCES brand_assets,version text NOT NULL,file_name text NOT NULL,file_type text NOT NULL,file_data text NOT NULL,file_size integer NOT NULL CHECK(file_size BETWEEN 1 AND 200000),thumbnail text,status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN('DRAFT','CURRENT','ARCHIVED')),uploaded_by uuid NOT NULL REFERENCES users,created_at timestamptz NOT NULL DEFAULT now(),published_at timestamptz,UNIQUE(asset_id,version));
CREATE UNIQUE INDEX IF NOT EXISTS brand_one_current ON brand_asset_versions(asset_id) WHERE status='CURRENT';
CREATE INDEX IF NOT EXISTS brand_category_company ON brand_assets(category_id,company_id) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS brand_title_search ON brand_assets USING gin(portal_fold(title) gin_trgm_ops) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS brand_versions_history ON brand_asset_versions(asset_id,created_at DESC);
CREATE TABLE IF NOT EXISTS email_signature_templates(id uuid PRIMARY KEY,company_id uuid REFERENCES companies,name text NOT NULL,logo text,corporate_text text NOT NULL DEFAULT '',website text NOT NULL DEFAULT '',legal_footer text NOT NULL DEFAULT '',active boolean NOT NULL DEFAULT true,updated_by uuid REFERENCES users,updated_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS signature_company_active ON email_signature_templates(company_id) WHERE active AND company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS signature_global_active ON email_signature_templates((true)) WHERE active AND company_id IS NULL;
INSERT INTO email_signature_templates(id,name,corporate_text) VALUES(md5('default-corporate-signature')::uuid,'Koyuncu Grup Standart','Koyuncu Grup') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION protect_brand_version() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Brand history cannot be deleted'; END IF;
 IF ROW(NEW.id,NEW.asset_id,NEW.version,NEW.file_name,NEW.file_type,NEW.file_data,NEW.file_size,NEW.thumbnail,NEW.uploaded_by,NEW.created_at) IS DISTINCT FROM ROW(OLD.id,OLD.asset_id,OLD.version,OLD.file_name,OLD.file_type,OLD.file_data,OLD.file_size,OLD.thumbnail,OLD.uploaded_by,OLD.created_at) THEN RAISE EXCEPTION 'Upload a new version'; END IF;
 RETURN NEW; END $$;
DROP TRIGGER IF EXISTS brand_version_immutable ON brand_asset_versions;
CREATE TRIGGER brand_version_immutable BEFORE UPDATE OR DELETE ON brand_asset_versions FOR EACH ROW EXECUTE FUNCTION protect_brand_version();
