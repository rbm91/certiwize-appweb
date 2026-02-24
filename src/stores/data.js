import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

/**
 * Génère un code référence avec préfixe + date + séquence aléatoire
 * @param {string} prefix - Préfixe (ex: 'CU', 'SU', 'FOR')
 * @returns {string}
 */
export const generateCode = (prefix) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `${prefix}${year}${month}-${sequence}`;
};

/**
 * Nettoie un payload avant envoi à Supabase :
 * supprime les champs undefined, null et chaînes vides.
 * Conserve les booléens (false), les nombres (0) et les tableaux vides [].
 * @param {Object} data
 * @returns {Object}
 */
export const cleanPayload = (data) => {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
        if (value === undefined || value === null || value === '') continue;
        cleaned[key] = value;
    }
    return cleaned;
};

/**
 * Store utilitaire — conserve les données mock pour rétro-compatibilité
 * et les fonctions de base CRUD tiers (redirigent vers useTiersStore en V2).
 *
 * Les fonctions CRUD tiers restent ici temporairement pour que les composants
 * existants (TiersCreate.vue, Tiers.vue) continuent à fonctionner pendant
 * la migration vers useTiersStore.
 */
export const useDataStore = defineStore('data', () => {
    const tiers = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Mock Data pour rétro-compatibilité (dashboard, etc.)
    const formations = ref([
        { id: 1, name: 'Formation Qualiopi - Niveau 1', client: 'Interne', date: '12/01/2025' },
        { id: 2, name: 'Audit Blanc ISO 9001', client: 'TechSolution', date: '05/02/2025' },
        { id: 3, name: 'Formation Sécurité', client: 'BatiCorp', date: '20/02/2025' },
        { id: 4, name: 'Coaching Managers', client: 'RetailGroup', date: '10/03/2025' }
    ]);

    const projects = ref([
        { id: 1, name: 'Mise en place Qualiopi', status: 'En cours', client: 'Alpha Bat' },
        { id: 2, name: 'Audit de surveillance', status: 'Planifié', client: 'Omega Services' },
        { id: 3, name: 'Formation Continue', status: 'Terminé', client: 'Delta Indus' },
        { id: 4, name: 'Digitalisation RH', status: 'En cours', client: 'Epsilon Tech' }
    ]);

    const stats = ref({
        totalTiers: 0,
        activeFormations: formations.value.length,
        activeProjects: projects.value.length
    });

    const auth = useAuthStore();

    // ─── CRUD Tiers (rétro-compatibilité) ───
    // Ces fonctions sont conservées pour que les composants existants fonctionnent.
    // Les nouveaux composants doivent utiliser useTiersStore.

    const fetchTiers = async () => {
        if (!auth.currentOrganization?.id && !auth.isSuperAdmin) {
            loading.value = false;
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            const orgId = auth.currentOrganization?.id;

            let query = supabase
                .from('tiers')
                .select('*, profiles(email)')
                .order('created_at', { ascending: false });

            if (!auth.isSuperAdmin) {
                query = query.eq('organization_id', orgId);
            }

            const { data, error: err } = await query;
            if (err) throw err;

            tiers.value = data || [];
            if (stats.value) stats.value.totalTiers = tiers.value.length;
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    };

    const createTier = async (tierData) => {
        loading.value = true;
        try {
            const finalData = cleanPayload({
                ...tierData,
                code_client: tierData.code_client || generateCode('CU'),
                code_fournisseur: tierData.code_fournisseur || generateCode('SU'),
                organization_id: auth.currentOrganization?.id,
                user_id: auth.user.id
            });

            const { data, error: err } = await supabase
                .from('tiers')
                .insert([finalData])
                .select()
                .single();

            if (err) throw err;

            tiers.value.unshift(data);
            stats.value.totalTiers++;
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    const deleteTier = async (id) => {
        try {
            const orgId = auth.currentOrganization?.id;
            if (!orgId) throw new Error('Aucune organisation sélectionnée');

            const { error: err } = await supabase
                .from('tiers')
                .delete()
                .eq('id', id)
                .eq('organization_id', orgId);

            if (err) throw err;

            tiers.value = tiers.value.filter(t => t.id !== id);
            stats.value.totalTiers--;
        } catch (err) {
            throw new Error("Impossible de supprimer ce tiers.");
        }
    };

    const getTierById = async (id) => {
        const local = tiers.value.find(t => t.id === id);
        if (local) return local;

        try {
            const orgId = auth.currentOrganization?.id;
            if (!orgId) throw new Error('Aucune organisation sélectionnée');

            const { data, error: err } = await supabase
                .from('tiers')
                .select('*')
                .eq('id', id)
                .eq('organization_id', orgId)
                .single();

            if (err) throw err;
            return data;
        } catch (err) {
            return null;
        }
    };

    const updateTier = async (id, updates) => {
        loading.value = true;
        try {
            const orgId = auth.currentOrganization?.id;
            if (!orgId) throw new Error('Aucune organisation sélectionnée');

            const { data, error: err } = await supabase
                .from('tiers')
                .update(cleanPayload(updates))
                .eq('id', id)
                .eq('organization_id', orgId)
                .select()
                .single();

            if (err) throw err;

            const index = tiers.value.findIndex(t => t.id === id);
            if (index !== -1) {
                tiers.value[index] = data;
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    return {
        tiers,
        formations,
        projects,
        stats,
        loading,
        error,
        fetchTiers,
        createTier,
        deleteTier,
        getTierById,
        updateTier
    };
});