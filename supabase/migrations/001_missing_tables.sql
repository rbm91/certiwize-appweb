-- =====================================================
-- CertiWize — Création des 11 tables manquantes
-- À exécuter dans Supabase SQL Editor (dans l'ordre)
-- IDEMPOTENT : safe to re-run (IF NOT EXISTS partout)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- Fonction trigger pour updated_at automatique
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- SECTION 1 : CREATE TABLE (ordre de dépendance)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. PRESTATIONS (formations, coaching, conseil)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('formation', 'coaching', 'conseil')),
  intitule text,
  reference text,
  client_id bigint REFERENCES tiers(id),
  payeur_id bigint REFERENCES tiers(id),
  formateur_id bigint REFERENCES tiers(id),
  contact_signataire_id bigint REFERENCES tiers(id),
  date_debut timestamptz,
  date_fin timestamptz,
  duree_heures numeric,
  montant_ht numeric,
  taux_tva numeric DEFAULT 20,
  couleur text,
  etape_courante int DEFAULT 1,
  statut text DEFAULT 'brouillon',
  workflow_data jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

DROP TRIGGER IF EXISTS set_updated_at ON prestations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON prestations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 2. PRESTATION_APPRENANTS (table de jonction)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestation_apprenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestation_id uuid NOT NULL REFERENCES prestations(id) ON DELETE CASCADE,
  apprenant_id bigint NOT NULL REFERENCES tiers(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(prestation_id, apprenant_id)
);


-- ─────────────────────────────────────────────────────
-- 3. PRESTATION_DOCUMENTS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestation_id uuid NOT NULL REFERENCES prestations(id) ON DELETE CASCADE,
  type_document text,
  nom_fichier text,
  url_stockage text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);


-- ─────────────────────────────────────────────────────
-- 4. FACTURES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE,
  prestation_id uuid REFERENCES prestations(id),
  client_id bigint REFERENCES tiers(id),
  payeur_id bigint REFERENCES tiers(id),
  type_facture text DEFAULT 'standard',
  facture_avoir_id uuid REFERENCES factures(id),
  montant_ht numeric,
  taux_tva numeric DEFAULT 20,
  montant_tva numeric,
  montant_ttc numeric,
  montant_paye numeric DEFAULT 0,
  statut text DEFAULT 'brouillon',
  date_emission date,
  date_envoi timestamptz,
  date_paiement date,
  date_echeance date,
  conditions_paiement text,
  mentions_legales text,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

DROP TRIGGER IF EXISTS set_updated_at ON factures;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 5. PAIEMENTS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS paiements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id uuid NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  date_paiement date,
  montant numeric,
  mode text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);


-- ─────────────────────────────────────────────────────
-- 6. EVALUATION_EXECUTIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestation_id uuid NOT NULL REFERENCES prestations(id),
  modele_id uuid,
  type_evaluation text,
  seuil_session numeric,
  statut text DEFAULT 'non_envoye',
  date_envoi timestamptz,
  date_relance timestamptz,
  resultats jsonb DEFAULT '{}',
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON evaluation_executions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON evaluation_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 7. SIGNAUX_QUALITE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signaux_qualite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestation_id uuid REFERENCES prestations(id),
  evaluation_execution_id uuid REFERENCES evaluation_executions(id),
  type_signal text,
  seuil_applique numeric,
  valeur_obtenue numeric,
  description_probleme text,
  action_corrective text,
  responsable text,
  statut text DEFAULT 'ouvert',
  date_cloture date,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON signaux_qualite;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON signaux_qualite
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 8. PROCEDURES_QUALITE
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS procedures_qualite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme text,
  titre text,
  version int DEFAULT 1,
  statut text DEFAULT 'brouillon',
  mode text DEFAULT 'creee',
  fichier_url text,
  responsable text,
  objectif text,
  description text,
  indicateurs_rnq text,
  parent_id uuid REFERENCES procedures_qualite(id),
  date_entree_vigueur date,
  motif_modification text,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

DROP TRIGGER IF EXISTS set_updated_at ON procedures_qualite;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON procedures_qualite
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 9. RECLAMATIONS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reclamations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_reclamation text,
  gravite text,
  prestation_id uuid REFERENCES prestations(id),
  description text,
  origine text,
  statut text DEFAULT 'ouverte',
  action_corrective text,
  date_cloture date,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

