import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '../supabase';
import { useAuthStore } from './auth';
import { generateShareToken } from '../config/quizTemplates';

export const useQuizStore = defineStore('quiz', () => {
  const loading = ref(false);
  const quizzes = ref([]);
  const auth = useAuthStore();

  // ─── QUIZ CRUD (authentifié) ───────────────────────────

  const fetchQuizzes = async () => {
    if (!auth.currentOrganization?.id && !auth.isSuperAdmin) {
      loading.value = false;
      return;
    }

    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;

      let query = supabase
        .from('quizzes')
        .select('*, formations(title)')
        .order('updated_at', { ascending: false });

      if (!auth.isSuperAdmin) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;
      if (error) throw error;

      quizzes.value = data || [];
    } catch (err) {
      console.error('[QuizStore] Error fetching quizzes:', err);
      quizzes.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchQuiz = async (id) => {
    loading.value = true;
    try {
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error } = await supabase
        .from('quizzes')
        .select('*, formations(title)')
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[QuizStore] Error fetching quiz:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // PUBLIC : récupérer un quiz par son token de partage (pas d'auth requise)
  const fetchQuizByToken = async (token) => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, description, quiz_type, questions, settings, share_token, is_active')
        .eq('share_token', token)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('[QuizStore] Error fetching quiz by token:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createQuiz = async (quizData) => {
    loading.value = true;
    try {
      const payload = {
        organization_id: auth.currentOrganization?.id,
        user_id: auth.user.id,
        title: quizData.title || 'Nouveau quiz',
        description: quizData.description || null,
        quiz_type: quizData.quiz_type || 'custom',
        formation_id: quizData.formation_id || null,
        questions: quizData.questions || [],
        settings: quizData.settings || {
          show_all_at_once: true,
          passing_score: null,
          shuffle_questions: false,
          time_limit_minutes: null,
        },
        share_token: generateShareToken(),
        is_active: true,
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Rafraîchir la liste
      await fetchQuizzes();

      return { success: true, data };
    } catch (err) {
      console.error('[QuizStore] Error creating quiz:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const updateQuiz = async (id, quizData) => {
    loading.value = true;
    try {
      const payload = {
        title: quizData.title,
        description: quizData.description || null,
        quiz_type: quizData.quiz_type,
        formation_id: quizData.formation_id || null,
        questions: quizData.questions,
        settings: quizData.settings,
        is_active: quizData.is_active !== undefined ? quizData.is_active : true,
        updated_at: new Date().toISOString(),
      };

      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { data, error } = await supabase
        .from('quizzes')
        .update(payload)
        .eq('id', id)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) throw error;

      // Rafraîchir la liste
      await fetchQuizzes();

      return { success: true, data };
    } catch (err) {
      console.error('[QuizStore] Error updating quiz:', err);
      return { success: false, error: err.message };
    } finally {
      loading.value = false;
    }
  };

  const deleteQuiz = async (id) => {
    try {
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      quizzes.value = quizzes.value.filter((q) => q.id !== id);
    } catch (err) {
      console.error('[QuizStore] Error deleting quiz:', err);
      throw new Error('Impossible de supprimer ce quiz.');
    }
  };

  const toggleQuizActive = async (id, isActive) => {
    try {
      const orgId = auth.currentOrganization?.id;
      if (!orgId) throw new Error('Aucune organisation sélectionnée');

      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId);

      if (error) throw error;

      // Mettre à jour localement
      const quiz = quizzes.value.find((q) => q.id === id);
      if (quiz) quiz.is_active = isActive;
    } catch (err) {
      console.error('[QuizStore] Error toggling quiz:', err);
      throw err;
    }
  };

  // ─── RESPONSES (public submit + owner read) ───────────

  const submitResponse = async (responseData) => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .insert([responseData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('[QuizStore] Error submitting response:', err);
      return { success: false, error: err.message };
    }
  };

  const fetchResponses = async (quizId) => {
    try {
      // Vérifier que le quiz appartient à l'organisation courante
      const orgId = auth.currentOrganization?.id;
      if (orgId) {
        const { data: quizCheck } = await supabase
          .from('quizzes')
          .select('id')
          .eq('id', quizId)
          .eq('organization_id', orgId)
          .maybeSingle();

        if (!quizCheck) throw new Error('Quiz introuvable dans cette organisation');
      }

      const { data, error } = await supabase
        .from('quiz_responses')
        .select('*')
        .eq('quiz_id', quizId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('[QuizStore] Error fetching responses:', err);
      return [];
    }
  };

  // Vérifier si un email a déjà répondu à ce quiz
  const checkExistingResponse = async (quizId, email) => {
    try {
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('learner_email', email)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('[QuizStore] Error checking response:', err);
      return false;
    }
  };

  // Compter le nombre de réponses pour un quiz
  const getResponseCount = async (quizId) => {
    try {
      const { count, error } = await supabase
        .from('quiz_responses')
        .select('*', { count: 'exact', head: true })
        .eq('quiz_id', quizId);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  };

  return {
    loading,
    quizzes,
    fetchQuizzes,
    fetchQuiz,
    fetchQuizByToken,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    toggleQuizActive,
    submitResponse,
    fetchResponses,
    checkExistingResponse,
    getResponseCount,
  };
});
