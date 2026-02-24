import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from '../stores/auth';

/**
 * Composable réutilisable pour l'upload de fichiers vers Supabase Storage.
 * Les fichiers sont stockés dans un path isolé par organisation : orgId/userId/...
 *
 * @param {string} bucketName - Nom du bucket Supabase Storage (ex: 'tier-files')
 */
export function useFileUpload(bucketName = 'tier-files') {
  const uploading = ref(false);
  const error = ref(null);

  /**
   * Upload un fichier depuis un événement PrimeVue FileUpload @select.
   *
   * @param {Object} event - Événement PrimeVue FileUpload (event.files[0])
   * @param {string} prefix - Préfixe pour le nom du fichier (ex: 'photo', 'cv')
   * @returns {Promise<{url: string|null, error: string|null}>}
   */
  async function uploadFile(event, prefix = 'file') {
    uploading.value = true;
    error.value = null;

    try {
      const authStore = useAuthStore();
      await authStore.refreshSession();

      const file = event.files[0];
      if (!file) {
        throw new Error('Aucun fichier sélectionné');
      }

      // Vérifier la taille (1 MB max pour photos/CV)
      if (file.size > 1048576) {
        throw new Error('Le fichier dépasse la taille maximale de 1 MB');
      }

      const userId = authStore.user?.id || 'unknown';
      const orgId = authStore.currentOrganization?.id || 'no-org';
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${orgId}/${userId}/${prefix}-${Date.now()}-${cleanName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      uploading.value = false;
      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      error.value = err.message;
      uploading.value = false;
      return { url: null, error: err.message };
    }
  }

  return { uploading, error, uploadFile };
}
