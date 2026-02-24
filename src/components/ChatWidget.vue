<script setup>
import { ref, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

const { t } = useI18n();
const auth = useAuthStore();

const isOpen = ref(false);
const inputMessage = ref('');
const loading = ref(false);
const messagesContent = ref(null); // Pour le scroll auto

// Initialiser avec un message de bienvenue
const messages = ref([
  { id: 1, text: t('chat.welcome'), isUser: false }
]);

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) scrollToBottom();
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContent.value) {
    messagesContent.value.scrollTop = messagesContent.value.scrollHeight;
  }
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  // 1. Ajouter le message utilisateur
  const userText = inputMessage.value;
  messages.value.push({ id: Date.now(), text: userText, isUser: true });
  inputMessage.value = '';
  loading.value = true;
  scrollToBottom();

  try {
    // Refresh session before API call
    await auth.refreshSession();

    // 2. Appel à notre API Cloudflare (avec authentification et timeout 60s)
    const response = await fetchWithTimeout('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.session?.access_token || ''}`
      },
      body: JSON.stringify({ message: userText })
    }, 60000);

    const data = await response.json();

    // 3. Ajouter la réponse du bot
    // Adapte 'data.output' selon ce que renvoie ton noeud n8n (ex: data.text, data.response...)
    const botResponse = data.output || data.text || data.message || "Réponse vide du serveur.";
    
    messages.value.push({ id: Date.now() + 1, text: botResponse, isUser: false });

  } catch (error) {
    messages.value.push({ id: Date.now() + 1, text: t('chat.error'), isUser: false, isError: true });
  } finally {
    loading.value = false;
    scrollToBottom();
  }
};
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end">
    
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-10 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-10 scale-95"
    >
      <div v-if="isOpen" class="mb-4 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px]">
        
        <div class="bg-primary p-4 text-white flex justify-between items-center">
          <div class="flex items-center gap-2">
            <i class="pi pi-comments text-xl"></i>
            <h3 class="font-semibold">{{ t('chat.title') }}</h3>
          </div>
          <button @click="toggleChat" class="hover:bg-white/20 p-1 rounded transition">
            <i class="pi pi-times"></i>
          </button>
        </div>

        <div ref="messagesContent" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          <div 
            v-for="msg in messages" 
            :key="msg.id" 
            class="flex"
            :class="msg.isUser ? 'justify-end' : 'justify-start'"
          >
            <div 
              class="max-w-[80%] p-3 rounded-lg text-sm shadow-sm"
              :class="[
                msg.isUser 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-gray-600',
                msg.isError ? 'bg-red-100 text-red-600 border-red-200' : ''
              ]"
            >
              {{ msg.text }}
            </div>
          </div>
          
          <div v-if="loading" class="flex justify-start">
            <div class="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-lg rounded-bl-none text-xs text-gray-500 animate-pulse">
              {{ t('chat.typing') }}
            </div>
          </div>
        </div>

        <div class="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <InputText 
              v-model="inputMessage" 
              :placeholder="t('chat.placeholder')" 
              class="flex-1 text-sm" 
              :disabled="loading"
            />
            <Button 
              type="submit" 
              icon="pi pi-send" 
              class="!p-2" 
              :disabled="loading || !inputMessage.trim()" 
            />
          </form>
        </div>
      </div>
    </transition>

    <div class="relative group">
        <button 
        disabled
        class="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 bg-gray-400 cursor-not-allowed text-white"
        >
        <i class="pi pi-comments text-2xl"></i>
        </button>
        <div class="absolute bottom-16 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            En cours de dev
        </div>
    </div>
  </div>
</template>