<script setup>
import { ref, onMounted, computed } from 'vue';
import { useDataStore } from '../../stores/data';
import { useTrainingStore } from '../../stores/training';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import Button from 'primevue/button';
import SlowLoadingDialog from '../../components/dashboard/SlowLoadingDialog.vue';

const authStore = useAuthStore();
const dataStore = useDataStore();
const trainingStore = useTrainingStore();
const { stats, loading } = storeToRefs(dataStore);
const { formations } = storeToRefs(trainingStore);

// Projets réels
const projects = ref([]);
const projectsLoading = ref(true);

// Stats calculées
const totalFormations = computed(() => formations.value.length);
const totalProjects = computed(() => projects.value.length);

// Charger les projets avec filtre par rôle
const fetchProjects = async () => {
    if (!authStore.user?.id) {
        projectsLoading.value = false;
        return;
    }

    projectsLoading.value = true;
    try {
        const checkAdmin = authStore.userRole === 'admin';

        let query = supabase
            .from('projects')
            .select('*')
            .order('updated_at', { ascending: false });

        if (!checkAdmin) {
            query = query.eq('user_id', authStore.user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        projects.value = data || [];
    } catch (e) {
        // Erreur silencieuse
    } finally {
        projectsLoading.value = false;
    }
};



const showSlowLoading = ref(false);

onMounted(() => {
    // Timer pour afficher la popup après 3s si toujours en chargement
    loading.value = true;
    showSlowLoading.value = false;
    
    const slowTimer = setTimeout(() => {
        if (loading.value || projectsLoading.value) { // Check both
            showSlowLoading.value = true;
        }
    }, 10000);

    // Note: The individual fetches will eventually set their loading states to false
    // We ideally should have a global loading state or wait for promises, but 
    // since fetches are async fired in onMounted, we just let the timer run.
    // A better approach is to wrap them:
    Promise.all([
        dataStore.tiers.length === 0 ? dataStore.fetchTiers() : Promise.resolve(),
        trainingStore.fetchFormations(),
        fetchProjects()
    ]).finally(() => {
        clearTimeout(slowTimer);
        showSlowLoading.value = false;
    });
});
</script>

<template>
    <div class="space-y-8">
        <SlowLoadingDialog :visible="showSlowLoading" />
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ $t('dashboard.hello') }}, {{ authStore.user?.user_metadata?.full_name || 'Utilisateur' }} 👋
            </h1>
            <p class="text-gray-500 dark:text-gray-400">{{ $t('dashboard.status_today') }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-primary">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ $t('dashboard.total_clients') }}</div>
                <div class="text-3xl font-bold" v-if="!loading">{{ stats.totalTiers }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ $t('dashboard.active_formations') }}</div>
                <div class="text-3xl font-bold" v-if="!trainingStore.loading">{{ totalFormations }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ $t('dashboard.active_projects') }}</div>
                <div class="text-3xl font-bold" v-if="!projectsLoading">{{ totalProjects }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <!-- Derniers Tiers -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">{{ $t('dashboard.recent_clients') }}</h3>
                <ul class="space-y-3" v-if="!loading">
                    <li v-for="tier in dataStore.tiers.slice(0, 3)" :key="tier.id" class="flex justify-between items-center text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ tier.name }}</span>
                        <span class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{{ tier.state }}</span>
                    </li>
                    <li v-if="dataStore.tiers.length === 0" class="text-gray-400 text-sm italic">{{ $t('dashboard.no_clients') }}</li>
                </ul>
                <div v-else class="text-sm text-gray-400">{{ $t('dashboard.loading') }}</div>
            </div>

            <!-- Dernières Formations -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">{{ $t('dashboard.recent_formations') }}</h3>
                <ul class="space-y-3" v-if="!trainingStore.loading">
                    <li v-for="formation in formations.slice(0, 3)" :key="formation.id" class="flex justify-between items-center text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ formation.title }}</span>
                        <span class="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {{ new Date(formation.updated_at).toLocaleDateString('fr-FR') }}
                        </span>
                    </li>
                    <li v-if="formations.length === 0" class="text-gray-400 text-sm italic">{{ $t('dashboard.no_formations') }}</li>
                </ul>
                <div v-else class="text-sm text-gray-400">{{ $t('dashboard.loading') }}</div>
            </div>

            <!-- Derniers Projets -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2">{{ $t('dashboard.recent_projects') }}</h3>
                <ul class="space-y-3" v-if="!projectsLoading">
                    <li v-for="project in projects.slice(0, 3)" :key="project.id" class="flex justify-between items-center text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-300">{{ project.name }}</span>
                        <span class="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">{{ project.status || $t('dashboard.status_draft') }}</span>
                    </li>
                    <li v-if="projects.length === 0" class="text-gray-400 text-sm italic">{{ $t('dashboard.no_projects') }}</li>
                </ul>
                <div v-else class="text-sm text-gray-400">{{ $t('dashboard.loading') }}</div>
            </div>
        </div>

        <div class="bg-blue-50 dark:bg-gray-800/50 p-6 rounded-xl border border-blue-100 dark:border-gray-700">
            <h3 class="font-bold mb-4">{{ $t('dashboard.quick_actions') }}</h3>
            <div class="flex flex-wrap gap-3">
                <router-link to="/dashboard/tiers/create">
                    <Button :label="$t('dashboard.btn_new_client')" icon="pi pi-user-plus" />
                </router-link>
                <router-link to="/dashboard/catalogue/create">
                    <Button :label="$t('dashboard.btn_new_formation')" icon="pi pi-book" />
                </router-link>
                <router-link to="/dashboard/projets/create">
                    <Button :label="$t('dashboard.btn_new_project')" icon="pi pi-plus" />
                </router-link>
                <router-link to="/dashboard/learners/create">
                    <Button :label="$t('dashboard.btn_new_learner')" icon="pi pi-graduation-cap" />
                </router-link>
            </div>
        </div>
    </div>
</template>