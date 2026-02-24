-- ══════════════════════════════════════════════════════════════
-- POLITIQUES RLS (Row Level Security) — Certiwize Multi-Tenant
-- ══════════════════════════════════════════════════════════════
-- Généré à partir du schéma réel (diagnostic du 2026-02-22)
-- ══════════════════════════════════════════════════════════════

-- ── Fonctions utilitaires ──
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT organization_id FROM organization_members WHERE user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$ SELECT COALESCE((SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()), false); $$;


-- ══════════════════════════════════════════════════════════════
-- 1. TABLES AVEC organization_id → filtrées par org
-- ══════════════════════════════════════════════════════════════

-- ── TIERS ──
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tiers_select" ON tiers;
DROP POLICY IF EXISTS "tiers_insert" ON tiers;
DROP POLICY IF EXISTS "tiers_update" ON tiers;
DROP POLICY IF EXISTS "tiers_delete" ON tiers;
CREATE POLICY "tiers_select" ON tiers FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "tiers_insert" ON tiers FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "tiers_update" ON tiers FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "tiers_delete" ON tiers FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── PRESTATIONS ──
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prestations_select" ON prestations;
DROP POLICY IF EXISTS "prestations_insert" ON prestations;
DROP POLICY IF EXISTS "prestations_update" ON prestations;
DROP POLICY IF EXISTS "prestations_delete" ON prestations;
CREATE POLICY "prestations_select" ON prestations FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "prestations_insert" ON prestations FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "prestations_update" ON prestations FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "prestations_delete" ON prestations FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── FACTURES ──
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factures_select" ON factures;
DROP POLICY IF EXISTS "factures_insert" ON factures;
DROP POLICY IF EXISTS "factures_update" ON factures;
DROP POLICY IF EXISTS "factures_delete" ON factures;
CREATE POLICY "factures_select" ON factures FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "factures_insert" ON factures FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "factures_update" ON factures FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "factures_delete" ON factures FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── EVALUATION_EXECUTIONS ──
ALTER TABLE evaluation_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "eval_exec_select" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_insert" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_update" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_delete" ON evaluation_executions;
CREATE POLICY "eval_exec_select" ON evaluation_executions FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "eval_exec_insert" ON evaluation_executions FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "eval_exec_update" ON evaluation_executions FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "eval_exec_delete" ON evaluation_executions FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── COMPANIES ──
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;
CREATE POLICY "companies_select" ON companies FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "companies_insert" ON companies FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "companies_update" ON companies FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "companies_delete" ON companies FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── APPELS (a bien organization_id) ──
ALTER TABLE appels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "appels_select" ON appels;
DROP POLICY IF EXISTS "appels_insert" ON appels;
DROP POLICY IF EXISTS "appels_update" ON appels;
DROP POLICY IF EXISTS "appels_delete" ON appels;
CREATE POLICY "appels_select" ON appels FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "appels_insert" ON appels FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "appels_update" ON appels FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "appels_delete" ON appels FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── RECLAMATIONS ──
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reclamations_select" ON reclamations;
DROP POLICY IF EXISTS "reclamations_insert" ON reclamations;
DROP POLICY IF EXISTS "reclamations_update" ON reclamations;
DROP POLICY IF EXISTS "reclamations_delete" ON reclamations;
CREATE POLICY "reclamations_select" ON reclamations FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "reclamations_insert" ON reclamations FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "reclamations_update" ON reclamations FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "reclamations_delete" ON reclamations FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── SIGNAUX_QUALITE ──
ALTER TABLE signaux_qualite ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "signaux_select" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_insert" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_update" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_delete" ON signaux_qualite;
CREATE POLICY "signaux_select" ON signaux_qualite FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "signaux_insert" ON signaux_qualite FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "signaux_update" ON signaux_qualite FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "signaux_delete" ON signaux_qualite FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── PROCEDURES_QUALITE ──
ALTER TABLE procedures_qualite ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "procedures_select" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_insert" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_update" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_delete" ON procedures_qualite;
CREATE POLICY "procedures_select" ON procedures_qualite FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "procedures_insert" ON procedures_qualite FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "procedures_update" ON procedures_qualite FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "procedures_delete" ON procedures_qualite FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── QUIZZES ──
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quizzes_select" ON quizzes;
DROP POLICY IF EXISTS "quizzes_insert" ON quizzes;
DROP POLICY IF EXISTS "quizzes_update" ON quizzes;
DROP POLICY IF EXISTS "quizzes_delete" ON quizzes;
CREATE POLICY "quizzes_select" ON quizzes FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "quizzes_insert" ON quizzes FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "quizzes_update" ON quizzes FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "quizzes_delete" ON quizzes FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── INVITATIONS (organization_id, pas de user_id) ──
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invitations_select" ON invitations;
DROP POLICY IF EXISTS "invitations_insert" ON invitations;
DROP POLICY IF EXISTS "invitations_update" ON invitations;
DROP POLICY IF EXISTS "invitations_delete" ON invitations;
CREATE POLICY "invitations_select" ON invitations FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "invitations_insert" ON invitations FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "invitations_update" ON invitations FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "invitations_delete" ON invitations FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── NAV_CONFIG (organization_id, pas de user_id) ──
ALTER TABLE nav_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nav_config_select" ON nav_config;
DROP POLICY IF EXISTS "nav_config_insert" ON nav_config;
DROP POLICY IF EXISTS "nav_config_update" ON nav_config;
DROP POLICY IF EXISTS "nav_config_delete" ON nav_config;
CREATE POLICY "nav_config_select" ON nav_config FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "nav_config_insert" ON nav_config FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "nav_config_update" ON nav_config FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "nav_config_delete" ON nav_config FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── DATA_DELETION_REQUESTS ──
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deletion_requests_select" ON data_deletion_requests;
DROP POLICY IF EXISTS "deletion_requests_insert" ON data_deletion_requests;
CREATE POLICY "deletion_requests_select" ON data_deletion_requests FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "deletion_requests_insert" ON data_deletion_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── DATA_EXPORT_REQUESTS ──
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "export_requests_select" ON data_export_requests;
DROP POLICY IF EXISTS "export_requests_insert" ON data_export_requests;
CREATE POLICY "export_requests_select" ON data_export_requests FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "export_requests_insert" ON data_export_requests FOR INSERT WITH CHECK (user_id = auth.uid());

