import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

export const useTrainingStore = defineStore('training', () => {
    const loading = ref(false);
    const formations = ref([]);
    const error = ref(null); // Erreur visible pour l'UI
    const auth = useAuthStore();

    /**
     * Récupérer les formations.
     * Compatible avec ET sans organisation (fallback user_id).
     * Compatible avec ET sans FK profiles (fallback sans join).
     */
    const fetchFormations = async () => {
        loading.value = true;
        error.value = null;
        try {
            const orgId = auth.currentOrganization?.id;
            const userId = auth.user?.id;

            if (!userId) {
                console.warn('[TrainingStore] No user ID, skipping fetch');
                formations.value = [];
                loading.value = false;
                return;
            }

            // Essayer d'abord avec le join profiles(email)
            let query = supabase
                .from('formations')
                .select('*, profiles(email)')
                .order('updated_at', { ascending: false });

            // Filtre : org > user_id > rien (super admin)
            if (auth.isSuperAdmin) {
                // Voit tout
            } else if (orgId) {
                query = query.eq('organization_id', orgId);
            } else {
                query = query.eq('user_id', userId);
            }

            let { data, error: err } = await query;

            // Si le join profiles échoue, réessayer sans
            if (err) {
                console.warn('[TrainingStore] Query with profiles join failed, retrying without:', err.message);
                query = supabase
                    .from('formations')
                    .select('*')
                    .order('updated_at', { ascending: false });

                if (auth.isSuperAdmin) {
                    // Voit tout
                } else if (orgId) {
                    query = query.eq('organization_id', orgId);
                } else {
                    query = query.eq('user_id', userId);
                }

                const retry = await query;
                data = retry.data;
                err = retry.error;

                // Si ça échoue encore avec org_id, essayer avec user_id
                if (err && orgId) {
                    console.warn('[TrainingStore] Query with org_id failed, falling back to user_id:', err.message);
                    query = supabase
                        .from('formations')
                        .select('*')
                        .eq('user_id', userId)
                        .order('updated_at', { ascending: false });

                    const retry2 = await query;
                    data = retry2.data;
                    err = retry2.error;
                }
            }

            if (err) {
                console.error('[TrainingStore] All queries failed:', err);
                error.value = err.message;
                throw err;
            }

            formations.value = data || [];
        } catch (err) {
            console.error('[TrainingStore] Error fetching formations:', err);
            error.value = err.message || 'Erreur de chargement des formations';
            formations.value = [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Créer ou mettre à jour une formation.
     * organization_id ajouté seulement si disponible ET si la colonne existe.
     */
    const saveTraining = async (trainingData, id = null, pdfUrl = null) => {
        loading.value = true;
        error.value = null;
        try {
            const userId = auth.user?.id;
            if (!userId) throw new Error('Utilisateur non connecté');

            const payload = {
                user_id: userId,
                title: trainingData.titre || 'Nouvelle Formation',
                content: trainingData,
                updated_at: new Date()
            };

            const orgId = auth.currentOrganization?.id;
            if (orgId) {
                payload.organization_id = orgId;
            }

            if (pdfUrl) {
                payload.pdf_url = pdfUrl;
            }

            let result;

            if (id) {
                // Mise à jour — essayer avec org_id d'abord, puis sans
                result = await supabase.from('formations').update(payload).eq('id', id).select().maybeSingle();

                // Si erreur OU aucune ligne matchée (data null), réessayer sans org_id
                if ((result.error || !result.data) && orgId) {
                    console.warn('[TrainingStore] Update returned no data, retrying without org_id filter');
                    delete payload.organization_id;
                    result = await supabase.from('formations').update(payload).eq('id', id).select().maybeSingle();
                }
            } else {
                // Création
                result = await supabase.from('formations').insert([payload]).select().single();

                // Si ça échoue, réessayer sans organization_id
                if (result.error && orgId) {
                    console.warn('[TrainingStore] Insert with org_id failed, retrying without:', result.error.message);
                    delete payload.organization_id;
                    result = await supabase.from('formations').insert([payload]).select().single();
                }
            }

            if (result.error) throw result.error;

            // Rafraîchir la liste
            await fetchFormations();

            return { success: true, data: result.data };
        } catch (err) {
            console.error('[TrainingStore] Save error:', err);
            error.value = err.message;
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    /**
     * Supprimer une formation.
     */
    const deleteFormation = async (id) => {
        error.value = null;
        try {
            let query = supabase.from('formations').delete().eq('id', id);

            const orgId = auth.currentOrganization?.id;
            if (orgId) {
                query = query.eq('organization_id', orgId);
            }

            let { error: err } = await query;

            // Si ça échoue avec org_id, réessayer sans
            if (err && orgId) {
                console.warn('[TrainingStore] Delete with org_id failed, retrying without:', err.message);
                const retry = await supabase.from('formations').delete().eq('id', id);
                err = retry.error;
            }

            if (err) throw err;

            formations.value = formations.value.filter(f => f.id !== id);
        } catch (err) {
            console.error('[TrainingStore] Delete error:', err);
            error.value = err.message;
            throw new Error("Impossible de supprimer cette formation : " + err.message);
        }
    };

    /**
     * Générer le PDF via webhook n8n.
     * Appel direct au webhook (plus de proxy Cloudflare).
     */
    const generatePdf = async (trainingId, formData) => {
        loading.value = true;
        error.value = null;
        try {
            const webhookUrl = import.meta.env.VITE_N8N_HOOK_GENERATE_TRAINING;

            if (!webhookUrl) {
                console.warn('[TrainingStore] No VITE_N8N_HOOK_GENERATE_TRAINING webhook URL configured');
                return { success: false, error: 'Webhook de génération PDF non configuré. Ajoutez VITE_N8N_HOOK_GENERATE_TRAINING dans .env' };
            }

            // Sanitize : remplacer les valeurs vides par un espace (comme le faisait le Worker CF)
            const sanitize = (obj) => {
                const newObj = {};
                for (const key in obj) {
                    const val = obj[key];
                    if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
                        newObj[key] = " ";
                    } else {
                        newObj[key] = val;
                    }
                }
                return newObj;
            };

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: trainingId,
                    ...sanitize(formData)
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Erreur génération");

            return { success: true, pdfUrl: result.pdfUrl };
        } catch (err) {
            if (err.name === 'AbortError') {
                return { success: false, error: 'La génération prend trop de temps. Le PDF sera disponible dans quelques instants.' };
            }
            console.error('[TrainingStore] Generate PDF error:', err);
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    return { loading, error, formations, fetchFormations, saveTraining, deleteFormation, generatePdf };
});