DROP TRIGGER IF EXISTS set_updated_at ON reclamations;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON reclamations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 10. APPELS (assistant IA téléphonique)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appelant_nom text,
  appelant_telephone text,
  appelant_email text,
  resume_ia text,
  transcript text,
  motif text,
  notes text,
  action_a_mener text,
  statut text DEFAULT 'a_qualifier',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON appels;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON appels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ─────────────────────────────────────────────────────
-- 11. AUDIT_LOG (journal d'audit immuable)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objet text NOT NULL,
  objet_id text NOT NULL,
  type_evenement text NOT NULL,
  champ text,
  ancienne_valeur text,
  nouvelle_valeur text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);


-- =====================================================
-- SECTION 2 : ROW LEVEL SECURITY
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestation_apprenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestation_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signaux_qualite ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures_qualite ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ── Prestations : accès par user_id ──
DROP POLICY IF EXISTS "prestations_select" ON prestations;
DROP POLICY IF EXISTS "prestations_insert" ON prestations;
DROP POLICY IF EXISTS "prestations_update" ON prestations;
DROP POLICY IF EXISTS "prestations_delete" ON prestations;
CREATE POLICY "prestations_select" ON prestations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "prestations_insert" ON prestations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prestations_update" ON prestations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "prestations_delete" ON prestations FOR DELETE
  USING (auth.uid() = user_id);

-- ── Prestation_apprenants : accès via parent prestation ──
DROP POLICY IF EXISTS "prestation_apprenants_select" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_insert" ON prestation_apprenants;
DROP POLICY IF EXISTS "prestation_apprenants_delete" ON prestation_apprenants;
CREATE POLICY "prestation_apprenants_select" ON prestation_apprenants FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.user_id = auth.uid()));
CREATE POLICY "prestation_apprenants_insert" ON prestation_apprenants FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.user_id = auth.uid()));
CREATE POLICY "prestation_apprenants_delete" ON prestation_apprenants FOR DELETE
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.user_id = auth.uid()));

-- ── Prestation_documents : accès via parent prestation ──
DROP POLICY IF EXISTS "prestation_documents_select" ON prestation_documents;
DROP POLICY IF EXISTS "prestation_documents_insert" ON prestation_documents;
CREATE POLICY "prestation_documents_select" ON prestation_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.user_id = auth.uid()));
CREATE POLICY "prestation_documents_insert" ON prestation_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM prestations p WHERE p.id = prestation_id AND p.user_id = auth.uid()));

-- ── Factures : accès par user_id ──
DROP POLICY IF EXISTS "factures_select" ON factures;
DROP POLICY IF EXISTS "factures_insert" ON factures;
DROP POLICY IF EXISTS "factures_update" ON factures;
DROP POLICY IF EXISTS "factures_delete" ON factures;
CREATE POLICY "factures_select" ON factures FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "factures_insert" ON factures FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "factures_update" ON factures FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "factures_delete" ON factures FOR DELETE
  USING (auth.uid() = user_id);

-- ── Paiements : accès via parent facture ──
DROP POLICY IF EXISTS "paiements_select" ON paiements;
DROP POLICY IF EXISTS "paiements_insert" ON paiements;
CREATE POLICY "paiements_select" ON paiements FOR SELECT
  USING (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND f.user_id = auth.uid()));
CREATE POLICY "paiements_insert" ON paiements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM factures f WHERE f.id = facture_id AND f.user_id = auth.uid()));

-- ── Evaluation_executions : accès par user_id ──
DROP POLICY IF EXISTS "eval_exec_select" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_insert" ON evaluation_executions;
DROP POLICY IF EXISTS "eval_exec_update" ON evaluation_executions;
CREATE POLICY "eval_exec_select" ON evaluation_executions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "eval_exec_insert" ON evaluation_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eval_exec_update" ON evaluation_executions FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Signaux_qualite : accès par user_id ──
DROP POLICY IF EXISTS "signaux_select" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_insert" ON signaux_qualite;
DROP POLICY IF EXISTS "signaux_update" ON signaux_qualite;
CREATE POLICY "signaux_select" ON signaux_qualite FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "signaux_insert" ON signaux_qualite FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "signaux_update" ON signaux_qualite FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Procedures_qualite : accès par user_id ──
DROP POLICY IF EXISTS "procedures_select" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_insert" ON procedures_qualite;
DROP POLICY IF EXISTS "procedures_update" ON procedures_qualite;
CREATE POLICY "procedures_select" ON procedures_qualite FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "procedures_insert" ON procedures_qualite FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "procedures_update" ON procedures_qualite FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Reclamations : accès par user_id ──
DROP POLICY IF EXISTS "reclamations_select" ON reclamations;
DROP POLICY IF EXISTS "reclamations_insert" ON reclamations;
DROP POLICY IF EXISTS "reclamations_update" ON reclamations;
CREATE POLICY "reclamations_select" ON reclamations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "reclamations_insert" ON reclamations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reclamations_update" ON reclamations FOR UPDATE
  USING (auth.uid() = user_id);