-- ── AUDIT_LOG ──
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "audit_log_insert" ON audit_log FOR INSERT WITH CHECK (true);

-- ── ORGANIZATION_MEMBERS ──
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;
CREATE POLICY "org_members_select" ON organization_members FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "org_members_insert" ON organization_members FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "org_members_delete" ON organization_members FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());


-- ══════════════════════════════════════════════════════════════
-- 2. TABLES SANS organization_id, AVEC user_id → filtrées par user
-- ══════════════════════════════════════════════════════════════

-- ── FORMATIONS (organization_id ajouté par migration 2026-02-22) ──
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "formations_select" ON formations;
DROP POLICY IF EXISTS "formations_insert" ON formations;
DROP POLICY IF EXISTS "formations_update" ON formations;
DROP POLICY IF EXISTS "formations_delete" ON formations;
CREATE POLICY "formations_select" ON formations FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "formations_insert" ON formations FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "formations_update" ON formations FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "formations_delete" ON formations FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── PROJECTS (organization_id ajouté par migration 2026-02-22) ──
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── ANALYSIS_HISTORY (user_id uniquement) ──
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_history_select" ON analysis_history;
DROP POLICY IF EXISTS "analysis_history_insert" ON analysis_history;
DROP POLICY IF EXISTS "analysis_history_update" ON analysis_history;
DROP POLICY IF EXISTS "analysis_history_delete" ON analysis_history;
CREATE POLICY "analysis_history_select" ON analysis_history FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "analysis_history_insert" ON analysis_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "analysis_history_update" ON analysis_history FOR UPDATE USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "analysis_history_delete" ON analysis_history FOR DELETE USING (user_id = auth.uid() OR is_super_admin());

