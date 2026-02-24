-- ══════════════════════════════════════════════════════════════
-- MIGRATION : Ajouter organization_id sur formations et projects
-- ══════════════════════════════════════════════════════════════
-- But : permettre le partage des formations et projets entre
--       membres d'une même organisation (multi-tenant)
-- ══════════════════════════════════════════════════════════════

-- ── Étape 1 : Ajouter les colonnes ──

ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);


-- ── Étape 2 : Migrer les données existantes ──
-- On récupère l'organization_id via la table organization_members
-- (chaque user_id est rattaché à une organisation)

UPDATE formations f
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = f.user_id
  LIMIT 1
)
WHERE f.organization_id IS NULL;

UPDATE projects p
SET organization_id = (
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = p.user_id
  LIMIT 1
)
WHERE p.organization_id IS NULL;


-- ── Étape 3 : Index pour les performances ──

CREATE INDEX IF NOT EXISTS idx_formations_organization_id ON formations(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);


-- ── Étape 4 : Mettre à jour les politiques RLS ──
-- Passer de user_id à organization_id pour formations et projects

-- ── FORMATIONS ──
DROP POLICY IF EXISTS "formations_select" ON formations;
DROP POLICY IF EXISTS "formations_insert" ON formations;
DROP POLICY IF EXISTS "formations_update" ON formations;
DROP POLICY IF EXISTS "formations_delete" ON formations;

CREATE POLICY "formations_select" ON formations FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

CREATE POLICY "formations_insert" ON formations FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "formations_update" ON formations FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

CREATE POLICY "formations_delete" ON formations FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());


-- ── PROJECTS ──
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
