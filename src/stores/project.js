import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export const useProjectStore = defineStore('project', () => {
    const currentProject = ref(null);
    const loading = ref(false);
    const auth = useAuthStore();

    // Créer ou Mettre à jour (Sauvegarde Brouillon)
    const saveProject = async (projectData, step = 1) => {
        loading.value = true;
        try {
            const user = auth.user;

            const payload = {
                user_id: user.id,
                name: projectData.name || 'Nouveau Projet',
                step_progress: step,
                form_data: projectData.form_data, // Le JSON avec vos balises
                formation_id: projectData.formation_id || null,
                updated_at: new Date()
            };

            let query = supabase.from('projects');

            if (projectData.id) {
                // Mise à jour
                const { data, error } = await query
                    .update(payload)
                    .eq('id', projectData.id)
                    .select()
                    .single();
                if (error) throw error;
                currentProject.value = data;
            } else {
                // Création
                const { data, error } = await query
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                currentProject.value = data;
            }

            return { success: true, id: currentProject.value.id };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    // Récupérer un projet par ID
    const fetchProject = async (id) => {
        loading.value = true;
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            currentProject.value = data;
        } catch (err) {
            console.error('[ProjectStore] Error fetching project:', err);
            currentProject.value = null;
            throw err; // Propager l'erreur pour que le composant puisse la gérer
        } finally {
            loading.value = false;
        }
    };

    // Générer un document du projet avec approche hybride (API + polling)
    const generateDoc = async (docType, formData) => {
        if (!currentProject.value?.id) return { success: false, error: "Sauvegardez d'abord le projet" };

        loading.value = true;
        try {
            // Refresh session before API call to ensure token is valid
            await auth.refreshSession();

            // Lancer l'appel API avec un timeout de 60s (suffisant pour les cas rapides)
            const response = await fetchWithTimeout('/api/generate-project-doc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.session?.access_token}`
                },
                body: JSON.stringify({
                    projectId: currentProject.value.id,
                    docType: docType,
                    data: formData
                })
            }, 60000); // 60 secondes

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Erreur génération");

            // Mapping docType -> clé attendue dans la réponse n8n ET nom de colonne dans la table
            const columnMap = {
                'etude': 'identification',
                'convention': 'convention',
                'convocation': 'convocation',
                'livret': 'livret'
            };

            const columnName = columnMap[docType];
            const fileName = result[columnName];

            // Vérifier que n8n a renvoyé le fichier
            if (!fileName) {
                throw new Error(`Le webhook n8n n'a pas renvoyé de "${columnName}". Vérifiez la configuration n8n.`);
            }

            // Récupérer l'URL publique via Supabase Storage
            const { data: urlData } = supabase.storage
                .from('project-docs')
                .getPublicUrl(fileName);

            // Mettre à jour la base de données (colonne spécifique au type de document)
            const updatePayload = {
                [columnName]: urlData.publicUrl,
                form_data: formData, // Mettre à jour aussi les form_data pour garantir la cohérence
                updated_at: new Date()
            };

            const { data: updatedProject, error: updateError } = await supabase
                .from('projects')
                .update(updatePayload)
                .eq('id', currentProject.value.id)
                .select()
                .single();

            if (updateError) throw updateError;

            // Mise à jour locale en remplaçant l'objet complet pour garantir la réactivité
            currentProject.value = updatedProject;

            return { success: true, url: urlData.publicUrl };

        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            loading.value = false;
        }
    };

    // Changer le statut du projet
    const updateStatus = async (newStatus) => {
        try {
            const { error } = await supabase
                .from('projects')
                .update({ status: newStatus })
                .eq('id', currentProject.value.id);

            if (error) throw error;

            currentProject.value.status = newStatus;
            return { success: true };
        } catch (e) {
            console.error('[ProjectStore] Error updating project status:', e);
            return { success: false, error: e.message };
        }
    };

    return { currentProject, loading, saveProject, fetchProject, generateDoc, updateStatus };
});