-- ── BOITE_OUTILS_DOCUMENTS (user_id uniquement) ──
ALTER TABLE boite_outils_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boite_outils_select" ON boite_outils_documents;
DROP POLICY IF EXISTS "boite_outils_insert" ON boite_outils_documents;
DROP POLICY IF EXISTS "boite_outils_update" ON boite_outils_documents;
DROP POLICY IF EXISTS "boite_outils_delete" ON boite_outils_documents;
CREATE POLICY "boite_outils_select" ON boite_outils_documents FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "boite_outils_insert" ON boite_outils_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "boite_outils_update" ON boite_outils_documents FOR UPDATE USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "boite_outils_delete" ON boite_outils_documents FOR DELETE USING (user_id = auth.uid() OR is_super_admin());

-- ── CONSENT_LOGS (user_id uniquement) ──
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consent_logs_select" ON consent_logs;
DROP POLICY IF EXISTS "consent_logs_insert" ON consent_logs;
CREATE POLICY "consent_logs_select" ON consent_logs FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "consent_logs_insert" ON consent_logs FOR INSERT WITH CHECK (true);

-- ── LEARNERS (user_id uniquement) ──
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learners_select" ON learners;
DROP POLICY IF EXISTS "learners_insert" ON learners;
DROP POLICY IF EXISTS "learners_update" ON learners;
DROP POLICY IF EXISTS "learners_delete" ON learners;
CREATE POLICY "learners_select" ON learners FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "learners_insert" ON learners FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "learners_update" ON learners FOR UPDATE USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "learners_delete" ON learners FOR DELETE USING (user_id = auth.uid() OR is_super_admin());

-- ── RESOURCES (user_id uniquement) ──
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_select" ON resources;
DROP POLICY IF EXISTS "resources_insert" ON resources;
DROP POLICY IF EXISTS "resources_update" ON resources;
DROP POLICY IF EXISTS "resources_delete" ON resources;
CREATE POLICY "resources_select" ON resources FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "resources_insert" ON resources FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "resources_update" ON resources FOR UPDATE USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "resources_delete" ON resources FOR DELETE USING (user_id = auth.uid() OR is_super_admin());

-- ── SUBSCRIPTIONS (user_id uniquement) ──
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert" ON subscriptions;
DROP POLICY IF EXISTS "subscriptions_update" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (user_id = auth.uid() OR is_super_admin());
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (user_id = auth.uid() OR is_super_admin());


-- ══════════════════════════════════════════════════════════════
-- 3. TABLES DE LIAISON (filtrées via table parent)
-- ══════════════════════════════════════════════════════════════

