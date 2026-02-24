<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { supabase } from '../../supabase';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { useToast } from 'primevue/usetoast';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Redirect if not admin
if (!authStore.isAdmin) {
    router.push('/dashboard');
}

// State
const users = ref([]);
const loading = ref(true);
const searchQuery = ref('');

// Role change dialog state
const showRoleDialog = ref(false);
const selectedUser = ref(null);
const newRole = ref('');
const isUpdating = ref(false);

// Stats
const stats = ref({
    totalUsers: 0,
    admins: 0,
    regularUsers: 0,
    recentUsers: 0
});

// Fetch all users from profiles table
const fetchUsers = async () => {
    loading.value = true;
    try {
        await authStore.refreshSession();
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        users.value = data || [];

        // Calculate stats
        stats.value.totalUsers = users.value.length;
        stats.value.admins = users.value.filter(u => u.role === 'admin').length;
        stats.value.regularUsers = users.value.filter(u => u.role !== 'admin').length;

        // Users created in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        stats.value.recentUsers = users.value.filter(u => {
            const updatedAt = new Date(u.updated_at);
            return updatedAt >= thirtyDaysAgo;
        }).length;

    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        loading.value = false;
    }
};

// Filtered users based on search
const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    const query = searchQuery.value.toLowerCase();
    return users.value.filter(user =>
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
    );
});

// Role badge severity
const getRoleSeverity = (role) => {
    return role === 'admin' ? 'danger' : 'info';
};

// Format date
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Open role change dialog
const openRoleChangeDialog = (user) => {
    selectedUser.value = user;
    newRole.value = user.role === 'admin' ? 'user' : 'admin';
    showRoleDialog.value = true;
};

