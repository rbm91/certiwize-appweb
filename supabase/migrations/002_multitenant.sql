-- =====================================================
-- CertiWize — Migration Multi-Tenant SaaS + RGPD
-- À exécuter dans Supabase SQL Editor
-- IDEMPOTENT : safe to re-run (IF NOT EXISTS partout)
-- =====================================================


-- =====================================================
-- SECTION 0 : Fonctions helpers multi-tenant
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_org_role(org_id uuid)
RETURNS text AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = auth.uid() AND organization_id = org_id
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- =====================================================
-- SECTION 1 : Nouvelles tables multi-tenant
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. ORGANIZATIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON organizations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()) OR is_super_admin());

DROP POLICY IF EXISTS "organizations_insert" ON organizations;
CREATE POLICY "organizations_insert" ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_update" ON organizations FOR UPDATE
  USING (id IN (SELECT get_user_org_ids()) OR is_super_admin());


-- ─────────────────────────────────────────────────────
-- 2. ORGANIZATION_MEMBERS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "org_members_update" ON organization_members;
CREATE POLICY "org_members_update" ON organization_members FOR UPDATE
  USING (get_org_role(organization_id) IN ('owner', 'admin') OR is_super_admin());

DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE
  USING (get_org_role(organization_id) IN ('owner', 'admin') OR is_super_admin() OR user_id = auth.uid());


-- ─────────────────────────────────────────────────────
-- 3. INVITATIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  token uuid DEFAULT gen_random_uuid() UNIQUE,
  invited_by uuid REFERENCES auth.users(id) NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_select" ON invitations;
CREATE POLICY "invitations_select" ON invitations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (get_org_role(organization_id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "invitations_update" ON invitations;
CREATE POLICY "invitations_update" ON invitations FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "invitations_delete" ON invitations;
CREATE POLICY "invitations_delete" ON invitations FOR DELETE
  USING (get_org_role(organization_id) IN ('owner', 'admin'));


-- =====================================================
-- SECTION 2 : Tables RGPD
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 4. CONSENT_LOGS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('data_processing', 'terms_of_service', 'cookies', 'marketing')),
  granted boolean NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consent_logs_select" ON consent_logs;
CREATE POLICY "consent_logs_select" ON consent_logs FOR SELECT
  USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS "consent_logs_insert" ON consent_logs;
CREATE POLICY "consent_logs_insert" ON consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────
-- 5. DATA_EXPORT_REQUESTS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'expired')),
  file_url text,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "export_requests_select" ON data_export_requests;
CREATE POLICY "export_requests_select" ON data_export_requests FOR SELECT
  USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS "export_requests_insert" ON data_export_requests;
CREATE POLICY "export_requests_insert" ON data_export_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "export_requests_update" ON data_export_requests;
CREATE POLICY "export_requests_update" ON data_export_requests FOR UPDATE
  USING (is_super_admin());


-- ─────────────────────────────────────────────────────
-- 6. DATA_DELETION_REQUESTS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deletion_requests_select" ON data_deletion_requests;
CREATE POLICY "deletion_requests_select" ON data_deletion_requests FOR SELECT
  USING (auth.uid() = user_id OR is_super_admin());

DROP POLICY IF EXISTS "deletion_requests_insert" ON data_deletion_requests;
CREATE POLICY "deletion_requests_insert" ON data_deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "deletion_requests_update" ON data_deletion_requests;
CREATE POLICY "deletion_requests_update" ON data_deletion_requests FOR UPDATE
  USING (is_super_admin());


-- =====================================================
-- SECTION 3 : Ajout de organization_id aux tables existantes
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

ALTER TABLE companies ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Contrainte UNIQUE (ignore si elle existe deja)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_organization_id_unique') THEN
    ALTER TABLE companies ADD CONSTRAINT companies_organization_id_unique UNIQUE (organization_id);
  END IF;
END $$;

ALTER TABLE tiers ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE prestations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE factures ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE evaluation_executions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE signaux_qualite ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE procedures_qualite ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE reclamations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE appels ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Tables qui peuvent ne pas exister encore (creees dans 005b)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') THEN
    EXECUTE 'ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nav_config') THEN
    EXECUTE 'ALTER TABLE nav_config ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainings') THEN
    EXECUTE 'ALTER TABLE trainings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id)';
  END IF;
