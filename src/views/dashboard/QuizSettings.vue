<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '../../supabase';
import { useI18n } from 'vue-i18n';

// PrimeVue Imports
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Card from 'primevue/card';
import ToggleSwitch from 'primevue/toggleswitch';

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const message = ref(null);
const quizSettings = ref([]);

// Charger les paramètres de quiz depuis Supabase
const loadQuizSettings = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('quiz_settings')
      .select('*')
      .order('created_at');

    if (error) throw error;
    quizSettings.value = data || [];
  } catch (error) {
    console.error('Error loading quiz settings:', error);
    message.value = { severity: 'error', text: t('quiz_settings.load_error') };
  } finally {
    loading.value = false;
  }
};

// Sauvegarder les paramètres
const saveSettings = async () => {
  saving.value = true;
  message.value = null;

  try {
    // Valider que tous les liens sont des URLs valides
    for (const quiz of quizSettings.value) {
      if (quiz.default_link && !isValidUrl(quiz.default_link)) {
        message.value = {
          severity: 'warn',
          text: t('quiz_settings.invalid_url', { label: quiz.label })
        };
        saving.value = false;
        return;
      }
    }

    // Mettre à jour chaque quiz
    for (const quiz of quizSettings.value) {
      const { error } = await supabase
        .from('quiz_settings')
        .update({
          default_link: quiz.default_link,
          label: quiz.label,
          description: quiz.description,
          is_active: quiz.is_active
        })
        .eq('id', quiz.id);

      if (error) throw error;
    }

    message.value = { severity: 'success', text: t('quiz_settings.save_success') };
  } catch (error) {
    console.error('Error saving quiz settings:', error);
    message.value = {
      severity: 'error',
      text: t('quiz_settings.save_error', { error: error.message })
    };
  } finally {
    saving.value = false;
  }
};

// Valider une URL
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

// Obtenir l'icône pour chaque type de quiz
const getQuizIcon = (quizType) => {
  const icons = {
    positioning_quiz: 'pi-question-circle',
    evaluation_quiz: 'pi-check-square'
  };
  return icons[quizType] || 'pi-file';
};

onMounted(() => {
  loadQuizSettings();
});
</script>

<template>
  <div class="max-w-4xl mx-auto pb-20">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('quiz_settings.title') }}
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ t('quiz_settings.subtitle') }}
        </p>
      </div>
      <Button
        :label="t('quiz_settings.save')"
        icon="pi pi-save"
        :loading="saving"
        @click="saveSettings"
      />
    </div>

    <Message v-if="message" :severity="message.severity" class="mb-4">
      {{ message.text }}
    </Message>

    <div v-if="loading" class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <div v-else class="space-y-4">
      <Card v-for="quiz in quizSettings" :key="quiz.id" class="shadow-sm">
        <template #content>
          <div class="space-y-4">
            <!-- En-tête avec icône et toggle -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <i :class="['text-2xl text-primary', getQuizIcon(quiz.quiz_type)]"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-lg text-gray-900 dark:text-white">
                    {{ quiz.label }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ quiz.description }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm text-gray-600 dark:text-gray-400">
                  {{ t('quiz_settings.active') }}
                </label>
                <ToggleSwitch v-model="quiz.is_active" />
              </div>
            </div>

            <!-- Champ URL -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('quiz_settings.default_link') }}
              </label>
              <div class="flex gap-2">
                <InputText
                  v-model="quiz.default_link"
                  :placeholder="t('quiz_settings.link_placeholder')"
                  class="flex-1"
                  :class="{ 'p-invalid': quiz.default_link && !isValidUrl(quiz.default_link) }"
                />
                <Button
                  v-if="quiz.default_link && isValidUrl(quiz.default_link)"
                  icon="pi pi-external-link"
                  severity="secondary"
                  outlined
                  @click="window.open(quiz.default_link, '_blank')"
                  :aria-label="t('quiz_settings.test_link')"
                />
              </div>
              <small class="text-gray-500 dark:text-gray-400">
                {{ t('quiz_settings.link_help') }}
              </small>
            </div>
          </div>
        </template>
      </Card>

      <div v-if="quizSettings.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
        <i class="pi pi-inbox text-6xl mb-4 opacity-50"></i>
        <p>{{ t('quiz_settings.no_quiz') }}</p>
      </div>
    </div>
  </div>
</template>
