import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { useAuditTrail } from '../composables/useAuditTrail';
import { useCompanyStore } from './company';

export const useEvaluationsStore = defineStore('evaluations', () => {
  const executions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const auth = useAuthStore();
  const { logEvent } = useAuditTrail();

  // ── Getters ──

  const executionsByPrestation = (prestationId) =>
    executions.value.filter(e => e.prestation_id === prestationId);

  const executionsAEnvoyer = computed(() =>
    executions.value.filter(e => e.statut === 'non_envoye')
  );

  const executionsEnCours = computed(() =>
    executions.value.filter(e => ['envoye', 'en_cours'].includes(e.statut))
  );

  // ── Fetch ──

  const fetchExecutions = async (prestationId = null) => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return;

    loading.value = true;
    error.value = null;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('evaluation_executions')
        .select(`
          *,
          prestation:prestation_id(id, intitule, reference, type)
        `)
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      if (prestationId) {
        query = query.eq('prestation_id', prestationId);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      executions.value = data || [];
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // ── CRUD ──

  /**
   * Créer une exécution d'évaluation dans une prestation
   * @param {string} prestationId - UUID prestation
   * @param {string} modeleId - UUID du modèle quiz/enquête
   * @param {string} typeEvaluation - 'quiz_positionnement', 'satisfaction_stagiaire', etc.
   * @param {number|null} seuilSession - Seuil spécifique à cette session (override du global)
   */
  const createExecution = async (prestationId, modeleId, typeEvaluation, seuilSession = null) => {
    try {
      const { data, error: err } = await supabase
        .from('evaluation_executions')
        .insert({
          prestation_id: prestationId,
          modele_id: modeleId,
          type_evaluation: typeEvaluation,
          seuil_session: seuilSession,
          statut: 'non_envoye',
          organization_id: auth.currentOrganization?.id,
          user_id: auth.user.id,
        })
        .select()
        .single();

      if (err) throw err;

      executions.value.unshift(data);
      await logEvent('evaluation', data.id, 'creation', null, null, { type: typeEvaluation, prestation_id: prestationId });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Envoyer une évaluation aux destinataires
   */
  const envoyerEvaluation = async (executionId, destinataires = []) => {
    try {
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error: err } = await supabase
        .from('evaluation_executions')
        .update({
          statut: 'envoye',
          date_envoi: new Date().toISOString(),
          resultats: { destinataires, reponses: [] },
        })
        .eq('id', executionId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (err) throw err;

      const index = executions.value.findIndex(e => e.id === executionId);
      if (index !== -1) executions.value[index] = data;

      await logEvent('evaluation', executionId, 'envoi', null, null, {
        nb_destinataires: destinataires.length,
      });

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Relancer une évaluation
   */
  const relancerEvaluation = async (executionId) => {
    try {
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error: err } = await supabase
        .from('evaluation_executions')
        .update({ date_relance: new Date().toISOString() })
        .eq('id', executionId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (err) throw err;

      const index = executions.value.findIndex(e => e.id === executionId);
      if (index !== -1) executions.value[index] = data;

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Clôturer une évaluation — compare résultats aux seuils → crée signaux si nécessaire
   * @returns {{ success: boolean, signaux?: Array }}
   */
  const clotureEvaluation = async (executionId) => {
    try {
      const execution = executions.value.find(e => e.id === executionId);
      if (!execution) throw new Error('Exécution introuvable');

      // Mettre à jour le statut — filtré par organisation
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error: err } = await supabase
        .from('evaluation_executions')
        .update({ statut: 'cloture' })
        .eq('id', executionId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (err) throw err;

      const index = executions.value.findIndex(e => e.id === executionId);
      if (index !== -1) executions.value[index] = data;

      // Vérifier les seuils et créer des signaux si nécessaire
      const signauxCrees = await verifierSeuils(execution);

      await logEvent('evaluation', executionId, 'cloture', null, null, {
        signaux_crees: signauxCrees.length,
      });

      return { success: true, signaux: signauxCrees };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Vérifier les seuils qualité et créer des signaux si nécessaire
   */
  const verifierSeuils = async (execution) => {
    const signauxCrees = [];

    try {
      const companyStore = useCompanyStore();
      const company = companyStore.company;
      if (!company) return signauxCrees;

      const resultats = execution.resultats || {};
      const type = execution.type_evaluation;
      const seuilSession = execution.seuil_session;

      // Seuil applicable (session override ou global société)
      let seuilApplicable = null;
      let typeSignal = null;

      if (type === 'satisfaction_stagiaire') {
        seuilApplicable = seuilSession || company.seuil_satisfaction_chaud || 80;
        typeSignal = 'satisfaction_basse';
      } else if (type === 'satisfaction_formateur') {
        seuilApplicable = seuilSession || company.seuil_satisfaction_formateur || 80;
        typeSignal = 'satisfaction_basse';
      } else if (type === 'satisfaction_financeur') {
        seuilApplicable = seuilSession || company.seuil_satisfaction_financeur || 80;
        typeSignal = 'satisfaction_basse';
      } else if (type === 'quiz_validation') {
        seuilApplicable = seuilSession || company.seuil_quiz_validation || 70;
        typeSignal = 'quiz_echec';
      }

      // Vérifier la moyenne des résultats
      const reponses = resultats.reponses || [];
      if (reponses.length > 0 && seuilApplicable) {
        const moyenne = reponses.reduce((sum, r) => sum + (r.score || 0), 0) / reponses.length;

        if (moyenne < seuilApplicable) {
          const { data: signal } = await supabase
            .from('signaux_qualite')
            .insert({
              prestation_id: execution.prestation_id,
              evaluation_execution_id: execution.id,
              type_signal: typeSignal,
              seuil_applique: seuilApplicable,
              valeur_obtenue: Math.round(moyenne * 100) / 100,
              statut: 'ouvert',
              organization_id: auth.currentOrganization?.id,
              user_id: auth.user.id,
            })
            .select()
            .single();

          if (signal) signauxCrees.push(signal);
        }
      }

      // Vérifier le taux de réponse
      const destinataires = resultats.destinataires || [];
      if (destinataires.length > 0) {
        const tauxReponse = (reponses.length / destinataires.length) * 100;
        const seuilTauxReponse = company.seuil_taux_reponse || 60;

        if (tauxReponse < seuilTauxReponse) {
          const { data: signal } = await supabase
            .from('signaux_qualite')
            .insert({
              prestation_id: execution.prestation_id,
              evaluation_execution_id: execution.id,
              type_signal: 'taux_reponse_bas',
              seuil_applique: seuilTauxReponse,
              valeur_obtenue: Math.round(tauxReponse * 100) / 100,
              statut: 'ouvert',
              organization_id: auth.currentOrganization?.id,
              user_id: auth.user.id,
            })
            .select()
            .single();

          if (signal) signauxCrees.push(signal);
        }
      }

      // Vérifier les questions critiques
      if (company.declenchement_question_critique) {
        const questionsCritiques = reponses.filter(r => r.is_critique && r.score_critique_low);
        for (const qc of questionsCritiques) {
          const { data: signal } = await supabase
            .from('signaux_qualite')
            .insert({
              prestation_id: execution.prestation_id,
              evaluation_execution_id: execution.id,
              type_signal: 'question_critique',
              description_probleme: `Question critique détectée: ${qc.question || 'N/A'}`,
              statut: 'ouvert',
              organization_id: auth.currentOrganization?.id,
              user_id: auth.user.id,
            })
            .select()
            .single();

          if (signal) signauxCrees.push(signal);
        }
      }
    } catch (e) {
      console.warn('[EvaluationsStore] Erreur vérification seuils:', e.message);
    }

    return signauxCrees;
  };

  // ── Indicateurs consolidés ──

  /**
   * Retourne les indicateurs consolidés pour l'ensemble des évaluations
   */
  const getIndicateursConsolides = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) return {};

    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('evaluation_executions')
        .select('type_evaluation, resultats, statut')
        .eq('statut', 'cloture');

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error: err } = await query;

      if (err) throw err;

      const indicateurs = {
        satisfaction_stagiaire: { total: 0, somme: 0, count: 0 },
        satisfaction_formateur: { total: 0, somme: 0, count: 0 },
        satisfaction_financeur: { total: 0, somme: 0, count: 0 },
        quiz_positionnement: { total: 0, somme: 0, count: 0 },
        quiz_validation: { total: 0, somme: 0, count: 0 },
        taux_reponse_global: { total_destinataires: 0, total_reponses: 0 },
      };

      for (const exec of (data || [])) {
        const resultats = exec.resultats || {};
        const reponses = resultats.reponses || [];
        const destinataires = resultats.destinataires || [];
        const type = exec.type_evaluation;

        if (indicateurs[type]) {
          indicateurs[type].total++;
          if (reponses.length > 0) {
            const moyenne = reponses.reduce((sum, r) => sum + (r.score || 0), 0) / reponses.length;
            indicateurs[type].somme += moyenne;
            indicateurs[type].count++;
          }
        }

        indicateurs.taux_reponse_global.total_destinataires += destinataires.length;
        indicateurs.taux_reponse_global.total_reponses += reponses.length;
      }

      // Calculer les moyennes
      const result = {};
      for (const [key, val] of Object.entries(indicateurs)) {
        if (key === 'taux_reponse_global') {
          result[key] = val.total_destinataires > 0
            ? Math.round((val.total_reponses / val.total_destinataires) * 100)
            : 0;
        } else {
          result[key] = {
            moyenne: val.count > 0 ? Math.round((val.somme / val.count) * 100) / 100 : 0,
            nombre_evaluations: val.total,
          };
        }
      }

      // Compter les signaux
      let signauxOuvertsQuery = supabase
        .from('signaux_qualite')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'ouvert');
      if (orgId) {
        signauxOuvertsQuery = signauxOuvertsQuery.eq('organization_id', orgId);
      }
      const { count: signauxOuverts } = await signauxOuvertsQuery;

      let signauxClosQuery = supabase
        .from('signaux_qualite')
        .select('*', { count: 'exact', head: true })
        .eq('statut', 'clos');
      if (orgId) {
        signauxClosQuery = signauxClosQuery.eq('organization_id', orgId);
      }
      const { count: signauxClos } = await signauxClosQuery;

      result.signaux = { ouverts: signauxOuverts || 0, clos: signauxClos || 0 };

      return result;
    } catch (err) {
      console.error('[EvaluationsStore] getIndicateurs:', err.message);
      return {};
    }
  };

  return {
    // State
    executions,
    loading,
    error,
    // Getters
    executionsByPrestation,
    executionsAEnvoyer,
    executionsEnCours,
    // CRUD
    fetchExecutions,
    createExecution,
    envoyerEvaluation,
    relancerEvaluation,
    clotureEvaluation,
    // Indicateurs
    getIndicateursConsolides,
  };
});