-- ── TIERS_ROLES (via tiers.organization_id) ──
ALTER TABLE tiers_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tiers_roles_select" ON tiers_roles;
DROP POLICY IF EXISTS "tiers_roles_insert" ON tiers_roles;
DROP POLICY IF EXISTS "tiers_roles_delete" ON tiers_roles;
CREATE POLICY "tiers_roles_select" ON tiers_roles FOR SELECT USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "tiers_roles_insert" ON tiers_roles FOR INSERT WITH CHECK (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "tiers_roles_delete" ON tiers_roles FOR DELETE USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── TIERS_RELATIONS (via tiers.organization_id) ──
ALTER TABLE tiers_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tiers_relations_select" ON tiers_relations;
DROP POLICY IF EXISTS "tiers_relations_insert" ON tiers_relations;
DROP POLICY IF EXISTS "tiers_relations_delete" ON tiers_relations;
CREATE POLICY "tiers_relations_select" ON tiers_relations FOR SELECT USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "tiers_relations_insert" ON tiers_relations FOR INSERT WITH CHECK (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "tiers_relations_delete" ON tiers_relations FOR DELETE USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── TIER_DOCUMENTS (via tiers.organization_id) ──
ALTER TABLE tier_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tier_documents_select" ON tier_documents;
DROP POLICY IF EXISTS "tier_documents_insert" ON tier_documents;
DROP POLICY IF EXISTS "tier_documents_delete" ON tier_documents;
CREATE POLICY "tier_documents_select" ON tier_documents FOR SELECT USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "tier_documents_insert" ON tier_documents FOR INSERT WITH CHECK (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "tier_documents_delete" ON tier_documents FOR DELETE USING (tiers_id IN (SELECT id FROM tiers WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── PRESTATION_APPRENANTS (via prestations.organization_id) ──
ALTER TABLE prestation_apprenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prestation_apprenants_select" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_insert" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_delete" ON prestation_apprenants;
CREATE POLICY "prestation_apprenants_select" ON prestation_apprenants FOR SELECT USING (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "prestation_apprenants_insert" ON prestation_apprenants FOR INSERT WITH CHECK (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "prestation_apprenants_delete" ON prestation_apprenants FOR DELETE USING (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── PRESTATION_DOCUMENTS (via prestations.organization_id) ──
ALTER TABLE prestation_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prestation_documents_select" ON prestation_documents;
DROP POLICY IF EXISTS "prestation_documents_insert" ON prestation_documents;
DROP POLICY IF EXISTS "prestation_documents_delete" ON prestation_documents;
CREATE POLICY "prestation_documents_select" ON prestation_documents FOR SELECT USING (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "prestation_documents_insert" ON prestation_documents FOR INSERT WITH CHECK (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "prestation_documents_delete" ON prestation_documents FOR DELETE USING (prestation_id IN (SELECT id FROM prestations WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── QUIZ_RESPONSES (lecture par org via quizzes, INSERT public) ──
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_responses_select" ON quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_insert" ON quiz_responses;
CREATE POLICY "quiz_responses_select" ON quiz_responses FOR SELECT USING (quiz_id IN (SELECT id FROM quizzes WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "quiz_responses_insert" ON quiz_responses FOR INSERT WITH CHECK (true);


-- ══════════════════════════════════════════════════════════════
-- 4. TABLES SYSTÈME
-- ══════════════════════════════════════════════════════════════

-- ── ORGANIZATIONS ──
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (id IN (SELECT get_user_org_ids()) OR is_super_admin());
CREATE POLICY "organizations_insert" ON organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "organizations_update" ON organizations FOR UPDATE USING (id IN (SELECT get_user_org_ids()) OR is_super_admin());

-- ── PROFILES ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR is_super_admin());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid() OR is_super_admin());

-- ── SUBSCRIPTION_PLANS (lecture publique, écriture super-admin) ──
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscription_plans_select" ON subscription_plans;
CREATE POLICY "subscription_plans_select" ON subscription_plans FOR SELECT USING (true);


-- ══════════════════════════════════════════════════════════════
-- 5. TABLES SANS org_id NI user_id → accès authentifié ou super-admin
-- ══════════════════════════════════════════════════════════════

-- ── PAIEMENTS (pas d'org_id, pas de user_id — lié aux factures) ──
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "paiements_select" ON paiements;
DROP POLICY IF EXISTS "paiements_insert" ON paiements;
DROP POLICY IF EXISTS "paiements_update" ON paiements;
DROP POLICY IF EXISTS "paiements_delete" ON paiements;
CREATE POLICY "paiements_select" ON paiements FOR SELECT USING (facture_id IN (SELECT id FROM factures WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "paiements_insert" ON paiements FOR INSERT WITH CHECK (facture_id IN (SELECT id FROM factures WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "paiements_update" ON paiements FOR UPDATE USING (facture_id IN (SELECT id FROM factures WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());
CREATE POLICY "paiements_delete" ON paiements FOR DELETE USING (facture_id IN (SELECT id FROM factures WHERE organization_id IN (SELECT get_user_org_ids())) OR is_super_admin());

-- ── WORKFLOW_CONFIG (pas d'org_id, pas de user_id — accès authentifié) ──
ALTER TABLE workflow_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workflow_config_select" ON workflow_config;
DROP POLICY IF EXISTS "workflow_config_insert" ON workflow_config;
DROP POLICY IF EXISTS "workflow_config_update" ON workflow_config;
CREATE POLICY "workflow_config_select" ON workflow_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "workflow_config_insert" ON workflow_config FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "workflow_config_update" ON workflow_config FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ── ANALYSIS_SETTINGS (pas d'org_id, pas de user_id — accès authentifié) ──
ALTER TABLE analysis_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analysis_settings_select" ON analysis_settings;
DROP POLICY IF EXISTS "analysis_settings_insert" ON analysis_settings;
DROP POLICY IF EXISTS "analysis_settings_update" ON analysis_settings;
CREATE POLICY "analysis_settings_select" ON analysis_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "analysis_settings_insert" ON analysis_settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "analysis_settings_update" ON analysis_settings FOR UPDATE USING (auth.uid() IS NOT NULL);