END $$;

-- Index sur organization_id
CREATE INDEX IF NOT EXISTS idx_companies_org ON companies(organization_id);
CREATE INDEX IF NOT EXISTS idx_tiers_org ON tiers(organization_id);
CREATE INDEX IF NOT EXISTS idx_prestations_org ON prestations(organization_id);
CREATE INDEX IF NOT EXISTS idx_factures_org ON factures(organization_id);
CREATE INDEX IF NOT EXISTS idx_eval_exec_org ON evaluation_executions(organization_id);
CREATE INDEX IF NOT EXISTS idx_signaux_org ON signaux_qualite(organization_id);
CREATE INDEX IF NOT EXISTS idx_procedures_org ON procedures_qualite(organization_id);
CREATE INDEX IF NOT EXISTS idx_reclamations_org ON reclamations(organization_id);
CREATE INDEX IF NOT EXISTS idx_appels_org ON appels(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(organization_id);

-- Index org_members
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_org ON organization_members(user_id, organization_id);


-- =====================================================
-- SECTION 4 : Reecriture des politiques RLS (org-based)
-- =====================================================

-- ── COMPANIES ──
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "companies_insert" ON companies FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "companies_update" ON companies FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── TIERS ──
DROP POLICY IF EXISTS "tiers_select" ON tiers;
DROP POLICY IF EXISTS "tiers_insert" ON tiers;
DROP POLICY IF EXISTS "tiers_update" ON tiers;
DROP POLICY IF EXISTS "tiers_delete" ON tiers;
CREATE POLICY "tiers_select" ON tiers FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "tiers_insert" ON tiers FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "tiers_update" ON tiers FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "tiers_delete" ON tiers FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ── PRESTATIONS ──
DROP POLICY IF EXISTS "prestations_select" ON prestations;
DROP POLICY IF EXISTS "prestations_insert" ON prestations;
DROP POLICY IF EXISTS "prestations_update" ON prestations;
DROP POLICY IF EXISTS "prestations_delete" ON prestations;
CREATE POLICY "prestations_select" ON prestations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "prestations_insert" ON prestations FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "prestations_update" ON prestations FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "prestations_delete" ON prestations FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ── PRESTATION_APPRENANTS ──
DROP POLICY IF EXISTS "prestation_apprenants_select" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_insert" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_delete" ON prestation_apprenants;
CREATE POLICY "prestation_apprenants_select" ON prestation_apprenants FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "prestation_apprenants_insert" ON prestation_apprenants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "prestation_apprenants_delete" ON prestation_apprenants FOR DELETE
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.organization_id IN (SELECT get_user_org_ids())));

-- ── PRESTATION_DOCUMENTS ──
DROP POLICY IF EXISTS "prestation_documents_select" ON prestation_documents;
DROP POLICY IF EXISTS "prestation_documents_insert" ON prestation_documents;
CREATE POLICY "prestation_documents_select" ON prestation_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "prestation_documents_insert" ON prestation_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.organization_id IN (SELECT get_user_org_ids())));

-- ── FACTURES ──
DROP POLICY IF EXISTS "factures_select" ON factures;
DROP POLICY IF EXISTS "factures_insert" ON factures;
DROP POLICY IF EXISTS "factures_update" ON factures;
DROP POLICY IF EXISTS "factures_delete" ON factures;
CREATE POLICY "factures_select" ON factures FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "factures_insert" ON factures FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "factures_update" ON factures FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "factures_delete" ON factures FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ── PAIEMENTS ──
DROP POLICY IF EXISTS "paiements_select" ON paiements;
DROP POLICY IF EXISTS "paiements_insert" ON paiements;
CREATE POLICY "paiements_select" ON paiements FOR SELECT
  USING (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND f.organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "paiements_insert" ON paiements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND f.organization_id IN (SELECT get_user_org_ids())));

