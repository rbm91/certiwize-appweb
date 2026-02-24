import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { PROJECT_STATUS } from '../config/constants';

/**
 * Composable pour gérer la timeline de progression d'un projet
 * Config-driven : lit les phases/steps depuis la config workflow
 *
 * @param {Ref<Object>} currentProject - Projet actuel
 * @param {Ref<Object>} docs - Documents générés {etude, convention, convocation, livret}
 * @param {Ref<Object>} workflowConfig - Config workflow (optionnel, fallback hardcodé)
 * @returns {Object} - Steps de la timeline et computed utilities
 */
export const useProjectTimeline = (currentProject, docs, workflowConfig = null) => {
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
   * Évalue si un step est "completed" en fonction de son type et de sa config
   */
  const isStepCompleted = (step) => {
    const projectId = currentProject.value?.id;

    if (step.type === 'status_change') {
      switch (step.target_status) {
        case PROJECT_STATUS.DRAFT:
          return !!projectId;
        case 'En attente':
          return status.value !== PROJECT_STATUS.DRAFT;
        case PROJECT_STATUS.VALIDATED:
          return isValidated.value;
        case PROJECT_STATUS.FINISHED:
          return status.value === PROJECT_STATUS.FINISHED;
        default:
          return false;
      }
    }

    if (step.type === 'document_generation') {
      return !!docs.value?.[step.doc_key];
    }

    return false;
  };

  /**
   * Évalue si un step est "current" (étape en cours)
   */
  const isStepCurrent = (step, allSteps, stepIndex) => {
    const projectId = currentProject.value?.id;

    if (step.type === 'status_change') {
      switch (step.target_status) {
        case PROJECT_STATUS.DRAFT:
          return status.value === PROJECT_STATUS.DRAFT && !docs.value?.etude;
        case 'En attente': {
          // "Soumis" est current si tous les docs requis sont générés
          const requiredDocs = step.requires_docs || [];
          const allDocsReady = requiredDocs.every(dk => !!docs.value?.[dk]);
          return status.value === PROJECT_STATUS.DRAFT && allDocsReady;
        }
        case PROJECT_STATUS.VALIDATED:
          return status.value === PROJECT_STATUS.PENDING;
        case PROJECT_STATUS.FINISHED: {
          const requiredDocs = step.requires_docs || [];
          const allDocsReady = requiredDocs.every(dk => !!docs.value?.[dk]);
          return isValidated.value && allDocsReady;
        }
        default:
          return false;
      }
    }

    if (step.type === 'document_generation') {
      const docExists = !!docs.value?.[step.doc_key];
      if (docExists) return false;

      // Current si le doc n'existe pas encore et les prérequis sont remplis
      // On vérifie que toutes les steps précédentes de type document_generation dans la même phase sont complétées
      const phase = getPhaseForStep(step, allSteps);
      if (!phase) return false;

      // Vérifier que la phase est accessible
      if (phase.unlock_on_status && !isPhaseUnlocked(phase)) return false;

      // Vérifier que toutes les doc_generation steps précédentes sont complétées
      const phaseSteps = phase.steps.sort((a, b) => a.order - b.order);
      for (const ps of phaseSteps) {
        if (ps.order >= step.order) break;
        if (ps.type === 'document_generation' && !docs.value?.[ps.doc_key]) {
          return false; // Un doc précédent n'est pas encore généré
        }
      }

      // Pour phase 1, vérifier qu'on est en brouillon
      if (!phase.unlock_on_status && status.value !== PROJECT_STATUS.DRAFT) return false;
      // Pour phase 2+, vérifier que la phase est déverrouillée
      if (phase.unlock_on_status && !isPhaseUnlocked(phase)) return false;

      return !!projectId;
    }

    return false;
  };

  /**
   * Trouve la phase contenant un step
   */
  const getPhaseForStep = (step, allStepsFlat) => {
    const config = workflowConfig?.value;
    if (!config?.phases) return null;
    return config.phases.find(p => p.steps.some(s => s.id === step.id));
  };

  /**
   * Vérifie si une phase est déverrouillée
   */
  const isPhaseUnlocked = (phase) => {
    if (!phase.unlock_on_status) return true;
    // La phase est déverrouillée si le statut actuel correspond ou est "après"
    const statusOrder = [PROJECT_STATUS.DRAFT, PROJECT_STATUS.PENDING, PROJECT_STATUS.VALIDATED, PROJECT_STATUS.FINISHED];
    const currentIndex = statusOrder.indexOf(status.value);
    const unlockIndex = statusOrder.indexOf(phase.unlock_on_status);
    return currentIndex >= unlockIndex;
  };

  /**
   * Les deux documents de phase 1 sont générés (pour compatibilité)
   */
  const bothDocsGenerated = computed(() => {
    const config = workflowConfig?.value;
    if (config?.phases) {
      const phase1 = config.phases.find(p => p.order === 1);
      if (phase1) {
        const submitStep = phase1.steps.find(s => s.requires_docs);
        if (submitStep) {
          return submitStep.requires_docs.every(dk => !!docs.value?.[dk]);
        }
      }
    }
    // Fallback
    return !!docs.value?.etude && !!docs.value?.convention;
  });

  /**
   * Définition des étapes de la timeline - config-driven
   */
  const timelineSteps = computed(() => {
    const config = workflowConfig?.value;

    if (config?.phases) {
      // Mode config-driven
      let stepId = 1;
      const allSteps = config.phases
        .sort((a, b) => a.order - b.order)
        .flatMap(phase => phase.steps.sort((a, b) => a.order - b.order));

      return allSteps.map((step, index) => ({
        id: stepId++,
        configId: step.id,
        label: step.label,
        icon: step.icon,
        completed: isStepCompleted(step),
        current: isStepCurrent(step, allSteps, index),
        type: step.type,
        doc_key: step.doc_key,
        db_column: step.db_column,
        target_status: step.target_status,
        requires_docs: step.requires_docs
      }));
    }

    // Fallback hardcodé (identique à l'ancien code)
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
   */
  const getStepLabelClasses = (step) => {
    return {
      'font-semibold text-blue-600 dark:text-blue-400': step.current,
      'text-green-600 dark:text-green-400': step.completed && !step.current,
      'text-gray-500 dark:text-gray-400': !step.completed && !step.current
    };
  };

  /**
   * Vérifie si une phase est accessible (config-driven)
   */
  const isPhaseAccessible = (phaseOrder) => {
    const config = workflowConfig?.value;
    if (config?.phases) {
      const phase = config.phases.find(p => p.order === phaseOrder);
      if (phase) {
        return isPhaseUnlocked(phase);
      }
    }
    // Fallback
    if (phaseOrder === 1) return true;
    if (phaseOrder === 2) return isValidated.value;
    return false;
  };

  /**
   * Obtient le message d'état pour une phase
   */
  const getPhaseStatusMessage = (phaseOrder) => {
    if (phaseOrder === 1) {
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

    if (phaseOrder === 2) {
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
