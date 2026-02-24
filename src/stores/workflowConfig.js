import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';

/**
 * Workflow par défaut - reproduit exactement le système actuel à 8 étapes / 2 phases.
 * Chaque step a un type : 'status_change' | 'document_generation'
 * Les steps de type 'document_generation' ont des fields et un doc_key/db_column.
 */
const DEFAULT_WORKFLOW = {
  version: 1,
  phases: [
    {
      id: 'phase_1',
      label: 'Étude de faisabilité & Convention',
      order: 1,
      lock_after_submit: true,
      steps: [
        {
          id: 'step_draft',
          label: 'Brouillon',
          icon: 'pi-file-edit',
          type: 'status_change',
          target_status: 'Brouillon',
          order: 1
        },
        {
          id: 'step_etude',
          label: 'Document étude',
          icon: 'pi-file-pdf',
          type: 'document_generation',
          doc_key: 'etude',
          db_column: 'identification',
          order: 2,
          field_groups: [
            {
              label: 'Informations générales',
              fields: [
                { key: 'date', label: 'Date', type: 'date', required: false, col_span: 1 },
                { key: 'client', label: 'Client', type: 'dropdown', source: 'tiers', required: true, col_span: 1 },
                { key: 'service_concerne', label: 'Service concerné', type: 'text', required: false, placeholder: 'Ex: DRH, Technique...', col_span: 1 },
                { key: 'contact', label: 'Contact', type: 'text', required: false, placeholder: 'Nom du responsable', col_span: 1 }
              ]
            },
            {
              label: 'Cadrage du projet',
              fields: [
                { key: 'contexte', label: 'Contexte', type: 'textarea', required: false, placeholder: 'Décrivez le contexte de la demande...', col_span: 2 },
                { key: 'objectifs', label: 'Objectifs', type: 'textarea', required: false, placeholder: 'Quels sont les objectifs attendus ?', col_span: 2 },
                { key: 'public_concerne', label: 'Public concerné', type: 'text', required: false, placeholder: 'Ex: 10 Techniciens de maintenance', col_span: 2 }
              ]
            },
            {
              label: "Modalités d'exécution",
              fields: [
                { key: 'calendrier', label: 'Calendrier', type: 'date', required: false, placeholder: 'Date prévue', col_span: 1 },
                { key: 'duree', label: 'Durée (heures)', type: 'number', required: false, placeholder: 'Ex: 21', suffix: ' h', col_span: 1 },
                { key: 'lieu', label: 'Lieu', type: 'text', required: false, placeholder: 'Sur site ou à distance ?', col_span: 1 },
                { key: 'cout', label: 'Coût estimé', type: 'currency', required: false, col_span: 1 }
              ]
            },
            {
              label: 'Opportunité',
              fields: [
                { key: 'opportunity_status', label: 'Statut opportunité', type: 'opportunity_status', required: false, col_span: 1 },
                { key: 'opportunity_probability', label: 'Probabilité', type: 'slider', required: false, min: 0, max: 100, step: 5, col_span: 1 }
              ]
            },
            {
              label: 'Ressources & Moyens',
              fields: [
                { key: 'competence', label: 'Compétences requises', type: 'textarea', required: false, placeholder: 'Compétences requises ou à acquérir', col_span: 2 },
                { key: 'moyens_materiels', label: 'Moyens matériels', type: 'textarea', required: false, placeholder: 'Salle, projecteur, accès VPN...', col_span: 2 },
                { key: 'autres', label: 'Autres informations', type: 'textarea', required: false, placeholder: 'Informations complémentaires', col_span: 2 }
              ]
            }
          ]
        },
        {
          id: 'step_convention',
          label: 'Convention',
          icon: 'pi-file-pdf',
          type: 'document_generation',
          doc_key: 'convention',
          db_column: 'convention',
          order: 3,
          field_groups: [
            {
              label: 'Identification des parties',
              fields: [
                { key: 'soussignes', label: 'Soussignés', type: 'text', required: false, placeholder: "Raison sociale de l'entreprise cliente", col_span: 2 },
                { key: 'siret', label: 'SIRET', type: 'text', required: false, placeholder: 'N° SIRET', col_span: 1 }
              ]
            },
            {
              label: 'Formation',
              fields: [
                { key: 'formation', label: 'Intitulé de la formation', type: 'text', required: false, placeholder: 'Titre de la formation', col_span: 2 },
                { key: 'duree_conv', label: 'Durée (heures)', type: 'number', required: false, placeholder: 'Ex: 14', suffix: ' h', col_span: 1 },
                { key: 'dates', label: 'Date de début', type: 'date', required: false, col_span: 1 },
                { key: 'dates_fin', label: 'Date de fin', type: 'date', required: false, col_span: 1 },
                { key: 'horaires_debut', label: 'Heure de début', type: 'time', required: false, col_span: 1 },
                { key: 'horaires_fin', label: 'Heure de fin', type: 'time', required: false, col_span: 1 },
                { key: 'lieu_conv', label: 'Lieu', type: 'text', required: false, placeholder: "Adresse ou 'Distanciel'", col_span: 1 }
              ]
            },
            {
              label: 'Participant',
              fields: [
                { key: 'fonction', label: 'Fonction des stagiaires', type: 'text', required: false, placeholder: 'Ex: Techniciens, Managers...', col_span: 2 }
              ]
            },
            {
              label: 'Prix',
              fields: [
                { key: 'cout_ht', label: 'Coût HT', type: 'currency', required: false, col_span: 1 },
                { key: 'cout_ttc', label: 'Coût TTC', type: 'currency', required: false, col_span: 1 }
              ]
            },
            {
              label: 'Moyens pédagogiques',
              fields: [
                { key: 'nom_expert', label: "Nom de l'expert", type: 'text', required: false, placeholder: 'Nom du formateur', col_span: 1 },
                { key: 'expertise', label: 'Expertise / Qualification', type: 'textarea', required: false, placeholder: 'Qualifications et expérience du formateur', col_span: 2 },
                { key: 'contenu_forma', label: 'Contenu de la formation', type: 'textarea', required: false, rows: 4, placeholder: 'Programme détaillé de la formation...', col_span: 2 }
              ]
            },
            {
              label: 'Signatures',
              fields: [
                { key: 'date_now', label: 'Date du jour', type: 'date', required: false, col_span: 1 }
              ]
            }
          ]
        },
        {
          id: 'step_submit',
          label: 'Soumis',
          icon: 'pi-send',
          type: 'status_change',
          target_status: 'En attente',
          order: 4,
          requires_docs: ['etude', 'convention']
        }
      ]
    },
    {
      id: 'phase_2',
      label: 'Session & Convocations',
      order: 2,
      unlock_on_status: 'Validé',
      steps: [
        {
          id: 'step_validated',
          label: 'Validé',
          icon: 'pi-check-circle',
          type: 'status_change',
          target_status: 'Validé',
          order: 1
        },
        {
          id: 'step_convocation',
          label: 'Convocation',
          icon: 'pi-file-pdf',
          type: 'document_generation',
          doc_key: 'convocation',
          db_column: 'convocation',
          order: 2,
          field_groups: [
            {
              label: 'Convocation',
              fields: [
                { key: 'nom_formation', label: 'Nom de la formation', type: 'text', required: false, placeholder: 'Intitulé de la formation', col_span: 2 },
                { key: 'nom_participant', label: 'Nom du participant', type: 'text', required: false, placeholder: 'Nom et prénom du stagiaire', col_span: 2 },
                { key: 'date_convoc', label: 'Date', type: 'date', required: false, col_span: 1 },
                { key: 'lieu_convoc', label: 'Lieu', type: 'text', required: false, placeholder: 'Adresse du lieu de formation', col_span: 1 },
                { key: 'horaires_convoc_debut', label: 'Heure de début', type: 'time', required: false, col_span: 1 },
                { key: 'horaires_convoc_fin', label: 'Heure de fin', type: 'time', required: false, col_span: 1 },
                { key: 'transport', label: 'Transport', type: 'text', required: false, placeholder: 'Informations transport / accès', col_span: 1 },
                { key: 'equipement', label: 'Équipement', type: 'textarea', required: false, placeholder: 'Matériel à apporter, tenue, EPI...', col_span: 2 },
                { key: 'ref_handicap', label: 'Référent handicap', type: 'textarea', required: false, placeholder: 'Contact du référent handicap', col_span: 2 }
              ]
            }
          ]
        },
        {
          id: 'step_livret',
          label: 'Livret',
          icon: 'pi-file-pdf',
          type: 'document_generation',
          doc_key: 'livret',
          db_column: 'livret',
          order: 3,
          field_groups: [
            {
              label: "Livret d'accueil",
              fields: [
                { key: 'date_livret', label: 'Date', type: 'date', required: false, col_span: 1 },
                { key: 'qui', label: 'Qui sommes-nous', type: 'text', required: false, placeholder: "Présentation de l'organisme", col_span: 1 },
                { key: 'accueil_stagiere', label: 'Accueil stagiaire', type: 'textarea', required: false, placeholder: "Modalités d'accueil", col_span: 2 },
                { key: 'lieu_livret', label: 'Lieu', type: 'text', required: false, placeholder: 'Adresse complète', col_span: 2 },
                { key: 'hebergement', label: 'Hébergement', type: 'text', required: false, placeholder: 'Infos hébergement (si applicable)', col_span: 1 },
                { key: 'restauration', label: 'Restauration', type: 'text', required: false, placeholder: 'Infos restauration', col_span: 1 },
                { key: 'moyens_pedagq', label: 'Moyens pédagogiques', type: 'textarea', required: false, placeholder: 'Matériel, supports, outils...', col_span: 2 },
                { key: 'orga_interne', label: 'Organisation interne', type: 'textarea', required: false, placeholder: 'Règlement intérieur, consignes...', col_span: 2 },
                { key: 'accueil_handicap', label: 'Accueil handicap', type: 'textarea', required: false, placeholder: 'Accessibilité, aménagements...', col_span: 2 }
              ]
            }
          ]
        },
        {
          id: 'step_finished',
          label: 'Terminé',
          icon: 'pi-flag-fill',
          type: 'status_change',
          target_status: 'Terminé',
          order: 4,
          requires_docs: ['convocation', 'livret']
        }
      ]
    }
  ]
};

