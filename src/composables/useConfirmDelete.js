import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { supabase } from '../supabase';
import { TIMEOUTS, TOAST_SEVERITY } from '../config/constants';

/**
 * Composable pour gérer la suppression avec confirmation
 * Élimine la duplication du code de confirmation dans 4+ composants
 *
 * @param {string} tableName - Nom de la table Supabase
 * @param {Function} onDeleteSuccess - Callback optionnel après suppression réussie
 * @returns {Object} - Méthodes pour confirmer et supprimer
 *
 * @example
 * const { confirmAndDelete } = useConfirmDelete('projects', fetchProjects);
 * confirmAndDelete(projectId);
 */
export const useConfirmDelete = (tableName, onDeleteSuccess = null) => {
  const confirm = useConfirm();
  const toast = useToast();
  const { t } = useI18n();

  /**
   * Affiche une boîte de dialogue de confirmation puis supprime l'enregistrement
   * @param {string|number} id - ID de l'enregistrement à supprimer
   * @param {Object} options - Options de personnalisation
   * @param {string} options.message - Message de confirmation personnalisé
   * @param {string} options.header - En-tête personnalisé
   * @param {Function} options.onSuccess - Callback supplémentaire après succès
   */
  const confirmAndDelete = async (id, options = {}) => {
    const {
      message = t('common.confirm_delete') || 'Voulez-vous vraiment supprimer cet élément ?',
      header = t('common.confirmation') || 'Confirmation',
      onSuccess = null
    } = options;

    confirm.require({
      message,
      header,
      icon: 'pi pi-exclamation-triangle',
      acceptClass: 'p-button-danger',
      acceptLabel: t('common.delete') || 'Supprimer',
      rejectLabel: t('common.cancel') || 'Annuler',
      accept: async () => {
        try {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

          if (error) throw error;

          toast.add({
            severity: TOAST_SEVERITY.SUCCESS,
            summary: t('common.success') || 'Succès',
            detail: t('common.delete_success') || 'Élément supprimé avec succès',
            life: TIMEOUTS.TOAST_NOTIFICATION
          });

          // Appeler les callbacks si fournis
          if (onDeleteSuccess) await onDeleteSuccess();
          if (onSuccess) await onSuccess();

        } catch (e) {
          console.error(`[useConfirmDelete] Error deleting from ${tableName}:`, e);

          toast.add({
            severity: TOAST_SEVERITY.ERROR,
            summary: t('common.error') || 'Erreur',
            detail: e.message || t('common.delete_error') || 'Erreur lors de la suppression',
            life: TIMEOUTS.TOAST_NOTIFICATION
          });
        }
      }
    });
  };

  /**
   * Suppression directe sans confirmation (à utiliser avec précaution)
   * @param {string|number} id - ID de l'enregistrement à supprimer
   */
  const deleteWithoutConfirm = async (id) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (onDeleteSuccess) await onDeleteSuccess();

      return { success: true };
    } catch (e) {
      console.error(`[useConfirmDelete] Error deleting from ${tableName}:`, e);
      return { success: false, error: e.message };
    }
  };

  return {
    confirmAndDelete,
    deleteWithoutConfirm
  };
};
