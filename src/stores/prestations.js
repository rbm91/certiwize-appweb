import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { useAuditTrail } from '../composables/useAuditTrail';
import {
  PRESTATION_COLORS,
  FORMATION_WORKFLOW_STEPS,
  COACHING_WORKFLOW_STEPS,
  CONSEIL_WORKFLOW_STEPS,
} from '../config/constants';

const cleanPayload = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value;
  }
  return cleaned;
};

const generateReference = (type) => {
  const prefixes = { formation: 'FOR', coaching: 'COA', conseil: 'CON' };
  const prefix = prefixes[type] || 'PRE';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const seq = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}${year}${month}-${seq}`;
};

export const usePrestationsStore = defineStore('prestations', () => {
  const prestations = ref([]);
  const currentPrestation = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const auth = useAuthStore();
  const { logEvent } = useAuditTrail();

  // ── Getters ──

  const activePrestations = computed(() =>
    prestations.value.filter(p => !p.deleted_at)
  );

  const prestationsByType = (type) =>
    activePrestations.value.filter(p => p.type === type);

  const formations = computed(() => prestationsByType('formation'));
  const coachings = computed(() => prestationsByType('coaching'));
  const conseils = computed(() => prestationsByType('conseil'));

  /**
   * Retourne les étapes workflow pour un type de prestation
   */
  const getWorkflowSteps = (type) => {
    switch (type) {
      case 'formation': return FORMATION_WORKFLOW_STEPS;
      case 'coaching': return COACHING_WORKFLOW_STEPS;
      case 'conseil': return CONSEIL_WORKFLOW_STEPS;
      default: return [];
    }
  };

  // ── Fetch ──

  const fetchPrestations = async (type = null) => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    error.value = null;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('prestations')
        .select(`
          *,
          client:client_id(id, nom_affiche, raison_sociale),
          payeur:payeur_id(id, nom_affiche, raison_sociale),
          formateur:formateur_id(id, nom_affiche),
          prestation_apprenants(*, apprenant:apprenant_id(id, nom_affiche, email))
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      if (!auth.isSuperAdmin) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      prestations.value = data || [];
    } catch (err) {
      error.value = err.message;
      console.error('[PrestationsStore] fetchPrestations:', err.message);
    } finally {
      loading.value = false;
    }
  };

  const fetchPrestationById = async (id) => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('prestations')
        .select(`
          *,
          client:client_id(id, nom_affiche, raison_sociale, email),
          payeur:payeur_id(id, nom_affiche, raison_sociale, email),
          formateur:formateur_id(id, nom_affiche, email),
          contact_signataire:contact_signataire_id(id, nom_affiche, email),
          prestation_apprenants(*, apprenant:apprenant_id(id, nom_affiche, email, date_naissance, situation_handicap)),
          prestation_documents(*)
        `)
        .eq('id', id);

      if (!auth.isSuperAdmin) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query.single();

      if (err) throw err;
      currentPrestation.value = data;
      return data;
    } catch (err) {
      console.error('[PrestationsStore] fetchById:', err.message);
      return null;
    }
  };

  // ── CRUD ──

  const createPrestation = async (prestationData) => {
    loading.value = true;
    try {
      const type = prestationData.type || 'formation';
      const color = PRESTATION_COLORS[type] || '#3B82F6';

      // Récupérer l'organization_id de l'utilisateur
      let organizationId = null;
      try {
        const { data: orgData } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', auth.user.id)
          .limit(1)
          .single();

        if (orgData) {
          organizationId = orgData.organization_id;
        }
      } catch (err) {
        console.warn('[PrestationsStore] Utilisateur sans organisation:', err.message);
      }

      const finalData = cleanPayload({
        ...prestationData,
        reference: prestationData.reference || generateReference(type),
        couleur: color,
        etape_courante: 1,
        statut: 'brouillon',
        workflow_data: prestationData.workflow_data || {},
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
        organization_id: organizationId,
      });

      const { data, error: err } = await supabase
        .from('prestations')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      prestations.value.unshift(data);

      await logEvent('prestation', data.id, 'creation', null, null, {
        type, intitule: prestationData.intitule, reference: data.reference,
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updatePrestation = async (id, updates) => {
    loading.value = true;
    try {
      const old = prestations.value.find(p => p.id === id);

      const { data, error: err } = await supabase
        .from('prestations')
        .update({ ...cleanPayload(updates), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      const index = prestations.value.findIndex(p => p.id === id);
      if (index !== -1) prestations.value[index] = data;
      if (currentPrestation.value?.id === id) currentPrestation.value = data;

      await logEvent('prestation', id, 'modification', null,
        old ? { statut: old.statut, etape: old.etape_courante } : null,
        { statut: data.statut, etape: data.etape_courante }
      );

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Progression d'une étape du workflow
   */
  const updateWorkflowStep = async (id, step, stepData) => {
    try {
      const prestation = prestations.value.find(p => p.id === id) || await fetchPrestationById(id);
      if (!prestation) throw new Error('Prestation introuvable');

      const workflowData = { ...(prestation.workflow_data || {}), [step]: stepData };

      return await updatePrestation(id, {
        workflow_data: workflowData,
        etape_courante: Math.max(prestation.etape_courante || 1, step),
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Apprenants ──

  const addApprenant = async (prestationId, apprenantId) => {
    try {
      const { error: err } = await supabase
        .from('prestation_apprenants')
        .insert({ prestation_id: prestationId, apprenant_id: apprenantId });

      if (err) throw err;

      await logEvent('prestation', prestationId, 'ajout_apprenant', null, null, apprenantId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeApprenant = async (prestationId, apprenantId) => {
    try {
      const { error: err } = await supabase
        .from('prestation_apprenants')
        .delete()
        .eq('prestation_id', prestationId)
        .eq('apprenant_id', apprenantId);

      if (err) throw err;

      await logEvent('prestation', prestationId, 'suppression_apprenant', null, apprenantId, null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Documents ──

  const uploadDocument = async (prestationId, typeDocument, file) => {
    try {
      const authStore = useAuthStore();
      await authStore.refreshSession();

      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${authStore.user.id}/prestations/${prestationId}/${typeDocument}-${Date.now()}-${cleanName}`;

      const { error: uploadErr } = await supabase.storage
        .from('project-docs')
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('project-docs')
        .getPublicUrl(fileName);

      const { data, error: insertErr } = await supabase
        .from('prestation_documents')
        .insert({
          prestation_id: prestationId,
          type_document: typeDocument,
          nom_fichier: file.name,
          url_stockage: urlData.publicUrl,
          created_by: authStore.user.id,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Clôture ──

  /**
   * Vérifie si une session peut être clôturée
   * Bloqué si signal qualité ouvert
   */
  const canCloseSession = async (prestationId) => {
    try {
      const { data, error: err } = await supabase
        .from('signaux_qualite')
        .select('id, type_signal, statut')
        .eq('prestation_id', prestationId)
        .in('statut', ['ouvert', 'en_analyse']);

      if (err) throw err;

      const openSignals = data || [];
      return {
        canClose: openSignals.length === 0,
        openSignals,
        message: openSignals.length > 0
          ? `${openSignals.length} signal(s) qualité non clôturé(s) — clôture impossible`
          : null,
      };
    } catch {
      return { canClose: true, openSignals: [], message: null };
    }
  };

  /**
   * Clôture une prestation
   */
  const closePrestation = async (id) => {
    const check = await canCloseSession(id);
    if (!check.canClose) {
      return { success: false, error: check.message };
    }

    return await updatePrestation(id, {
      statut: 'terminee',
    });
  };

  const softDeletePrestation = async (id) => {
    try {
      const { error: err } = await supabase
        .from('prestations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (err) throw err;

      prestations.value = prestations.value.filter(p => p.id !== id);
      await logEvent('prestation', id, 'archivage');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    // State
    prestations,
    currentPrestation,
    loading,
    error,
    // Getters
    activePrestations,
    formations,
    coachings,
    conseils,
    prestationsByType,
    getWorkflowSteps,
    // Fetch
    fetchPrestations,
    fetchPrestationById,
    // CRUD
    createPrestation,
    updatePrestation,
    updateWorkflowStep,
    softDeletePrestation,
    // Apprenants
    addApprenant,
    removeApprenant,
    // Documents
    uploadDocument,
    // Clôture
    canCloseSession,
    closePrestation,
  };
});
