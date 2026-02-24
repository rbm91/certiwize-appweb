import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PROJECT_STATUS } from '../config/constants';

/**
 * Composable pour gérer la timeline de progression d'un projet
 * Extrait de ProjetCreate.vue pour simplifier le composant
 *
 * @param {Ref<Object>} currentProject - Projet actuel
 * @param {Ref<Object>} docs - Documents générés {etude, convention, convocation, livret}
 * @returns {Object} - Steps de la timeline et computed utilities
 *
 * @example
 * const { timelineSteps, currentStep, progressPercentage } = useProjectTimeline(
 *   projectStore.currentProject,
 *   docs
 * );
 */
export const useProjectTimeline = (currentProject, docs) => {
  const { t } = useI18n();

  /**
   * Statut actuel du projet
   */
  const status = computed(() => currentProject.value?.status || PROJECT_STATUS.DRAFT);

  /**
   * Projet est validé ou terminé
   */
  const isValidated = computed(() =>
    status.value === PROJECT_STATUS.VALIDATED ||
    status.value === PROJECT_STATUS.FINISHED
  );

  /**
   * Les deux documents de phase 1 sont générés
   */
  const bothDocsGenerated = computed(() =>
    !!docs.value?.etude && !!docs.value?.convention
  );

  /**
   * Définition des étapes de la timeline
   */
  const timelineSteps = computed(() => {
    const projectId = currentProject.value?.id;

    return [
      {
        id: 1,
        label: t('project.timeline.draft') || 'Brouillon',
        icon: 'pi-file-edit',
        completed: !!projectId,
        current: status.value === PROJECT_STATUS.DRAFT && !docs.value?.etude
      },
      {
        id: 2,
        label: t('project.timeline.study_doc') || 'Document étude',
        icon: 'pi-file-pdf',
        completed: !!docs.value?.etude,
        current: status.value === PROJECT_STATUS.DRAFT &&
                 !docs.value?.etude &&
                 !!projectId
      },
      {
        id: 3,
        label: t('project.timeline.convention_doc') || 'Convention',
        icon: 'pi-file-pdf',
        completed: !!docs.value?.convention,
        current: status.value === PROJECT_STATUS.DRAFT &&
                 !!docs.value?.etude &&
                 !docs.value?.convention
      },
      {
        id: 4,
        label: t('project.timeline.submitted') || 'Soumis',
        icon: 'pi-send',
        completed: status.value !== PROJECT_STATUS.DRAFT,
        current: status.value === PROJECT_STATUS.DRAFT &&
                 bothDocsGenerated.value
      },
      {
        id: 5,
        label: t('project.timeline.validated') || 'Validé',
        icon: 'pi-check-circle',
        completed: isValidated.value,
        current: status.value === PROJECT_STATUS.PENDING
      },
      {
        id: 6,
        label: t('project.timeline.convocation_doc') || 'Convocation',
        icon: 'pi-file-pdf',
        completed: !!docs.value?.convocation,
        current: isValidated.value && !docs.value?.convocation
      },
      {
        id: 7,
        label: t('project.timeline.booklet_doc') || 'Livret',
        icon: 'pi-file-pdf',
        completed: !!docs.value?.livret,
        current: isValidated.value &&
                 !!docs.value?.convocation &&
                 !docs.value?.livret
      },
      {
        id: 8,
        label: t('project.timeline.finished') || 'Terminé',
        icon: 'pi-flag-fill',
        completed: status.value === PROJECT_STATUS.FINISHED,
        current: isValidated.value &&
                 !!docs.value?.convocation &&
                 !!docs.value?.livret
      }
    ];
  });

  /**
   * Étape courante de la timeline
   */
  const currentStep = computed(() => {
    return timelineSteps.value.find(step => step.current);
  });

  /**
   * Pourcentage de progression (0-100)
   */
  const progressPercentage = computed(() => {
    const total = timelineSteps.value.length;
    const completed = timelineSteps.value.filter(s => s.completed).length;
    return Math.round((completed / total) * 100);
  });

  /**
   * Nombre total d'étapes complétées
   */
  const completedCount = computed(() => {
    return timelineSteps.value.filter(s => s.completed).length;
  });

  /**
   * Classe CSS pour une étape donnée
   * @param {Object} step - Étape de la timeline
   * @returns {Object} - Classes CSS à appliquer
   */
  const getStepClasses = (step) => {
    return {
      'bg-blue-500 text-white shadow-lg scale-110': step.current,
      'bg-green-500 text-white': step.completed && !step.current,
      'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400':
        !step.completed && !step.current
    };
  };

  /**
   * Classe CSS pour le label d'une étape
   * @param {Object} step - Étape de la timeline
   * @returns {Object} - Classes CSS à appliquer
   */
  const getStepLabelClasses = (step) => {
    return {
      'font-semibold text-blue-600 dark:text-blue-400': step.current,
      'text-green-600 dark:text-green-400': step.completed && !step.current,
      'text-gray-500 dark:text-gray-400': !step.completed && !step.current
    };
  };

  /**
   * Vérifie si une phase est accessible
   * @param {number} phase - Numéro de phase (1 ou 2)
   * @returns {boolean} - True si la phase est accessible
   */
  const isPhaseAccessible = (phase) => {
    if (phase === 1) return true;
    if (phase === 2) return isValidated.value;
    return false;
  };

  /**
   * Obtient le message d'état pour une phase
   * @param {number} phase - Numéro de phase
   * @returns {string} - Message descriptif
   */
  const getPhaseStatusMessage = (phase) => {
    if (phase === 1) {
      if (status.value === PROJECT_STATUS.DRAFT) {
        return t('project.phase1.status_draft') || 'En cours de rédaction';
      }
      if (status.value === PROJECT_STATUS.PENDING) {
        return t('project.phase1.status_pending') || 'En attente de validation';
      }
      if (isValidated.value) {
        return t('project.phase1.status_validated') || 'Validé';
      }
    }

    if (phase === 2) {
      if (!isValidated.value) {
        return t('project.phase2.locked') || 'Verrouillé - En attente de validation';
      }
      return t('project.phase2.unlocked') || 'Déverrouillé';
    }

    return '';
  };

  return {
    timelineSteps,
    currentStep,
    progressPercentage,
    completedCount,
    status,
    isValidated,
    bothDocsGenerated,
    getStepClasses,
    getStepLabelClasses,
    isPhaseAccessible,
    getPhaseStatusMessage
  };
};
