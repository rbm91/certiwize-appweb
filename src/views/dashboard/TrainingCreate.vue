<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTrainingStore } from '../../stores/training';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import { useI18n } from 'vue-i18n';

// Imports PrimeVue
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Message from 'primevue/message';
import Dropdown from 'primevue/dropdown';
import ProgressBar from 'primevue/progressbar';
import { useConfirm } from 'primevue/useconfirm';
import { useFormValidation } from '../../composables/useFormValidation';

// === TOUS les composables ===
const confirm = useConfirm();
const route = useRoute();
const router = useRouter();
const trainingStore = useTrainingStore();
const authStore = useAuthStore();
const { errors, validate, clearError } = useFormValidation();
const { t } = useI18n();

const id = route.params.id;
const setupOk = ref(true);
</script>

<template>
    <div class="p-8">
        <h1 class="text-3xl font-bold text-green-600">SETUP OK — Tous les imports fonctionnent</h1>
        <p class="mt-4">Mode: {{ id ? 'EDITION' : 'CREATION' }}</p>
        <p v-if="id" class="mt-2 text-gray-500">ID: {{ id }}</p>
        <p class="mt-4">Auth user: {{ authStore.user?.email || 'non connecté' }}</p>
        <p>Org: {{ authStore.currentOrganization?.name || 'aucune' }}</p>
        <p>isSuperAdmin: {{ authStore.isSuperAdmin }}</p>

        <!-- Test rapide d'un composant PrimeVue -->
        <div class="mt-6">
            <Button label="Test PrimeVue Button" icon="pi pi-check" />
        </div>
    </div>
</template>
