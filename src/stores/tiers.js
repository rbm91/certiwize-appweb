import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { useAuditTrail } from '../composables/useAuditTrail';
import { useConformityScore } from '../composables/useConformityScore';

/**
 * Nettoie un payload avant envoi à Supabase :
 * supprime les champs undefined, null et chaînes vides.
 * Conserve les booléens (false), les nombres (0) et les tableaux vides [].
 */
const cleanPayload = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    cleaned[key] = value;
  }
  return cleaned;
};

const generateCode = (prefix) => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const sequence = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
  return `${prefix}${year}${month}-${sequence}`;
};

export const useTiersStore = defineStore('tiers', () => {
  const tiers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const auth = useAuthStore();
  const { logEvent } = useAuditTrail();
  const { computeScore } = useConformityScore();

  // ── Getters ──

  const activeTiers = computed(() =>
    tiers.value.filter(t => !t.deleted_at && t.statut !== 'archive')
  );

  const personnesPhysiques = computed(() =>
    activeTiers.value.filter(t => t.nature === 'personne_physique')
  );

  const organisations = computed(() =>
    activeTiers.value.filter(t => t.nature === 'organisation')
  );

  /**
   * Filtre les tiers par rôle
   */
  const tiersByRole = (role) =>
    activeTiers.value.filter(t =>
      t.tiers_roles?.some(r => r.role === role)
    );

  // ── Fetch ──

  const fetchTiers = async () => {
    const orgId = auth.currentOrganization?.id;
    if (!orgId && !auth.isSuperAdmin) return;

    loading.value = true;
    error.value = null;
    try {
      let query = supabase
        .from('tiers')
        .select('*, tiers_roles(*), profiles:user_id(email)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filtrage par organisation (super-admin voit tout)
      if (!auth.isSuperAdmin) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      tiers.value = data || [];
    } catch (err) {
      error.value = err.message;
      console.error('[TiersStore] fetchTiers:', err.message);
    } finally {
      loading.value = false;
    }
  };

  // ── CRUD ──

  const createTier = async (tierData, roles = []) => {
    const orgId = auth.currentOrganization?.id;
    if (!orgId) return { success: false, error: 'Aucune organisation sélectionnée' };

    loading.value = true;
    try {
      const scoreResult = computeScore(tierData, roles, []);

      const finalData = cleanPayload({
        ...tierData,
        code_client: tierData.code_client || generateCode('CU'),
        code_fournisseur: tierData.code_fournisseur || generateCode('SU'),
        score_completude: scoreResult.score,
        organization_id: orgId,
        user_id: auth.user.id, // traçabilité : qui a créé
      });

      const { data, error: err } = await supabase
        .from('tiers')
        .insert([finalData])
        .select()
        .single();

      if (err) throw err;

      // Insérer les rôles
      if (roles.length > 0) {
        const rolesPayload = roles.map(role => ({
          tiers_id: data.id,
          role,
          created_by: auth.user.id,
        }));

        const { error: rolesErr } = await supabase
          .from('tiers_roles')
          .insert(rolesPayload);

        if (rolesErr) console.warn('[TiersStore] Erreur rôles:', rolesErr.message);
      }

      // Recharger le tiers avec ses rôles
      const { data: fullTier } = await supabase
        .from('tiers')
        .select('*, tiers_roles(*)')
        .eq('id', data.id)
        .single();

      if (fullTier) tiers.value.unshift(fullTier);

      // Audit
      await logEvent('tiers', data.id, 'creation', null, null, {
        nature: tierData.nature,
        nom_affiche: tierData.nom_affiche,
        roles,
      });

      return { success: true, data: fullTier || data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateTier = async (id, updates, currentRoles = null) => {
    loading.value = true;
    try {
      const oldTier = tiers.value.find(t => t.id === id);

      if (currentRoles !== null) {
        const scoreResult = computeScore({ ...oldTier, ...updates }, currentRoles, []);
        updates.score_completude = scoreResult.score;
      }

      const { data, error: err } = await supabase
        .from('tiers')
        .update(cleanPayload(updates))
        .eq('id', id)
        .select('*, tiers_roles(*)')
        .single();

      if (err) throw err;

      const index = tiers.value.findIndex(t => t.id === id);
      if (index !== -1) {
        tiers.value[index] = data;
      }

      // Audit
      const changedFields = Object.keys(updates).filter(
        key => oldTier && JSON.stringify(oldTier[key]) !== JSON.stringify(updates[key])
      );
      if (changedFields.length > 0) {
        await logEvent('tiers', id, 'modification', changedFields.join(', '),
          changedFields.reduce((acc, k) => ({ ...acc, [k]: oldTier?.[k] }), {}),
          changedFields.reduce((acc, k) => ({ ...acc, [k]: updates[k] }), {})
        );
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const softDeleteTier = async (id) => {
    try {
      const { error: err } = await supabase
        .from('tiers')
        .update({ deleted_at: new Date().toISOString(), statut: 'archive' })
        .eq('id', id);

      if (err) throw err;

      tiers.value = tiers.value.filter(t => t.id !== id);

      await logEvent('tiers', id, 'archivage');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getTierById = async (id) => {
    const local = tiers.value.find(t => t.id === id);
    if (local) return local;

    try {
      const { data, error: err } = await supabase
        .from('tiers')
        .select('*, tiers_roles(*)')
        .eq('id', id)
        .single();

      if (err) throw err;
      return data;
    } catch {
      return null;
    }
  };

  // ── Rôles ──

  const addRole = async (tiersId, role) => {
    try {
      const { error: err } = await supabase
        .from('tiers_roles')
        .insert({ tiers_id: tiersId, role, created_by: auth.user.id });

      if (err) throw err;

      const tier = tiers.value.find(t => t.id === tiersId);
      if (tier) {
        if (!tier.tiers_roles) tier.tiers_roles = [];
        tier.tiers_roles.push({ tiers_id: tiersId, role });
      }

      await logEvent('tiers', tiersId, 'ajout_role', 'role', null, role);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeRole = async (tiersId, role) => {
    try {
      const { error: err } = await supabase
        .from('tiers_roles')
        .delete()
        .eq('tiers_id', tiersId)
        .eq('role', role);

      if (err) throw err;

      const tier = tiers.value.find(t => t.id === tiersId);
      if (tier?.tiers_roles) {
        tier.tiers_roles = tier.tiers_roles.filter(r => r.role !== role);
      }

      await logEvent('tiers', tiersId, 'suppression_role', 'role', role, null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Relations personne ↔ organisation ──

  const fetchRelations = async (tiersId) => {
    try {
      const { data, error: err } = await supabase
        .from('tiers_relations')
        .select('*, personne:personne_id(id, nom_affiche, email), organisation:organisation_id(id, nom_affiche, raison_sociale)')
        .or(`personne_id.eq.${tiersId},organisation_id.eq.${tiersId}`)
        .order('created_at', { ascending: false });

      if (err) throw err;
      return data || [];
    } catch {
      return [];
    }
  };

  const addRelation = async (personneId, organisationId, typeRelation) => {
    try {
      const { data, error: err } = await supabase
        .from('tiers_relations')
        .insert({ personne_id: personneId, organisation_id: organisationId, type_relation: typeRelation })
        .select()
        .single();

      if (err) throw err;

      await logEvent('tiers', personneId, 'ajout_relation', 'relation',
        null, { organisation_id: organisationId, type: typeRelation });
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const removeRelation = async (relationId, personneId) => {
    try {
      const { error: err } = await supabase
        .from('tiers_relations')
        .delete()
        .eq('id', relationId);

      if (err) throw err;

      await logEvent('tiers', personneId, 'suppression_relation', 'relation', relationId, null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Documents ──

  const fetchDocuments = async (tiersId) => {
    try {
      const { data, error: err } = await supabase
        .from('tier_documents')
        .select('*')
        .eq('tiers_id', tiersId)
        .order('date_ajout', { ascending: false });

      if (err) throw err;
      return data || [];
    } catch {
      return [];
    }
  };

  const uploadDocument = async (tiersId, typeDocument, file) => {
    try {
      const authStore = useAuthStore();
      await authStore.refreshSession();

      const orgId = authStore.currentOrganization?.id || 'no-org';
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${orgId}/${authStore.user.id}/tiers/${tiersId}/${typeDocument}-${Date.now()}-${cleanName}`;

      const { error: uploadErr } = await supabase.storage
        .from('tier-files')
        .upload(fileName, file);

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('tier-files')
        .getPublicUrl(fileName);

      const { data, error: insertErr } = await supabase
        .from('tier_documents')
        .insert({
          tiers_id: tiersId,
          type_document: typeDocument,
          nom_fichier: file.name,
          url_stockage: urlData.publicUrl,
          ajoute_par: authStore.user.id,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      await logEvent('tiers', tiersId, 'ajout_document', 'document', null, {
        type: typeDocument, nom: file.name
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteDocument = async (documentId, tiersId) => {
    try {
      const { error: err } = await supabase
        .from('tier_documents')
        .delete()
        .eq('id', documentId);

      if (err) throw err;

      await logEvent('tiers', tiersId, 'suppression_document', 'document', documentId, null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    // State
    tiers,
    loading,
    error,
    // Getters
    activeTiers,
    personnesPhysiques,
    organisations,
    tiersByRole,
    // CRUD
    fetchTiers,
    createTier,
    updateTier,
    softDeleteTier,
    getTierById,
    // Rôles
    addRole,
    removeRole,
    // Relations
    fetchRelations,
    addRelation,
    removeRelation,
    // Documents
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
});
