-- ══════════════════════════════════════════════════════════════
-- FIX RLS — Correction du problème "œuf et poule"
-- ══════════════════════════════════════════════════════════════
-- PROBLÈME : organization_members INSERT exigeait d'être déjà
-- membre pour pouvoir s'ajouter comme membre → impossible de
-- créer une organisation pour les utilisateurs legacy.
--
-- SOLUTION : Permettre aux utilisateurs authentifiés de créer
-- leur propre membership, et ajouter un fallback user_id sur
-- les tables qui ont été migrées (formations, projects, companies).
--
-- À EXÉCUTER dans Supabase SQL Editor (Dashboard > SQL Editor)
-- ══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1. FIX ORGANIZATION_MEMBERS — Permettre la création de son
--    propre membership (nécessaire pour l'auto-create org)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR organization_id IN (SELECT get_user_org_ids())
    OR is_super_admin()
  );


-- ─────────────────────────────────────────────────────────────
-- 2. FIX FORMATIONS — Fallback user_id pour utilisateurs
--    sans organisation (legacy ou auto-create échoué)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "formations_select" ON formations;
DROP POLICY IF EXISTS "formations_insert" ON formations;
DROP POLICY IF EXISTS "formations_update" ON formations;
DROP POLICY IF EXISTS "formations_delete" ON formations;

CREATE POLICY "formations_select" ON formations FOR SELECT
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "formations_insert" ON formations FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "formations_update" ON formations FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "formations_delete" ON formations FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );


-- ─────────────────────────────────────────────────────────────
-- 3. FIX PROJECTS — Même fallback user_id
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;

CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );


-- ─────────────────────────────────────────────────────────────
-- 4. FIX COMPANIES — Même fallback user_id
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

CREATE POLICY "companies_select" ON companies FOR SELECT
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "companies_insert" ON companies FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "companies_update" ON companies FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "companies_delete" ON companies FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );


-- ─────────────────────────────────────────────────────────────
-- 5. FIX TIERS — Fallback user_id
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "tiers_select" ON tiers;
DROP POLICY IF EXISTS "tiers_insert" ON tiers;
DROP POLICY IF EXISTS "tiers_update" ON tiers;
DROP POLICY IF EXISTS "tiers_delete" ON tiers;

CREATE POLICY "tiers_select" ON tiers FOR SELECT
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "tiers_insert" ON tiers FOR INSERT
  WITH CHECK (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "tiers_update" ON tiers FOR UPDATE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );

CREATE POLICY "tiers_delete" ON tiers FOR DELETE
  USING (
    organization_id IN (SELECT get_user_org_ids())
    OR user_id = auth.uid()
    OR is_super_admin()
  );


-- ══════════════════════════════════════════════════════════════
-- FIN — Après exécution, déconnectez-vous et reconnectez-vous
-- pour que l'auto-création d'organisation se relance.
-- ══════════════════════════════════════════════════════════════
