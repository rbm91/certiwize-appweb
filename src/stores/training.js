import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export const useTrainingStore = defineStore('training', () => {
    const loading = ref(false);
    const formations = ref([]);
    const auth = useAuthStore();

    // Récupérer les formations — compatible avec ou sans organisation
    const fetchFormations = async () => {
        loading.value = true;
        try {
            let query = supabase
                .from('formations')
                .select('*, profiles(email)')
                .order('updated_at', { ascending: false });

            const orgId = auth.currentOrganization?.id;

            if (auth.isSuperAdmin) {
                // Super admin voit tout
            } else if (orgId) {
                // Filtrer par organisation
                query = query.eq('organization_id', orgId);
            } else {
                // Fallback : filtrer par user_id (compte sans organisation)
                query = query.eq('user_id', auth.user?.id);
            }

            const { data, error: err } = await query;

            if (err) throw err;
            formations.value = data || [];
        } catch (err) {
            console.error('[TrainingStore] Error fetching formations:', err);
            formations.value = [];
        } finally {
            loading.value = false;
        }
    };

    // Créer ou mettre à jour une formation (Brouillon)
    const saveTraining = async (trainingData, id = null, pdfUrl = null) => {
        loading.value = true;
        try {
            const payload = {
                user_id: auth.user.id,
                title: trainingData.titre || 'Nouvelle Formation',
                content: trainingData, // Tout le formulaire
                updated_at: new Date()
            };

            // Ajouter organization_id seulement si disponible
            const orgId = auth.currentOrganization?.id;
            if (orgId) {
                payload.organization_id = orgId;
            }

            // Ajouter l'URL du PDF si fournie
            if (pdfUrl) {
                payload.pdf_url = pdfUrl;
            }

            let query = supabase.from('formations');
            let result;

            if (id) {
                // Mise à jour — filtrer par org si disponible
                let updateQuery = query.update(payload).eq('id', id);
                if (orgId) {
                    updateQuery = updateQuery.eq('organization_id', orgId);
                }
                result = await updateQuery.select().single();
            } else {
                result = await query.insert([payload]).select().single();
            }

            if (result.error) throw result.error;

            // Rafraîchir la liste
            await fetchFormations();

            return { success: true, data: result.data };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    // Supprimer une formation — compatible avec ou sans organisation
    const deleteFormation = async (id) => {
        try {
            let query = supabase
                .from('formations')
                .delete()
                .eq('id', id);

            // Ajouter le filtre org si disponible
            const orgId = auth.currentOrganization?.id;
            if (orgId) {
                query = query.eq('organization_id', orgId);
            }

            const { error: err } = await query;

            if (err) throw err;

            formations.value = formations.value.filter(f => f.id !== id);
        } catch (err) {
            console.error('[TrainingStore] Error deleting formation:', err);
            throw new Error("Impossible de supprimer cette formation.");
        }
    };

    // Appel au webhook n8n via Cloudflare pour générer le PDF
    const generatePdf = async (trainingId, formData) => {
        loading.value = true;
        try {
            // Refresh session before API call to ensure token is valid
            await auth.refreshSession();

            // Utiliser fetchWithTimeout pour éviter les requêtes infinies (timeout 60s pour génération PDF)
            const response = await fetchWithTimeout('/api/generate-training-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.session?.access_token}`
                },
                body: JSON.stringify({ trainingId, data: formData })
            }, 60000); // 60 secondes

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Erreur génération");

            // On met à jour l'URL locale si n8n a réussi
            return { success: true, pdfUrl: result.pdfUrl };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    return { loading, formations, fetchFormations, saveTraining, deleteFormation, generatePdf };
});
