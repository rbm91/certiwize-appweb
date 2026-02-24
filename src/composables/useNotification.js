import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { TIMEOUTS, TOAST_SEVERITY, ERROR_MESSAGES } from '../config/constants';

/**
 * Composable pour gérer les notifications toast de manière centralisée
 * Élimine les magic numbers et standardise les messages
 *
 * @returns {Object} - Méthodes pour afficher différents types de notifications
 *
 * @example
 * const { showSuccess, showError, showWarning, showInfo } = useNotification();
 *
 * // Notifications simples
 * showSuccess('Opération réussie');
 * showError('Une erreur est survenue');
 *
 * // Notifications avec détails
 * showSuccess('Succès', 'Le projet a été créé');
 * showError('Erreur', error.message);
 */
export const useNotification = () => {
  const toast = useToast();
  const { t } = useI18n();

  /**
   * Affiche une notification de succès
   * @param {string} summary - Titre de la notification
   * @param {string} detail - Message détaillé (optionnel)
   * @param {number} life - Durée d'affichage en ms (optionnel)
   */
  const showSuccess = (summary, detail = null, life = TIMEOUTS.TOAST_NOTIFICATION) => {
    toast.add({
      severity: TOAST_SEVERITY.SUCCESS,
      summary: summary || t('common.success') || 'Succès',
      detail: detail || '',
      life
    });
  };

  /**
   * Affiche une notification d'erreur
   * @param {string} summary - Titre de la notification
   * @param {string|Error} detail - Message d'erreur ou objet Error
   * @param {number} life - Durée d'affichage en ms (optionnel)
   */
  const showError = (summary, detail = null, life = TIMEOUTS.TOAST_NOTIFICATION) => {
    // Si detail est un objet Error, extraire le message
    const errorMessage = detail instanceof Error ? detail.message : detail;

    toast.add({
      severity: TOAST_SEVERITY.ERROR,
      summary: summary || t('common.error') || 'Erreur',
      detail: errorMessage || ERROR_MESSAGES.GENERIC,
      life
    });
  };

  /**
   * Affiche une notification d'avertissement
   * @param {string} summary - Titre de la notification
   * @param {string} detail - Message détaillé (optionnel)
   * @param {number} life - Durée d'affichage en ms (optionnel)
   */
  const showWarning = (summary, detail = null, life = TIMEOUTS.TOAST_NOTIFICATION) => {
    toast.add({
      severity: TOAST_SEVERITY.WARN,
      summary: summary || t('common.warning') || 'Attention',
      detail: detail || '',
      life
    });
  };

  /**
   * Affiche une notification d'information
   * @param {string} summary - Titre de la notification
   * @param {string} detail - Message détaillé (optionnel)
   * @param {number} life - Durée d'affichage en ms (optionnel)
   */
  const showInfo = (summary, detail = null, life = TIMEOUTS.TOAST_NOTIFICATION) => {
    toast.add({
      severity: TOAST_SEVERITY.INFO,
      summary: summary || t('common.info') || 'Information',
      detail: detail || '',
      life
    });
  };

  /**
   * Affiche une notification de chargement d'erreur spécifique
   * @param {string} resourceName - Nom de la ressource (ex: 'projets', 'formations')
   * @param {Error} error - Objet erreur
   */
  const showLoadError = (resourceName, error = null) => {
    showError(
      t('common.error') || 'Erreur',
      `${t('common.error_loading') || 'Erreur de chargement'} ${resourceName}: ${error?.message || ERROR_MESSAGES.GENERIC}`
    );
  };

  /**
   * Affiche une notification de suppression réussie
   * @param {string} resourceName - Nom de la ressource supprimée
   */
  const showDeleteSuccess = (resourceName = '') => {
    showSuccess(
      t('common.success') || 'Succès',
      `${resourceName} ${t('common.deleted') || 'supprimé avec succès'}`
    );
  };

  /**
   * Affiche une notification de sauvegarde réussie
   * @param {string} resourceName - Nom de la ressource sauvegardée
   */
  const showSaveSuccess = (resourceName = '') => {
    showSuccess(
      t('common.success') || 'Succès',
      `${resourceName} ${t('common.saved') || 'sauvegardé avec succès'}`
    );
  };

  /**
   * Affiche une notification d'erreur réseau
   */
  const showNetworkError = () => {
    showError(
      t('common.error') || 'Erreur',
      ERROR_MESSAGES.NETWORK
    );
  };

  /**
   * Affiche une notification d'erreur d'autorisation
   */
  const showUnauthorizedError = () => {
    showError(
      t('common.error') || 'Erreur',
      ERROR_MESSAGES.UNAUTHORIZED
    );
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoadError,
    showDeleteSuccess,
    showSaveSuccess,
    showNetworkError,
    showUnauthorizedError
  };
};