-- ── EVALUATION_EXECUTIONS ──
DROP POLICY IF EXISTS "eval_exec_select" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_insert" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_update" ON evaluation_executions;
CREATE POLICY "eval_exec_select" ON evaluation_executions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "eval_exec_insert" ON evaluation_executions FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "eval_exec_update" ON evaluation_executions FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── SIGNAUX_QUALITE ──
DROP POLICY IF EXISTS "signaux_select" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_insert" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_update" ON signaux_qualite;
CREATE POLICY "signaux_select" ON signaux_qualite FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "signaux_insert" ON signaux_qualite FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "signaux_update" ON signaux_qualite FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── PROCEDURES_QUALITE ──
DROP POLICY IF EXISTS "procedures_select" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_insert" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_update" ON procedures_qualite;
CREATE POLICY "procedures_select" ON procedures_qualite FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "procedures_insert" ON procedures_qualite FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "procedures_update" ON procedures_qualite FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── RECLAMATIONS ──
DROP POLICY IF EXISTS "reclamations_select" ON reclamations;
DROP POLICY IF EXISTS "reclamations_insert" ON reclamations;
DROP POLICY IF EXISTS "reclamations_update" ON reclamations;
CREATE POLICY "reclamations_select" ON reclamations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "reclamations_insert" ON reclamations FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "reclamations_update" ON reclamations FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── APPELS ──
DROP POLICY IF EXISTS "appels_select" ON appels;
DROP POLICY IF EXISTS "appels_insert" ON appels;
DROP POLICY IF EXISTS "appels_update" ON appels;
CREATE POLICY "appels_select" ON appels FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "appels_insert" ON appels FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "appels_update" ON appels FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── AUDIT_LOG ──
DROP POLICY IF EXISTS "audit_insert" ON audit_log;
DROP POLICY IF EXISTS "audit_select" ON audit_log;
CREATE POLICY "audit_select" ON audit_log FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "audit_insert" ON audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ── QUIZZES (conditionnel) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') THEN
    EXECUTE 'DROP POLICY IF EXISTS "quizzes_select" ON quizzes';
    EXECUTE 'DROP POLICY IF EXISTS "quizzes_insert" ON quizzes';
    EXECUTE 'DROP POLICY IF EXISTS "quizzes_update" ON quizzes';
    EXECUTE 'DROP POLICY IF EXISTS "quizzes_delete" ON quizzes';
    EXECUTE 'CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
    EXECUTE 'CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()))';
    EXECUTE 'CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
    EXECUTE 'CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()))';
  END IF;
END $$;

-- ── NAV_CONFIG (conditionnel) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nav_config') THEN
    EXECUTE 'DROP POLICY IF EXISTS "nav_config_select" ON nav_config';
    EXECUTE 'DROP POLICY IF EXISTS "nav_config_insert" ON nav_config';
    EXECUTE 'DROP POLICY IF EXISTS "nav_config_update" ON nav_config';
    EXECUTE 'CREATE POLICY "nav_config_select" ON nav_config FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
    EXECUTE 'CREATE POLICY "nav_config_insert" ON nav_config FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()))';
    EXECUTE 'CREATE POLICY "nav_config_update" ON nav_config FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
  END IF;
END $$;

-- ── TRAININGS (conditionnel) ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trainings') THEN
    EXECUTE 'DROP POLICY IF EXISTS "trainings_select" ON trainings';
    EXECUTE 'DROP POLICY IF EXISTS "trainings_insert" ON trainings';
    EXECUTE 'DROP POLICY IF EXISTS "trainings_update" ON trainings';
    EXECUTE 'DROP POLICY IF EXISTS "trainings_delete" ON trainings';
    EXECUTE 'CREATE POLICY "trainings_select" ON trainings FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
    EXECUTE 'CREATE POLICY "trainings_insert" ON trainings FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()))';
    EXECUTE 'CREATE POLICY "trainings_update" ON trainings FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin())';
    EXECUTE 'CREATE POLICY "trainings_delete" ON trainings FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()))';
  END IF;
END $$;


-- =====================================================
-- SECTION 5 : Index supplementaires
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_consent_logs_user ON consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON data_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);


-- =====================================================
-- FIN
-- =====================================================
