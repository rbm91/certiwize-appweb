<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import ProgressBar from 'primevue/progressbar';
import QuestionPreview from '../../components/quiz/QuestionPreview.vue';
import { useQuizStore } from '../../stores/quiz';
import { calculateTotalPoints, calculateEarnedPoints } from '../../config/quizTemplates';

const { t } = useI18n();
const route = useRoute();
const quizStore = useQuizStore();

// States
const step = ref('loading'); // loading | identify | questions | thankyou | error | already
const quiz = ref(null);
const learnerName = ref('');
const learnerEmail = ref('');
const answers = ref({});
const currentQuestionIndex = ref(0);
const submitting = ref(false);
const result = ref(null);

const token = computed(() => route.params.token);

// Déterminer les questions à afficher (shuffle si configuré)
const displayQuestions = computed(() => {
  if (!quiz.value?.questions) return [];
  let qs = [...quiz.value.questions];
  if (quiz.value.settings?.shuffle_questions) {
    // Fisher-Yates shuffle
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
  }
  return qs;
});

const showAllAtOnce = computed(() => quiz.value?.settings?.show_all_at_once !== false);
const currentQuestion = computed(() => displayQuestions.value[currentQuestionIndex.value]);
const progress = computed(() => {
  if (!displayQuestions.value.length) return 0;
  return Math.round(((currentQuestionIndex.value + 1) / displayQuestions.value.length) * 100);
});

// Charger le quiz
onMounted(async () => {
  try {
    const data = await quizStore.fetchQuizByToken(token.value);
    if (!data) {
      step.value = 'error';
      return;
    }
    quiz.value = data;
    step.value = 'identify';
  } catch (err) {
    step.value = 'error';
  }
});

// Vérifier et commencer le quiz
const startQuiz = async () => {
  if (!learnerName.value.trim() || !learnerEmail.value.trim()) {
    return;
  }

  // Vérifier si déjà répondu
  const alreadyDone = await quizStore.checkExistingResponse(quiz.value.id, learnerEmail.value.trim());
  if (alreadyDone) {
    step.value = 'already';
    return;
  }

  step.value = 'questions';
};

// Navigation question par question
const nextQuestion = () => {
  if (currentQuestionIndex.value < displayQuestions.value.length - 1) {
    currentQuestionIndex.value++;
  }
};

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
  }
};

