<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const id = route.params.id;
const results = ref([]);

// Test chaque import/composable individuellement
const test = async (name, fn) => {
    try {
        await fn();
        results.value.push({ name, ok: true });
    } catch (e) {
        results.value.push({ name, ok: false, error: e.message });
    }
};

// 1. Imports dynamiques pour détecter les modules cassés
test('useRouter', async () => {
    const { useRouter } = await import('vue-router');
    useRouter();
});

test('useTrainingStore', async () => {
    const { useTrainingStore } = await import('../../stores/training');
    useTrainingStore();
});

test('useAuthStore', async () => {
    const { useAuthStore } = await import('../../stores/auth');
    useAuthStore();
});

test('supabase', async () => {
    const { supabase } = await import('../../supabase');
    if (!supabase) throw new Error('supabase is null');
});

test('useI18n', async () => {
    const { useI18n } = await import('vue-i18n');
    useI18n();
});

test('useConfirm', async () => {
    const { useConfirm } = await import('primevue/useconfirm');
    useConfirm();
});

test('useFormValidation', async () => {
    const { useFormValidation } = await import('../../composables/useFormValidation');
    useFormValidation();
});

test('InputText', async () => { await import('primevue/inputtext'); });
test('Textarea', async () => { await import('primevue/textarea'); });
test('InputNumber', async () => { await import('primevue/inputnumber'); });
test('Button', async () => { await import('primevue/button'); });
test('Calendar', async () => { await import('primevue/calendar'); });
test('Message', async () => { await import('primevue/message'); });
test('Dropdown', async () => { await import('primevue/dropdown'); });
test('ProgressBar', async () => { await import('primevue/progressbar'); });
</script>

<template>
    <div class="p-8">
        <h1 class="text-2xl font-bold mb-4">Diagnostic TrainingCreate</h1>
        <p class="mb-2 text-gray-500">ID: {{ id }}</p>

        <div v-if="results.length === 0" class="text-gray-400">Chargement des tests...</div>

        <div v-for="r in results" :key="r.name" class="flex items-center gap-3 py-1">
            <span v-if="r.ok" class="text-green-600 font-bold">✅</span>
            <span v-else class="text-red-600 font-bold">❌</span>
            <span class="font-mono text-sm">{{ r.name }}</span>
            <span v-if="!r.ok" class="text-red-500 text-xs">{{ r.error }}</span>
        </div>
    </div>
</template>
