import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { useAuditTrail } from '../composables/useAuditTrail';

const cleanPayload = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value;
  }
  return cleaned;
};

export const useQualiteStore = defineStore('qualite', () => {
  const procedures = ref([]);
  const reclamations = ref([]);
  const signaux = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const auth = useAuthStore();
  const { logEvent } = useAuditTrail();

  // ── Getters ──

  const activeProcedures = computed(() =>
    procedures.value.filter(p => !p.deleted_at)
  );

  const proceduresParTheme = (theme) =>
    activeProcedures.value.filter(p => p.theme === theme);

  const activeReclamations = computed(() =>
    reclamations.value.filter(r => !r.deleted_at)
  );

  const reclamationsOuvertes = computed(() =>
    activeReclamations.value.filter(r => r.statut !== 'cloturee')
  );

  const signauxOuverts = computed(() =>
    signaux.value.filter(s => s.statut === 'ouvert')
  );

  const signauxEnAnalyse = computed(() =>
    signaux.value.filter(s => s.statut === 'en_analyse')
  );

  const signauxClos = computed(() =>
    signaux.value.filter(s => s.statut === 'clos')
  );

  // ═══════════════════════════════════
  // PROCÉDURES QUALITÉ (Manuel Qualiopi)
  // ═══════════════════════════════════

  const fetchProcedures = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('procedures_qualite')
        .select('*')
        .is('deleted_at', null)
        .order('theme', { ascending: true })
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      procedures.value = data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createProcedure = async (procedureData) => {
    loading.value = true;
    try {
      const finalData = cleanPayload({
        ...procedureData,
        statut: 'brouillon',
        version: 1,
        mode: procedureData.fichier_url ? 'importee' : 'creee',
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
      });

      const { data, error: err } = await supabase
        .from('procedures_qualite')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      procedures.value.unshift(data);
      await logEvent('procedure_qualite', data.id, 'creation', null, null, { theme: data.theme, titre: data.titre });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateProcedure = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('procedures_qualite')
        .update({ ...cleanPayload(updates), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      const index = procedures.value.findIndex(p => p.id === id);
      if (index !== -1) procedures.value[index] = data;

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Valider une procédure — verrouillage
   */
  const validerProcedure = async (id) => {
    const result = await updateProcedure(id, {
      statut: 'validee',
      date_entree_vigueur: new Date().toISOString().split('T')[0],
    });

    if (result.success) {
      await logEvent('procedure_qualite', id, 'validation');
    }
    return result;
  };

  /**
   * Archiver une procédure
   */
  const archiverProcedure = async (id) => {
    const result = await updateProcedure(id, { statut: 'archivee' });
    if (result.success) {
      await logEvent('procedure_qualite', id, 'archivage');
    }
    return result;
  };

  /**
   * Créer une nouvelle version (archive l'ancienne, crée copie incrémentée)
   */
  const createVersion = async (procedureId) => {
    try {
      const old = procedures.value.find(p => p.id === procedureId);
      if (!old) throw new Error('Procédure introuvable');

      // Archiver l'ancienne
      await archiverProcedure(procedureId);

      // Créer la nouvelle version
      const newData = {
        theme: old.theme,
        titre: old.titre,
        version: (old.version || 1) + 1,
        mode: old.mode,
        responsable: old.responsable,
        objectif: old.objectif,
        description: old.description,
        indicateurs_rnq: old.indicateurs_rnq,
        parent_id: procedureId,
        motif_modification: '',
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
      };

      return await createProcedure(newData);
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Import d'un fichier comme procédure
   */
  const importProcedure = async (file, metadata) => {
    try {
      const authStore = useAuthStore();
      await authStore.refreshSession();

      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${authStore.user.id}/procedures/${Date.now()}-${cleanName}`;

      const { error: uploadErr } = await supabase.storage
        .from('project-docs')
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('project-docs')
        .getPublicUrl(fileName);

      return await createProcedure({
        ...metadata,
        fichier_url: urlData.publicUrl,
        mode: 'importee',
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ═══════════════════════════════════
  // RÉCLAMATIONS
  // ═══════════════════════════════════

  const fetchReclamations = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('reclamations')
        .select('*, prestation:prestation_id(id, intitule, reference)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      reclamations.value = data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const createReclamation = async (reclamationData) => {
    try {
      const finalData = cleanPayload({
        ...reclamationData,
        statut: 'ouverte',
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
      });

      const { data, error: err } = await supabase
        .from('reclamations')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      reclamations.value.unshift(data);
      await logEvent('reclamation', data.id, 'creation', null, null, {
        type: data.type_reclamation, gravite: data.gravite,
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateReclamation = async (id, updates) => {
    try {
      const { data, error: err } = await supabase
        .from('reclamations')
        .update({ ...cleanPayload(updates), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (err) throw err;

      const index = reclamations.value.findIndex(r => r.id === id);
      if (index !== -1) reclamations.value[index] = data;

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const closeReclamation = async (id, dateCloture = null) => {
    const result = await updateReclamation(id, {
      statut: 'cloturee',
      date_cloture: dateCloture || new Date().toISOString().split('T')[0],
    });

    if (result.success) {
      await logEvent('reclamation', id, 'cloture');
    }
    return result;
  };

  // ═══════════════════════════════════
  // SIGNAUX QUALITÉ
  // ═══════════════════════════════════

  const fetchSignaux = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('signaux_qualite')
        .select('*, prestation:prestation_id(id, intitule, reference, type)')
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      signaux.value = data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Créer un signal qualité (généré automatiquement par les évaluations)
   */
  const createSignal = async (signalData) => {
    try {
      const finalData = cleanPayload({
        ...signalData,
        statut: 'ouvert',
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
      });

      const { data, error: err } = await supabase
        .from('signaux_qualite')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      signaux.value.unshift(data);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Clôturer un signal qualité
   * Exige : description_probleme + action_corrective + responsable
   */
  const closeSignal = async (signalId, closureData) => {
    if (!closureData.description_probleme || !closureData.action_corrective || !closureData.responsable) {
      return {
        success: false,
        error: 'La description, l\'action corrective et le responsable sont obligatoires pour clôturer un signal',
      };
    }

    try {
      const { data, error: err } = await supabase
        .from('signaux_qualite')
        .update({
          ...closureData,
          statut: 'clos',
          date_cloture: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', signalId)
        .select()
        .single();

      if (err) throw err;

      const index = signaux.value.findIndex(s => s.id === signalId);
      if (index !== -1) signaux.value[index] = data;

      await logEvent('signal_qualite', signalId, 'cloture', null, null, closureData);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    // State
    procedures,
    reclamations,
    signaux,
    loading,
    error,
    // Getters
    activeProcedures,
    proceduresParTheme,
    activeReclamations,
    reclamationsOuvertes,
    signauxOuverts,
    signauxEnAnalyse,
    signauxClos,
    // Procédures
    fetchProcedures,
    createProcedure,
    updateProcedure,
    validerProcedure,
    archiverProcedure,
    createVersion,
    importProcedure,
    // Réclamations
    fetchReclamations,
    createReclamation,
    updateReclamation,
    closeReclamation,
    // Signaux
    fetchSignaux,
    createSignal,
    closeSignal,
  };
});