// Confirm role change
const confirmRoleChange = async () => {
    if (!selectedUser.value) return;

    isUpdating.value = true;
    try {
        await authStore.refreshSession();
        const { error } = await supabase
            .from('profiles')
            .update({
                role: newRole.value,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedUser.value.id);

        if (error) throw error;

        // Update local state
        const userIndex = users.value.findIndex(u => u.id === selectedUser.value.id);
        if (userIndex !== -1) {
            users.value[userIndex].role = newRole.value;
            users.value[userIndex].updated_at = new Date().toISOString();
        }

        // Recalculate stats
        stats.value.admins = users.value.filter(u => u.role === 'admin').length;
        stats.value.regularUsers = users.value.filter(u => u.role !== 'admin').length;

        toast.add({
            severity: 'success',
            summary: t('admin.role_change.success_title'),
            detail: t('admin.role_change.success_message', {
                name: selectedUser.value.full_name || selectedUser.value.email,
                role: newRole.value === 'admin' ? t('admin.role_admin') : t('admin.role_user')
            }),
            life: 3000
        });

        showRoleDialog.value = false;
        window.location.reload();
    } catch (error) {
        console.error('Error updating role:', error);
        toast.add({
            severity: 'error',
            summary: t('admin.role_change.error_title'),
            detail: t('admin.role_change.error_message'),
            life: 5000
        });
    } finally {
        isUpdating.value = false;
    }
};

// Cancel role change
const cancelRoleChange = () => {
    showRoleDialog.value = false;
    selectedUser.value = null;
    newRole.value = '';
};

// Check if user is the current logged-in user
const isCurrentUser = (userId) => {
    return authStore.user?.id === userId;
};

onMounted(() => {
    fetchUsers();
});
</script>

<template>
    <div class="space-y-8" v-if="authStore.isAdmin">
        <!-- Header -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('admin.title') }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400">{{ t('admin.subtitle') }}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-primary">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ t('admin.stats.total_users') }}</div>
                <div class="text-3xl font-bold" v-if="!loading">{{ stats.totalUsers }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ t('admin.stats.admins') }}</div>
                <div class="text-3xl font-bold" v-if="!loading">{{ stats.admins }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ t('admin.stats.regular_users') }}</div>
                <div class="text-3xl font-bold" v-if="!loading">{{ stats.regularUsers }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">{{ t('admin.stats.recent_users') }}</div>
                <div class="text-3xl font-bold" v-if="!loading">{{ stats.recentUsers }}</div>
                <div class="text-3xl font-bold animate-pulse" v-else>...</div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ t('admin.users_list') }}</h2>

                <div class="flex items-center gap-3">
                    <span class="p-input-icon-left">
                        <i class="pi pi-search" />
                        <InputText
                            v-model="searchQuery"
                            :placeholder="t('admin.search_placeholder')"
                            class="w-64"
                        />
                    </span>
                </div>
            </div>

            <DataTable
                :value="filteredUsers"
                :loading="loading"
                paginator
                :rows="10"
                tableStyle="min-width: 50rem"
                dataKey="id"
            >
                <template #empty>{{ t('admin.empty_list') }}</template>
                <template #loading>{{ t('admin.loading_data') }}</template>

                <Column field="full_name" :header="t('admin.columns.name')" sortable style="width: 20%">
                    <template #body="slotProps">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <i class="pi pi-user text-primary"></i>
                            </div>
                            <div>
                                <span class="font-medium">{{ slotProps.data.full_name || '-' }}</span>
                                <span v-if="isCurrentUser(slotProps.data.id)" class="ml-2 text-xs text-primary">({{ t('admin.you') }})</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="email" :header="t('admin.columns.email')" sortable style="width: 25%">
                    <template #body="slotProps">
                        <span class="text-gray-600 dark:text-gray-400">{{ slotProps.data.email || '-' }}</span>
                    </template>
                </Column>

                <Column field="role" :header="t('admin.columns.role')" sortable style="width: 15%">
                    <template #body="slotProps">
                        <Tag
                            :value="slotProps.data.role === 'admin' ? t('admin.role_admin') : t('admin.role_user')"
                            :severity="getRoleSeverity(slotProps.data.role)"
                        />
                    </template>
                </Column>

                <Column field="updated_at" :header="t('admin.columns.last_activity')" sortable style="width: 25%">
                    <template #body="slotProps">
                        <span class="text-sm text-gray-500">{{ formatDate(slotProps.data.updated_at) }}</span>
                    </template>
                </Column>

                <Column :header="t('admin.columns.actions')" style="width: 15%">
                    <template #body="slotProps">
                        <Button
                            v-if="!isCurrentUser(slotProps.data.id)"
                            :label="slotProps.data.role === 'admin' ? t('admin.demote') : t('admin.promote')"
                            :icon="slotProps.data.role === 'admin' ? 'pi pi-user' : 'pi pi-shield'"
                            :severity="slotProps.data.role === 'admin' ? 'secondary' : 'warning'"
                            size="small"
                            @click="openRoleChangeDialog(slotProps.data)"
                        />
                        <span v-else class="text-xs text-gray-400 italic">-</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Role Change Confirmation Dialog -->
        <Dialog
            v-model:visible="showRoleDialog"
            :header="t('admin.role_change.dialog_title')"
            :modal="true"
            :closable="!isUpdating"
            :style="{ width: '450px' }"
        >
            <div class="flex flex-col gap-4" v-if="selectedUser">
                <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <i class="pi pi-user text-primary text-xl"></i>
                    </div>
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">{{ selectedUser.full_name || '-' }}</p>
                        <p class="text-sm text-gray-500">{{ selectedUser.email }}</p>
                    </div>
                </div>

                <div class="flex items-center justify-center gap-4 py-4">
                    <div class="text-center">
                        <Tag
                            :value="selectedUser.role === 'admin' ? t('admin.role_admin') : t('admin.role_user')"
                            :severity="getRoleSeverity(selectedUser.role)"
                            class="text-lg px-4 py-2"
                        />
                        <p class="text-xs text-gray-500 mt-1">{{ t('admin.role_change.current') }}</p>
                    </div>
                    <i class="pi pi-arrow-right text-2xl text-gray-400"></i>
                    <div class="text-center">
                        <Tag
                            :value="newRole === 'admin' ? t('admin.role_admin') : t('admin.role_user')"
                            :severity="getRoleSeverity(newRole)"
                            class="text-lg px-4 py-2"
                        />
                        <p class="text-xs text-gray-500 mt-1">{{ t('admin.role_change.new') }}</p>
                    </div>
                </div>

                <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
                        <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            {{ newRole === 'admin' ? t('admin.role_change.warning_promote') : t('admin.role_change.warning_demote') }}
                        </p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button
                        :label="t('common.cancel')"
                        severity="secondary"
                        @click="cancelRoleChange"
                        :disabled="isUpdating"
                    />
                    <Button
                        :label="t('admin.role_change.confirm')"
                        :icon="isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                        :severity="newRole === 'admin' ? 'warning' : 'secondary'"
                        @click="confirmRoleChange"
                        :disabled="isUpdating"
                    />
                </div>
            </template>
        </Dialog>
    </div>

    <!-- Access Denied -->
    <div v-else class="flex items-center justify-center h-64">
        <div class="text-center">
            <i class="pi pi-lock text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">{{ t('admin.access_denied') }}</p>
        </div>
    </div>
</template>
