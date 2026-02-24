import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

const generateCode = (prefix) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // Simulation d'une séquence unique (idéalement gérée par la DB)
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(5, '0');
    return `${prefix}${year}${month}-${sequence}`;
};

export const useDataStore = defineStore('data', () => {
    const tiers = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // Mock Data pour Formations et Projets
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

    // Stats calculées
    const stats = ref({
        totalTiers: 0,
        activeFormations: formations.value.length,
        activeProjects: projects.value.length
    });

    const auth = useAuthStore();

    // 1. Récupérer les tiers (filtrés par user_id sauf si admin)
    const fetchTiers = async () => {
        if (!auth.user?.id) {
            loading.value = false;
            return;
        }

        loading.value = true;
        error.value = null;
        try {
            const checkAdmin = auth.userRole === 'admin';

            let query = supabase
                .from('tiers')
                .select('*, profiles(email)')
                .order('created_at', { ascending: false });

            if (!checkAdmin) {
                query = query.eq('user_id', auth.user.id);
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

    // 2. Créer un nouveau tiers
    const createTier = async (tierData) => {
        loading.value = true;
        try {
            // Auto-génération si les champs sont vides
            const finalData = {
                ...tierData,
                code_client: tierData.code_client || generateCode('CU'),
                code_fournisseur: tierData.code_fournisseur || generateCode('SU'),
                user_id: auth.user.id
            };

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

    // 3. Supprimer un tiers
    const deleteTier = async (id) => {
        try {
            const { error: err } = await supabase
                .from('tiers')
                .delete()
                .eq('id', id);

            if (err) throw err;

            tiers.value = tiers.value.filter(t => t.id !== id);
            stats.value.totalTiers--;
        } catch (err) {
            throw new Error("Impossible de supprimer ce tiers.");
        }
    };

    // 4. Récupérer un tiers par ID
    const getTierById = async (id) => {
        // D'abord chercher dans le cache local
        const local = tiers.value.find(t => t.id === id);
        if (local) return local;

        // Sinon chercher en base
        try {
            const { data, error: err } = await supabase
                .from('tiers')
                .select('*')
                .eq('id', id)
                .single();

            if (err) throw err;
            return data;
        } catch (err) {
            return null;
        }
    };

    // 5. Mettre à jour un tiers
    const updateTier = async (id, updates) => {
        loading.value = true;
        try {
            const { data, error: err } = await supabase
                .from('tiers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (err) throw err;

            // Mise à jour locale
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
        formations, // Added
        projects,   // Added
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