// Soumettre les réponses
const submitQuiz = async () => {
  submitting.value = true;

  try {
    // Construire le tableau de réponses
    const answersArray = displayQuestions.value.map((q) => ({
      question_id: q.id,
      value: answers.value[q.id] ?? null,
    }));

    // Calculer le score
    const totalPts = calculateTotalPoints(displayQuestions.value);
    const earnedPts = calculateEarnedPoints(displayQuestions.value, answersArray);
    const scorePercent = totalPts > 0 ? Math.round((earnedPts / totalPts) * 100 * 100) / 100 : null;
    const passingScore = quiz.value.settings?.passing_score;
    const passed = passingScore != null && scorePercent != null ? scorePercent >= passingScore : null;

    const responseData = {
      quiz_id: quiz.value.id,
      learner_name: learnerName.value.trim(),
      learner_email: learnerEmail.value.trim(),
      answers: answersArray,
      score: scorePercent,
      total_points: totalPts || null,
      earned_points: earnedPts || null,
      passed,
      started_at: new Date().toISOString(),
    };

    const res = await quizStore.submitResponse(responseData);

    if (res.success) {
      result.value = {
        score: scorePercent,
        passed,
        totalPoints: totalPts,
        earnedPoints: earnedPts,
      };
      step.value = 'thankyou';
    } else {
      throw new Error(res.error);
    }
  } catch (err) {
    console.error('[QuizPublic] Submit error:', err);
    submitting.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-950 dark:to-surface-900 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">

      <!-- Loading -->
      <div v-if="step === 'loading'" class="text-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4" />
        <p class="text-surface-500">{{ t('quiz_builder.public_loading') }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="step === 'error'" class="text-center py-20">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500 mb-4" />
        <p class="text-surface-600 dark:text-surface-400">{{ t('quiz_builder.public_not_found') }}</p>
      </div>

      <!-- Already submitted -->
      <div v-else-if="step === 'already'" class="text-center py-20">
        <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <i class="pi pi-info-circle text-4xl text-blue-500 mb-4" />
          <h2 class="text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">
            {{ t('quiz_builder.public_already_submitted') }}
          </h2>
        </div>
      </div>

      <!-- Identify step -->
      <div v-else-if="step === 'identify'" class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-surface-800 dark:text-surface-100">
            {{ quiz?.title }}
          </h1>
          <p v-if="quiz?.description" class="text-surface-500 dark:text-surface-400 mt-2">
            {{ quiz.description }}
          </p>
          <div class="mt-4 text-sm text-surface-400">
            {{ displayQuestions.length }} {{ t('quiz_builder.questions_count') }}
          </div>
        </div>

        <div class="space-y-4 max-w-sm mx-auto">
          <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 uppercase tracking-wide text-center">
            {{ t('quiz_builder.public_identify') }}
          </h3>
          <div>
            <label class="block text-sm text-surface-600 dark:text-surface-300 mb-1">
              {{ t('quiz_builder.public_name') }}
            </label>
            <InputText
              v-model="learnerName"
              :placeholder="t('quiz_builder.public_name_placeholder')"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm text-surface-600 dark:text-surface-300 mb-1">
              {{ t('quiz_builder.public_email') }}
            </label>
            <InputText
              v-model="learnerEmail"
              type="email"
              :placeholder="t('quiz_builder.public_email_placeholder')"
              class="w-full"
            />
          </div>
          <Button
            :label="t('quiz_builder.public_start')"
            icon="pi pi-arrow-right"
            iconPos="right"
            class="w-full mt-4"
            :disabled="!learnerName.trim() || !learnerEmail.trim()"
            @click="startQuiz"
          />
        </div>
      </div>

      <!-- Questions step -->
      <div v-else-if="step === 'questions'">
        <!-- All at once mode -->
        <div v-if="showAllAtOnce" class="space-y-4">
          <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-6 mb-4">
            <h1 class="text-xl font-bold text-surface-800 dark:text-surface-100">
              {{ quiz?.title }}
            </h1>
          </div>

          <QuestionPreview
            v-for="(question, index) in displayQuestions"
            :key="question.id"
            :question="question"
            :index="index"
            :disabled="false"
            v-model="answers[question.id]"
          />

          <div class="flex justify-end">
            <Button
              :label="t('quiz_builder.public_submit')"
              icon="pi pi-send"
              :loading="submitting"
              @click="submitQuiz"
            />
          </div>
        </div>

        <!-- One by one mode -->
        <div v-else class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-6">
          <div class="mb-4">
            <div class="flex items-center justify-between text-sm text-surface-500 mb-2">
              <span>{{ t('quiz_builder.questions_count') }} {{ currentQuestionIndex + 1 }}/{{ displayQuestions.length }}</span>
              <span>{{ progress }}%</span>
            </div>
            <ProgressBar :value="progress" :showValue="false" class="h-2" />
          </div>

          <QuestionPreview
            v-if="currentQuestion"
            :key="currentQuestion.id"
            :question="currentQuestion"
            :index="currentQuestionIndex"
            :disabled="false"
            v-model="answers[currentQuestion.id]"
          />

          <div class="flex items-center justify-between mt-6">
            <Button
              :label="t('quiz_builder.public_previous')"
              icon="pi pi-arrow-left"
              severity="secondary"
              outlined
              :disabled="currentQuestionIndex === 0"
              @click="prevQuestion"
            />
            <Button
              v-if="currentQuestionIndex < displayQuestions.length - 1"
              :label="t('quiz_builder.public_next')"
              icon="pi pi-arrow-right"
              iconPos="right"
              @click="nextQuestion"
            />
            <Button
              v-else
              :label="t('quiz_builder.public_submit')"
              icon="pi pi-send"
              :loading="submitting"
              @click="submitQuiz"
            />
          </div>
        </div>
      </div>

      <!-- Thank you step -->
      <div v-else-if="step === 'thankyou'" class="text-center py-12">
        <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-check text-3xl text-emerald-600" />
          </div>
          <h2 class="text-2xl font-bold text-surface-800 dark:text-surface-100 mb-2">
            {{ t('quiz_builder.public_thank_you') }}
          </h2>
          <p class="text-surface-500 dark:text-surface-400 mb-6">
            {{ t('quiz_builder.public_thank_you_desc') }}
          </p>

          <!-- Score -->
          <div v-if="result?.score != null" class="space-y-3">
            <div class="text-4xl font-bold" :class="result.passed ? 'text-emerald-600' : result.passed === false ? 'text-red-500' : 'text-primary-600'">
              {{ result.score }}%
            </div>
            <p class="text-sm text-surface-500">
              {{ t('quiz_builder.public_your_score') }}
              ({{ result.earnedPoints }}/{{ result.totalPoints }} pts)
            </p>
            <p v-if="result.passed === true" class="text-emerald-600 font-medium">
              <i class="pi pi-check-circle mr-1" />{{ t('quiz_builder.public_passed') }}
            </p>
            <p v-else-if="result.passed === false" class="text-red-500 font-medium">
              <i class="pi pi-times-circle mr-1" />{{ t('quiz_builder.public_failed') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
