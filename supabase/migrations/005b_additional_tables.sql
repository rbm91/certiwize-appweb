-- =====================================================
-- CertiWize — Tables manquantes pour les politiques RLS (006)
-- Ordre d'exécution : APRES 005, AVANT 006
-- IDEMPOTENT : safe to re-run, gere les tables existantes
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. QUIZZES (quiz builder)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter les colonnes manquantes si la table existait deja
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS quiz_type TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS formation_id UUID;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DROP TRIGGER IF EXISTS set_updated_at ON quizzes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_quizzes_org ON quizzes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_share_token ON quizzes(share_token);


-- ─────────────────────────────────────────────────────
-- 2. QUIZ_RESPONSES (reponses publiques aux quiz)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS learner_email TEXT;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS score NUMERIC;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz ON quiz_responses(quiz_id);


-- ─────────────────────────────────────────────────────
-- 3. NAV_CONFIG (configuration navigation par org)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nav_config ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE nav_config ADD COLUMN IF NOT EXISTS config JSONB;
ALTER TABLE nav_config ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_nav_config_org ON nav_config(organization_id);


-- ─────────────────────────────────────────────────────
-- 4. WORKFLOW_CONFIG (configuration workflows par org)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE workflow_config ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE workflow_config ADD COLUMN IF NOT EXISTS config JSONB;
ALTER TABLE workflow_config ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE workflow_config ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_workflow_config_org ON workflow_config(organization_id);


-- ─────────────────────────────────────────────────────
-- 5. ANALYSIS_SETTINGS (parametres analyse IA par org)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analysis_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE analysis_settings ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE analysis_settings ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE analysis_settings ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
ALTER TABLE analysis_settings ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_analysis_settings_org ON analysis_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_analysis_settings_key ON analysis_settings(key);


-- ─────────────────────────────────────────────────────
-- 6. ANALYSIS_HISTORY (historique analyses documents)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS result_text TEXT;
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS conformity_score NUMERIC;
ALTER TABLE analysis_history ADD COLUMN IF NOT EXISTS admin_comment TEXT;

DROP TRIGGER IF EXISTS set_updated_at ON analysis_history;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON analysis_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history(user_id);


-- ─────────────────────────────────────────────────────
-- 7. BOITE_OUTILS_DOCUMENTS (boite a outils personnelle)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS boite_outils_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS categorie TEXT;
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS nom_fichier TEXT;
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE boite_outils_documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_boite_outils_user ON boite_outils_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_boite_outils_active ON boite_outils_documents(deleted_at) WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────
-- 8. RESOURCES (ressources utilisateur)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resources ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE resources ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS description TEXT;

DROP TRIGGER IF EXISTS set_updated_at ON resources;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_resources_user ON resources(user_id);


-- ─────────────────────────────────────────────────────
-- 9. SUBSCRIPTION_PLANS (plans d'abonnement — lecture publique)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_period TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;


-- ─────────────────────────────────────────────────────
-- 10. TIERS_ROLES (roles des tiers — table de liaison)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiers_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tiers_roles ADD COLUMN IF NOT EXISTS tiers_id BIGINT REFERENCES tiers(id) ON DELETE CASCADE;
ALTER TABLE tiers_roles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE tiers_roles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tiers_roles_tiers ON tiers_roles(tiers_id);
CREATE INDEX IF NOT EXISTS idx_tiers_roles_role ON tiers_roles(role);


-- ─────────────────────────────────────────────────────
-- 11. TIERS_RELATIONS (relations personne <-> organisation)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tiers_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tiers_relations ADD COLUMN IF NOT EXISTS tiers_id BIGINT REFERENCES tiers(id) ON DELETE CASCADE;
ALTER TABLE tiers_relations ADD COLUMN IF NOT EXISTS personne_id BIGINT REFERENCES tiers(id);
ALTER TABLE tiers_relations ADD COLUMN IF NOT EXISTS organisation_id BIGINT REFERENCES tiers(id);
ALTER TABLE tiers_relations ADD COLUMN IF NOT EXISTS type_relation TEXT;

CREATE INDEX IF NOT EXISTS idx_tiers_relations_tiers ON tiers_relations(tiers_id);
CREATE INDEX IF NOT EXISTS idx_tiers_relations_personne ON tiers_relations(personne_id);
CREATE INDEX IF NOT EXISTS idx_tiers_relations_org ON tiers_relations(organisation_id);


-- ─────────────────────────────────────────────────────
-- 12. TIER_DOCUMENTS (documents attaches aux tiers)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tier_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_ajout TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tier_documents ADD COLUMN IF NOT EXISTS tiers_id BIGINT REFERENCES tiers(id) ON DELETE CASCADE;
ALTER TABLE tier_documents ADD COLUMN IF NOT EXISTS type_document TEXT;
ALTER TABLE tier_documents ADD COLUMN IF NOT EXISTS nom_fichier TEXT;
ALTER TABLE tier_documents ADD COLUMN IF NOT EXISTS url_stockage TEXT;
ALTER TABLE tier_documents ADD COLUMN IF NOT EXISTS ajoute_par UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tier_documents_tiers ON tier_documents(tiers_id);


-- =====================================================
-- FIN — 12 tables creees/mises a jour pour le 006
-- =====================================================
