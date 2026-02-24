<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();

// Onglet Profil
const fullName = ref(authStore.user?.user_metadata?.full_name || '');
const email = ref(authStore.user?.email || '');
const loadingProfile = ref(false);
const profileMsg = ref({ type: '', content: '' });

const updateProfile = async () => {
  loadingProfile.value = true;
  profileMsg.value = { type: '', content: '' };

  try {
    const result = await authStore.updateProfile(fullName.value);

    if (result?.success) {
      profileMsg.value = { type: 'success', content: t('settings.profile_success') };
      // Mettre à jour le nom local depuis le store
      fullName.value = authStore.user?.user_metadata?.full_name || fullName.value;
    }
  } catch (error) {
    console.error('Profile update error:', error);
    profileMsg.value = { type: 'error', content: error.message || 'Erreur lors de la mise à jour' };
  } finally {
    loadingProfile.value = false;
  }
};

// Onglet Mot de passe
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loadingPassword = ref(false);
const passwordMsg = ref({ type: '', content: '' });

const updatePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    passwordMsg.value = { type: 'error', content: t('settings.password_mismatch') };
    return;
  }

  if (!currentPassword.value) {
    passwordMsg.value = { type: 'error', content: t('settings.password_required') };
    return;
  }

  loadingPassword.value = true;
  passwordMsg.value = { type: '', content: '' };
  
  try {
    // D'abord vérifier que le mot de passe actuel est correct en essayant de se reconnecter
    await authStore.verifyCurrentPassword(email.value, currentPassword.value);
    
    // Si la vérification réussit, mettre à jour le mot de passe
    await authStore.updateUserPassword(newPassword.value);
    
    passwordMsg.value = { type: 'success', content: t('settings.password_success') };
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    passwordMsg.value = { type: 'error', content: error.message || t('settings.password_incorrect') };
  } finally {
    loadingPassword.value = false;
  }
};

const deleteAccount = async () => {
  if (confirm(t('settings.delete_confirm'))) {
    try {
      // TODO: Implémenter la suppression de compte
      alert(t('settings.delete_coming'));
    } catch (error) {
      alert('Erreur lors de la suppression du compte');
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ t('settings.title') }}</h1>
        <p class="text-gray-600 dark:text-gray-400">{{ t('settings.subtitle') }}</p>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <Tabs value="0">
          <TabList>
            <Tab value="0">
              <i class="pi pi-user mr-2"></i>
              {{ t('settings.tab_profile') }}
            </Tab>
            <Tab value="1">
              <i class="pi pi-lock mr-2"></i>
              {{ t('settings.tab_password') }}
            </Tab>
            <Tab value="2">
              <i class="pi pi-cog mr-2"></i>
              {{ t('settings.tab_preferences') }}
            </Tab>
          </TabList>

          <TabPanels>
            <!-- Onglet Profil -->
            <TabPanel value="0">
              <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{{ t('settings.profile_title') }}</h2>
                
                <form @submit.prevent="updateProfile" class="space-y-6">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('settings.full_name') }}</label>
                    <InputText v-model="fullName" class="w-full" />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('settings.email') }}</label>
                    <InputText v-model="email" type="email" class="w-full" disabled />
                    <small class="text-gray-500">{{ t('settings.email_note') }}</small>
                  </div>

                  <Message v-if="profileMsg.content" :severity="profileMsg.type" :closable="false">
                    {{ profileMsg.content }}
                  </Message>

                  <Button type="submit" :label="t('settings.save_changes')" :loading="loadingProfile" />
                </form>
              </div>
            </TabPanel>

            <!-- Onglet Mot de passe -->
            <TabPanel value="1">
              <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{{ t('settings.password_title') }}</h2>
                
                <form @submit.prevent="updatePassword" class="space-y-6">
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('settings.current_password') }}</label>
                    <Password v-model="currentPassword" toggleMask :feedback="false" class="w-full" inputClass="w-full" required />
                    <small class="text-gray-500">{{ t('settings.current_password_note') }}</small>
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('settings.new_password') }}</label>
                    <Password v-model="newPassword" toggleMask class="w-full" inputClass="w-full" required />
                  </div>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('settings.confirm_password') }}</label>
                    <Password v-model="confirmPassword" toggleMask :feedback="false" class="w-full" inputClass="w-full" required />
                  </div>

                  <Message v-if="passwordMsg.content" :severity="passwordMsg.type" :closable="false">
                    {{ passwordMsg.content }}
                  </Message>

                  <Button type="submit" :label="t('settings.update_password')" :loading="loadingPassword" />
                </form>
              </div>
            </TabPanel>

            <!-- Onglet Préférences -->
            <TabPanel value="2">
              <div class="p-6">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">{{ t('settings.preferences_title') }}</h2>
                
                <div class="space-y-6">
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 class="text-lg font-semibold text-red-600 mb-4">{{ t('settings.danger_zone') }}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                      {{ t('settings.danger_desc') }}
                    </p>
                    <Button 
                      :label="t('settings.delete_account')" 
                      severity="danger" 
                      outlined
                      @click="deleteAccount"
                    />
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>
  </div>
</template>