export { DEFAULT_WORKFLOW };

export const useWorkflowConfigStore = defineStore('workflowConfig', () => {
  const config = ref(null);
  const loading = ref(false);
  const auth = useAuthStore();

  /**
   * Charger la config la plus récente depuis Supabase
   */
  const fetchConfig = async () => {
    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;
      const { data, error } = await supabase
        .from('workflow_config')
        .select('config')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      config.value = data?.config || structuredClone(DEFAULT_WORKFLOW);
    } catch (err) {
      console.error('[WorkflowConfig] Error fetching config:', err);
      config.value = structuredClone(DEFAULT_WORKFLOW);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Sauvegarder la config (INSERT nouvelle version)
   */
  const saveConfig = async (newConfig) => {
    loading.value = true;
    try {
      const { error } = await supabase
        .from('workflow_config')
        .insert({
          config: newConfig,
          is_default: false,
          updated_at: new Date().toISOString(),
          updated_by: auth.user?.id || null,
          organization_id: auth.currentOrganization?.id
        });

      if (error) throw error;

      config.value = newConfig;
      return { success: true };
    } catch (err) {
      console.error('[WorkflowConfig] Error saving config:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Réinitialiser au workflow par défaut
   */
  const resetConfig = async () => {
    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;
      // Supprimer toutes les configs custom
      const { error: deleteError } = await supabase
        .from('workflow_config')
        .delete()
        .eq('is_default', false)
        .eq('organization_id', orgId);

      if (deleteError) throw deleteError;

      // Recharger la config par défaut
      const { data, error } = await supabase
        .from('workflow_config')
        .select('config')
        .eq('is_default', true)
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      config.value = data?.config || structuredClone(DEFAULT_WORKFLOW);
      return { success: true };
    } catch (err) {
      console.error('[WorkflowConfig] Error resetting config:', err);
      config.value = structuredClone(DEFAULT_WORKFLOW);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Helpers pour extraire des infos de la config
   */

  // Toutes les étapes à plat (toutes phases confondues)
  const getAllSteps = () => {
    if (!config.value) return [];
    return config.value.phases
      .sort((a, b) => a.order - b.order)
      .flatMap(phase => phase.steps.sort((a, b) => a.order - b.order));
  };

  // Tous les champs de formulaire à plat
  const getAllFields = () => {
    const steps = getAllSteps();
    return steps
      .filter(s => s.type === 'document_generation' && s.field_groups)
      .flatMap(s => s.field_groups.flatMap(g => g.fields));
  };

  // Toutes les doc_keys utilisées
  const getDocKeys = () => {
    const steps = getAllSteps();
    return steps
      .filter(s => s.type === 'document_generation' && s.doc_key)
      .map(s => ({ doc_key: s.doc_key, db_column: s.db_column }));
  };

  return {
    config,
    loading,
    fetchConfig,
    saveConfig,
    resetConfig,
    getAllSteps,
    getAllFields,
    getDocKeys
  };
});
