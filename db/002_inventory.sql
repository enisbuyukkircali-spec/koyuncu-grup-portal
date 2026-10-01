BEGIN;
CREATE TABLE IF NOT EXISTS inventory_categories (
 id uuid PRIMARY KEY, name text NOT NULL, code text NOT NULL UNIQUE,
 icon text NOT NULL DEFAULT 'package', description text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
 field_profile text NOT NULL DEFAULT 'BASIC' CHECK(field_profile IN('BASIC','COMPUTER','PHONE','SIM','MONITOR')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_category_name ON inventory_categories(lower(name));
CREATE TABLE IF NOT EXISTS inventory_items (
 id uuid PRIMARY KEY, asset_number text NOT NULL UNIQUE, category_id uuid NOT NULL REFERENCES inventory_categories,
 brand text NOT NULL DEFAULT '', model text NOT NULL DEFAULT '', serial_number text,
 company_id uuid NOT NULL REFERENCES companies, location_id uuid NOT NULL REFERENCES locations,
 department_id uuid REFERENCES departments, purchase_date date, warranty_end date,
 supplier text NOT NULL DEFAULT '', invoice_number text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', image text,
 status text NOT NULL DEFAULT 'STOCK' CHECK(status IN('STOCK','ASSIGNED','SERVICE','FAULTY','LOST','SCRAPPED','RETURNED','INACTIVE')),
 extras jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(extras)='object'),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(asset_number=upper(trim(asset_number)) AND length(asset_number)>0),
 CHECK(serial_number IS NULL OR (serial_number=upper(trim(serial_number)) AND length(serial_number)>0))
);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_serial_number ON inventory_items(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS inventory_company ON inventory_items(company_id);
CREATE INDEX IF NOT EXISTS inventory_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS inventory_department ON inventory_items(department_id);
CREATE TABLE IF NOT EXISTS asset_assignments (
 id uuid PRIMARY KEY, inventory_id uuid NOT NULL REFERENCES inventory_items, user_id uuid NOT NULL REFERENCES users,
 assigned_at date NOT NULL, delivered_by uuid NOT NULL REFERENCES users, note text NOT NULL DEFAULT '',
 returned_at date, received_by uuid REFERENCES users, return_note text NOT NULL DEFAULT '', return_condition text,
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN('ACTIVE','RETURNED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((status='ACTIVE' AND returned_at IS NULL AND received_by IS NULL AND return_condition IS NULL) OR
       (status='RETURNED' AND returned_at IS NOT NULL AND received_by IS NOT NULL AND return_condition IN('STOCK','SERVICE','FAULTY','LOST','SCRAPPED','INACTIVE'))),
 CHECK(returned_at IS NULL OR returned_at>=assigned_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS assignment_one_active ON asset_assignments(inventory_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS assignment_user ON asset_assignments(user_id,assigned_at DESC);
CREATE INDEX IF NOT EXISTS assignment_active_user ON asset_assignments(user_id) WHERE returned_at IS NULL;
CREATE INDEX IF NOT EXISTS assignment_history ON asset_assignments(inventory_id,created_at DESC);
CREATE INDEX IF NOT EXISTS assignment_delivered ON asset_assignments(delivered_by);
CREATE INDEX IF NOT EXISTS assignment_received ON asset_assignments(received_by);
CREATE OR REPLACE FUNCTION inventory_assignment_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target uuid; item_status text; has_assignment boolean;
BEGIN
 IF TG_TABLE_NAME='inventory_items' THEN target:=NEW.id; ELSE target:=NEW.inventory_id; END IF;
 SELECT status INTO item_status FROM inventory_items WHERE id=target;
 SELECT EXISTS(SELECT 1 FROM asset_assignments WHERE inventory_id=target AND returned_at IS NULL) INTO has_assignment;
 IF (item_status='ASSIGNED') IS DISTINCT FROM has_assignment THEN RAISE EXCEPTION 'Inventory assignment status mismatch' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS inventory_consistent ON inventory_items;
CREATE CONSTRAINT TRIGGER inventory_consistent AFTER INSERT OR UPDATE ON inventory_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION inventory_assignment_consistency();
DROP TRIGGER IF EXISTS assignment_consistent ON asset_assignments;
CREATE CONSTRAINT TRIGGER assignment_consistent AFTER INSERT OR UPDATE ON asset_assignments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION inventory_assignment_consistency();
CREATE OR REPLACE FUNCTION preserve_assignment_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Assignment history cannot be deleted' USING ERRCODE='23514'; END IF;
 IF OLD.returned_at IS NOT NULL OR (NEW.inventory_id,NEW.user_id,NEW.assigned_at,NEW.delivered_by,NEW.id,NEW.created_at) IS DISTINCT FROM (OLD.inventory_id,OLD.user_id,OLD.assigned_at,OLD.delivered_by,OLD.id,OLD.created_at)
 THEN RAISE EXCEPTION 'Assignment history is immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS assignment_history_guard ON asset_assignments;
CREATE TRIGGER assignment_history_guard BEFORE UPDATE OR DELETE ON asset_assignments FOR EACH ROW EXECUTE FUNCTION preserve_assignment_history();
INSERT INTO inventory_categories(id,name,code,icon,field_profile)
SELECT md5('inventory-category-'||code)::uuid,name,code,icon,profile FROM (VALUES
 ('Laptop','LAPTOP','laptop','COMPUTER'),('Masaüstü Bilgisayar','DESKTOP','monitor','COMPUTER'),
 ('Cep Telefonu','PHONE','phone','PHONE'),('Tablet','TABLET','tablet','BASIC'),('Monitör','MONITOR','monitor','MONITOR'),
 ('Klavye','KEYBOARD','keyboard','BASIC'),('Mouse','MOUSE','mouse','BASIC'),('Kulaklık','HEADSET','headphones','BASIC'),
 ('Docking Station','DOCK','plug','BASIC'),('Yazıcı','PRINTER','printer','BASIC'),('SIM Kart','SIM','sim','SIM'),
 ('Modem','MODEM','router','BASIC'),('Network Ekipmanı','NETWORK','network','BASIC'),('Diğer','OTHER','package','BASIC')
) AS defaults(name,code,icon,profile) ON CONFLICT DO NOTHING;
COMMIT;