-- ── Appels : tous les utilisateurs authentifiés peuvent lire ──
DROP POLICY IF EXISTS "appels_select" ON appels;
DROP POLICY IF EXISTS "appels_insert" ON appels;
DROP POLICY IF EXISTS "appels_update" ON appels;
CREATE POLICY "appels_select" ON appels FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "appels_insert" ON appels FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "appels_update" ON appels FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ── Audit_log : insert pour tous, lecture de ses propres entrées, pas de modif ──
DROP POLICY IF EXISTS "audit_insert" ON audit_log;
DROP POLICY IF EXISTS "audit_select" ON audit_log;
CREATE POLICY "audit_insert" ON audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "audit_select" ON audit_log FOR SELECT
  USING (auth.uid() = user_id);


-- =====================================================
-- SECTION 3 : INDEX
-- =====================================================

-- Prestations
CREATE INDEX IF NOT EXISTS idx_prestations_user_id ON prestations(user_id);
CREATE INDEX IF NOT EXISTS idx_prestations_type ON prestations(type);
CREATE INDEX IF NOT EXISTS idx_prestations_statut ON prestations(statut);
CREATE INDEX IF NOT EXISTS idx_prestations_active ON prestations(deleted_at) WHERE deleted_at IS NULL;

-- Prestation_apprenants
CREATE INDEX IF NOT EXISTS idx_presta_appr_prestation ON prestation_apprenants(prestation_id);
CREATE INDEX IF NOT EXISTS idx_presta_appr_apprenant ON prestation_apprenants(apprenant_id);

-- Prestation_documents
CREATE INDEX IF NOT EXISTS idx_presta_docs_prestation ON prestation_documents(prestation_id);

-- Factures
CREATE INDEX IF NOT EXISTS idx_factures_user_id ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);
CREATE INDEX IF NOT EXISTS idx_factures_prestation ON factures(prestation_id);
CREATE INDEX IF NOT EXISTS idx_factures_active ON factures(deleted_at) WHERE deleted_at IS NULL;

-- Paiements
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);

-- Evaluation_executions
CREATE INDEX IF NOT EXISTS idx_eval_exec_prestation ON evaluation_executions(prestation_id);
CREATE INDEX IF NOT EXISTS idx_eval_exec_statut ON evaluation_executions(statut);

-- Signaux_qualite
CREATE INDEX IF NOT EXISTS idx_signaux_prestation ON signaux_qualite(prestation_id);
CREATE INDEX IF NOT EXISTS idx_signaux_statut ON signaux_qualite(statut);

-- Procedures_qualite
CREATE INDEX IF NOT EXISTS idx_procedures_theme ON procedures_qualite(theme);
CREATE INDEX IF NOT EXISTS idx_procedures_active ON procedures_qualite(deleted_at) WHERE deleted_at IS NULL;

-- Reclamations
CREATE INDEX IF NOT EXISTS idx_reclamations_statut ON reclamations(statut);
CREATE INDEX IF NOT EXISTS idx_reclamations_active ON reclamations(deleted_at) WHERE deleted_at IS NULL;

-- Appels
CREATE INDEX IF NOT EXISTS idx_appels_statut ON appels(statut);
CREATE INDEX IF NOT EXISTS idx_appels_created ON appels(created_at DESC);

-- Audit_log
CREATE INDEX IF NOT EXISTS idx_audit_objet ON audit_log(objet, objet_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);


-- =====================================================
-- FIN — Exécutez ce script dans Supabase SQL Editor
-- =====================================================
