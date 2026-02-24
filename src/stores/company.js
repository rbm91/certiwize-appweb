import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

/**
 * Valeurs par défaut CDC — 6 onglets Paramètres
 */
const DEFAULT_COMPANY = {
  // Onglet 1 : Identité & coordonnées
  name: '',
  forme_juridique: '',
  address: '',
  zip_code: '',
  city: '',
  country: 'France',
  phone: '',
  email: '',
  currency: 'EUR',
  logo_url: '',
  representant_legal: '',
  website: '',

  // Onglet 2 : Juridique & conformité
  nda_numero: '',
  nda_date_enregistrement: null,
  nda_region: '',
  nda_afficher_conventions: false,
  nda_afficher_factures: false,
  nda_afficher_commerciaux: false,
  qualiopi_certifie: false,
  qualiopi_certificateur: '',
  qualiopi_date_certification: null,
  qualiopi_date_fin: null,
  qualiopi_certificat_url: '',
  handicap_nom: '',
  handicap_fonction: '',
  handicap_email: '',
  handicap_telephone: '',
  handicap_afficher_programmes: false,

  // Onglet 3 : Paramètres documents
  doc_afficher_logo: true,
  doc_signature_representant: false,
  doc_mention_rgpd: false,
  doc_mention_nda: false,

  // Onglet 4 : Email & envoi
  email_nom_expediteur: '',
  email_signature: '',
  email_envoi_auto: false,
  email_signature_electronique: false,

  // Onglet 5 : RGPD & DPO
  dpo_nom: '',
  dpo_email: '',
  politique_confidentialite: '',
  duree_conservation_donnees: 5,

  // Onglet 6 : Financier
  tva_assujetti: true,
  tva_taux_defaut: 20.00,
  iban: '',
  bic: '',

  // Seuils qualité
  seuil_satisfaction_chaud: 80,
  seuil_satisfaction_formateur: 80,
  seuil_satisfaction_financeur: 80,
  seuil_quiz_validation: 70,
  seuil_taux_reponse: 60,
  declenchement_question_critique: true,

  // Paramètres facturation
  acompte_pourcentage: 30,
  acomptes_multiples: false,
  penalite_annulation: false,
  penalite_pourcentage: 0,
  conditions_paiement_defaut: '30_jours',

  // Champs existants conservés
  taxes_config: { vat_subject: true, tax_2: false, tax_3: false, fiscal_stamp: false },
  socials: {},
  opening_hours: {
    lundi: '', mardi: '', mercredi: '', jeudi: '', vendredi: '', samedi: '', dimanche: ''
  },
  accountant_info: {},
};

/**
 * Nettoyage du payload avant envoi à Supabase.
 * Supprime les clés undefined pour éviter les erreurs.
 */
const cleanPayload = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

export const useCompanyStore = defineStore('company', () => {
  const company = ref(null);
  const loading = ref(false);
  const auth = useAuthStore();

  // ── Getters utiles ──

  const isQualiopi = computed(() => !!company.value?.qualiopi_certifie);
  const hasNDA = computed(() => !!company.value?.nda_numero);
  const seuilSatisfaction = computed(() => company.value?.seuil_satisfaction_chaud || 80);
  const seuilQuiz = computed(() => company.value?.seuil_quiz_validation || 70);
  const tauxTvaDefaut = computed(() => company.value?.tva_taux_defaut || 20);

  /**
   * Initialiser les données (récupérer ou créer une entrée vide)
   * Filtré par organization_id au lieu de user_id
   */
  const fetchCompany = async () => {
    const orgId = auth.currentOrganization?.id;
    if (!orgId) return;

    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Merger avec les défauts pour les nouveaux champs CDC
        company.value = { ...DEFAULT_COMPANY, ...data };
      } else {
        company.value = {
          ...DEFAULT_COMPANY,
          organization_id: orgId,
          user_id: auth.user?.id,
        };
      }
    } catch (err) {
      // Erreur silencieuse — les données par défaut seront utilisées
      company.value = { ...DEFAULT_COMPANY, organization_id: orgId, user_id: auth.user?.id };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sauvegarde complète (upsert)
   * Conflit sur organization_id au lieu de user_id
   */
  const saveCompany = async (formValues) => {
    const orgId = auth.currentOrganization?.id;
    loading.value = true;
    try {
      const payload = cleanPayload({
        ...formValues,
        organization_id: orgId,
        user_id: auth.user?.id,
        updated_at: new Date()
      });

      if (!payload.organization_id) {
        throw new Error("Aucune organisation sélectionnée.");
      }

      const { data, error } = await supabase
        .from('companies')
        .upsert(payload, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;

      company.value = { ...DEFAULT_COMPANY, ...data };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Unknown error' };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sauvegarde partielle — met à jour uniquement certains champs
   */
  const savePartial = async (partialValues) => {
    if (!company.value?.id && !company.value?.organization_id) {
      return { success: false, error: 'Aucune entreprise chargée' };
    }

    return await saveCompany({
      ...company.value,
      ...partialValues,
    });
  };

  return {
    company,
    loading,
    // Getters
    isQualiopi,
    hasNDA,
    seuilSatisfaction,
    seuilQuiz,
    tauxTvaDefaut,
    // Actions
    fetchCompany,
    saveCompany,
    savePartial,
  };
});
