import { ref, watch, onUnmounted } from 'vue';
import { TIMEOUTS } from '../config/constants';

/**
 * Composable pour détecter les chargements lents et afficher un dialog
 * Élimine la duplication du code de détection dans 4+ composants
 *
 * @param {number} threshold - Délai en ms avant d'afficher le dialog (défaut: 10000ms)
 * @returns {Object} - État et méthodes pour gérer le slow loading
 *
 * @example
 * const { showSlowLoading, startDetecting, stopDetecting } = useSlowLoading();
 *
 * // Démarrer la détection
 * startDetecting();
 *
 * // Stopper la détection
 * stopDetecting();
 *
 * // Ou utiliser avec watch
 * watch(loading, (isLoading) => {
 *   if (isLoading) startDetecting();
 *   else stopDetecting();
 * });
 */
export const useSlowLoading = (threshold = TIMEOUTS.SLOW_LOADING_THRESHOLD) => {
  const showSlowLoading = ref(false);
  let timeoutId = null;

  /**
   * Démarre la détection de chargement lent
   */
  const startDetecting = () => {
    // Nettoyer tout timeout existant
    stopDetecting();

    // Démarrer un nouveau timeout
    timeoutId = setTimeout(() => {
      showSlowLoading.value = true;
    }, threshold);
  };

  /**
   * Arrête la détection et masque le dialog
   */
  const stopDetecting = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    showSlowLoading.value = false;
  };

  /**
   * Surveille automatiquement une ref de loading
   * @param {Ref<boolean>} loadingRef - Référence Vue du statut de chargement
   * @returns {Function} - Fonction pour arrêter la surveillance
   */
  const watchLoading = (loadingRef) => {
    return watch(loadingRef, (isLoading) => {
      if (isLoading) {
        startDetecting();
      } else {
        stopDetecting();
      }
    }, { immediate: true });
  };

  // Nettoyage automatique lors du démontage du composant
  onUnmounted(() => {
    stopDetecting();
  });

  return {
    showSlowLoading,
    startDetecting,
    stopDetecting,
    watchLoading
  };
};
