-- ============================================================================
-- Migration : Ajout des colonnes manquantes dans la table companies
-- IDEMPOTENT : safe to re-run
-- ============================================================================

-- ── Onglet 2 : Juridique & conformité — NDA ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_numero TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_date_enregistrement DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_region TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_afficher_conventions BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_afficher_factures BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS nda_afficher_commerciaux BOOLEAN DEFAULT FALSE;

-- ── Onglet 2 : Juridique & conformité — Qualiopi ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualiopi_certifie BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualiopi_certificateur TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualiopi_date_certification DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualiopi_date_fin DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS qualiopi_certificat_url TEXT DEFAULT '';

-- ── Onglet 2 : Juridique & conformité — Référent handicap ──
-- Renommage conditionnel : handicap_referent → handicap_nom
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'handicap_referent') THEN
    ALTER TABLE companies RENAME COLUMN handicap_referent TO handicap_nom;
  END IF;
END $$;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS handicap_nom TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS handicap_fonction TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS handicap_email TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS handicap_telephone TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS handicap_afficher_programmes BOOLEAN DEFAULT FALSE;

-- ── Onglet 2 : Juridique & conformité — Représentant légal ──
-- Renommage conditionnel : manager_name → representant_legal
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'manager_name') THEN
    ALTER TABLE companies RENAME COLUMN manager_name TO representant_legal;
  END IF;
END $$;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS representant_legal TEXT DEFAULT '';

-- ── Onglet 2 : Juridique & conformité — Forme juridique ──
-- Renommage conditionnel : legal_entity_type → forme_juridique
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'legal_entity_type') THEN
    ALTER TABLE companies RENAME COLUMN legal_entity_type TO forme_juridique;
  END IF;
END $$;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS forme_juridique TEXT DEFAULT '';

-- ── Onglet 3 : Paramètres documents ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS doc_afficher_logo BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS doc_signature_representant BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS doc_mention_rgpd BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS doc_mention_nda BOOLEAN DEFAULT FALSE;

-- ── Onglet 4 : Email & envoi ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_nom_expediteur TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_signature TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_envoi_auto BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_signature_electronique BOOLEAN DEFAULT FALSE;

-- ── Onglet 5 : RGPD & DPO ──
-- Renommage conditionnel : dpo_name → dpo_nom
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'dpo_name') THEN
    ALTER TABLE companies RENAME COLUMN dpo_name TO dpo_nom;
  END IF;
END $$;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS dpo_nom TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS dpo_email TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS politique_confidentialite TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS duree_conservation_donnees INTEGER DEFAULT 5;

-- ── Onglet 6 : Financier ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tva_assujetti BOOLEAN DEFAULT TRUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tva_taux_defaut NUMERIC(5,2) DEFAULT 20.00;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS iban TEXT DEFAULT '';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bic TEXT DEFAULT '';

-- ── Seuils qualité ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seuil_satisfaction_chaud INTEGER DEFAULT 80;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seuil_satisfaction_formateur INTEGER DEFAULT 80;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seuil_satisfaction_financeur INTEGER DEFAULT 80;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seuil_quiz_validation INTEGER DEFAULT 70;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS seuil_taux_reponse INTEGER DEFAULT 60;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS declenchement_question_critique BOOLEAN DEFAULT TRUE;

-- ── Paramètres facturation ──
ALTER TABLE companies ADD COLUMN IF NOT EXISTS acompte_pourcentage INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS acomptes_multiples BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS penalite_annulation BOOLEAN DEFAULT FALSE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS penalite_pourcentage INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS conditions_paiement_defaut TEXT DEFAULT '30_jours';
