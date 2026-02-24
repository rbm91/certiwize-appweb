<script setup>
import { ref, onMounted, computed, watch } from 'vue';
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
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Dropdown from 'primevue/dropdown';
import DatePicker from 'primevue/datepicker';
import { useToast } from 'primevue/usetoast';
import { useAuditTrail } from '../../composables/useAuditTrail';

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const toast = useToast();

// Rediriger si pas super-admin
if (!authStore.isSuperAdmin) {
    router.push('/dashboard');
}

// ── Onglet actif ──
const activeTab = ref(0);

// ── Sentry ──
const sentryConfigured = computed(() => !!import.meta.env.VITE_SENTRY_DSN);

// ── State : Utilisateurs ──
const users = ref([]);
const loadingUsers = ref(true);
const searchQuery = ref('');

// ── State : Organisations ──
const organizations = ref([]);
const loadingOrgs = ref(true);
const searchOrgs = ref('');

// ── State : Demandes RGPD ──
const deletionRequests = ref([]);
const exportRequests = ref([]);
const loadingGdpr = ref(true);

// ── State : Dialogue changement de rôle ──
const showRoleDialog = ref(false);
const selectedUser = ref(null);
const newRole = ref('');
const isUpdating = ref(false);

// ── State : Dialogue membres d'une organisation ──
const showMembersDialog = ref(false);
const selectedOrg = ref(null);
const orgMembers = ref([]);
const loadingMembers = ref(false);

// ── Stats ──
const stats = ref({
    totalUsers: 0,
    totalOrgs: 0,
    superAdmins: 0,
    recentUsers: 0,
    pendingDeletions: 0
});

// ── Fetch utilisateurs ──
const fetchUsers = async () => {
    loadingUsers.value = true;
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        users.value = data || [];

        stats.value.totalUsers = users.value.length;
        stats.value.superAdmins = users.value.filter(u => u.role === 'super_admin').length;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        stats.value.recentUsers = users.value.filter(u => {
            const updatedAt = new Date(u.updated_at);
            return updatedAt >= thirtyDaysAgo;
        }).length;
    } catch (err) {
        console.error('[AdminDashboard] Erreur fetch users:', err);
    } finally {
        loadingUsers.value = false;
    }
};

// ── Fetch organisations ──
const fetchOrganizations = async () => {
    loadingOrgs.value = true;
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('*, organization_members(count)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        organizations.value = (data || []).map(org => ({
            ...org,
            member_count: org.organization_members?.[0]?.count || 0
        }));

        stats.value.totalOrgs = organizations.value.length;
    } catch (err) {
        console.error('[AdminDashboard] Erreur fetch orgs:', err);
    } finally {
        loadingOrgs.value = false;
    }
};

// ── Fetch demandes RGPD ──
const fetchGdprRequests = async () => {
    loadingGdpr.value = true;
    try {
        const [delRes, expRes] = await Promise.all([
            supabase
                .from('data_deletion_requests')
                .select('*, profiles:user_id(email, full_name)')
                .order('requested_at', { ascending: false }),
            supabase
                .from('data_export_requests')
                .select('*, profiles:user_id(email, full_name)')
                .order('requested_at', { ascending: false })
        ]);

        if (delRes.error) throw delRes.error;
        if (expRes.error) throw expRes.error;

        deletionRequests.value = delRes.data || [];
        exportRequests.value = expRes.data || [];

        stats.value.pendingDeletions = deletionRequests.value.filter(r => r.status === 'pending').length;
    } catch (err) {
        console.error('[AdminDashboard] Erreur fetch RGPD:', err);
    } finally {
        loadingGdpr.value = false;
    }
};

// ── Filtres ──
const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value;
    const q = searchQuery.value.toLowerCase();
    return users.value.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
});

const filteredOrgs = computed(() => {
    if (!searchOrgs.value) return organizations.value;
    const q = searchOrgs.value.toLowerCase();
    return organizations.value.filter(o =>
        o.name?.toLowerCase().includes(q) ||
        o.slug?.toLowerCase().includes(q)
    );
});

// ── Utilitaires ──
const getRoleSeverity = (role) => {
    if (role === 'super_admin') return 'danger';
    return 'info';
};

const getRoleLabel = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    return 'Utilisateur';
};

const getStatusSeverity = (status) => {
    const map = { pending: 'warning', processing: 'info', approved: 'info', completed: 'success', expired: 'secondary', rejected: 'danger' };
    return map[status] || 'secondary';
};

const getStatusLabel = (status) => {
    const map = { pending: 'En attente', processing: 'En cours', approved: 'Approuvé', completed: 'Terminé', expired: 'Expiré', rejected: 'Refusé' };
    return map[status] || status;
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const isCurrentUser = (userId) => authStore.user?.id === userId;

// ── Dialogue changement de rôle plateforme ──
const openRoleChangeDialog = (user) => {
    selectedUser.value = user;
    newRole.value = user.role === 'super_admin' ? 'user' : 'super_admin';
    showRoleDialog.value = true;
};

const confirmRoleChange = async () => {
    if (!selectedUser.value) return;
    isUpdating.value = true;
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole.value, updated_at: new Date().toISOString() })
            .eq('id', selectedUser.value.id);

        if (error) throw error;

        const idx = users.value.findIndex(u => u.id === selectedUser.value.id);
        if (idx !== -1) {
            users.value[idx].role = newRole.value;
            users.value[idx].updated_at = new Date().toISOString();
        }
        stats.value.superAdmins = users.value.filter(u => u.role === 'super_admin').length;

        toast.add({ severity: 'success', summary: 'Rôle modifié', detail: `${selectedUser.value.full_name || selectedUser.value.email} est maintenant ${getRoleLabel(newRole.value)}`, life: 3000 });
        showRoleDialog.value = false;
    } catch (err) {
        console.error('[AdminDashboard] Erreur changement rôle:', err);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de modifier le rôle', life: 5000 });
    } finally {
        isUpdating.value = false;
    }
};

const cancelRoleChange = () => {
    showRoleDialog.value = false;
    selectedUser.value = null;
};

// ── Voir les membres d'une organisation ──
const viewOrgMembers = async (org) => {
    selectedOrg.value = org;
    showMembersDialog.value = true;
    loadingMembers.value = true;
    orgMembers.value = [];

    try {
        // Récupérer les membres de cette organisation
        const { data: membersData, error: membersErr } = await supabase
            .from('organization_members')
            .select('id, user_id, role, joined_at')
            .eq('organization_id', org.id)
            .order('joined_at', { ascending: true });

        if (membersErr) throw membersErr;

        if (!membersData || membersData.length === 0) {
            orgMembers.value = [];
            return;
        }

        // Récupérer les profils correspondants
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData, error: profilesErr } = await supabase
            .from('profiles')
            .select('id, email, full_name, role')
            .in('id', userIds);

        if (profilesErr) throw profilesErr;

        // Fusionner
        orgMembers.value = membersData.map(m => ({
            ...m,
            profile: (profilesData || []).find(p => p.id === m.user_id) || null,
        }));
    } catch (err) {
        console.error('[AdminDashboard] Erreur fetch org members:', err);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les membres', life: 5000 });
    } finally {
        loadingMembers.value = false;
    }
};

const getOrgRoleLabel = (role) => {
    const map = { owner: 'Propriétaire', admin: 'Administrateur', member: 'Membre' };
    return map[role] || role;
};

const getOrgRoleSeverity = (role) => {
    const map = { owner: 'danger', admin: 'warning', member: 'info' };
    return map[role] || 'secondary';
};

// ── Actions organisations ──
const toggleOrgActive = async (org) => {
    try {
        const { error } = await supabase
            .from('organizations')
            .update({ is_active: !org.is_active })
            .eq('id', org.id);

        if (error) throw error;

        const idx = organizations.value.findIndex(o => o.id === org.id);
        if (idx !== -1) organizations.value[idx].is_active = !org.is_active;

        toast.add({ severity: 'success', summary: org.is_active ? 'Organisation désactivée' : 'Organisation activée', life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: err.message, life: 5000 });
    }
};

// ── Actions RGPD ──
const updateDeletionStatus = async (request, newStatus) => {
    try {
        const { error } = await supabase
            .from('data_deletion_requests')
            .update({
                status: newStatus,
                processed_at: new Date().toISOString(),
                processed_by: authStore.user.id
            })
            .eq('id', request.id);

        if (error) throw error;

        const idx = deletionRequests.value.findIndex(r => r.id === request.id);
        if (idx !== -1) {
            deletionRequests.value[idx].status = newStatus;
            deletionRequests.value[idx].processed_at = new Date().toISOString();
        }
        stats.value.pendingDeletions = deletionRequests.value.filter(r => r.status === 'pending').length;

        toast.add({ severity: 'success', summary: 'Statut mis à jour', detail: `Demande ${getStatusLabel(newStatus).toLowerCase()}`, life: 3000 });
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: err.message, life: 5000 });
    }
};

// ── State : Logs d'activité ──
const auditLogs = ref([]);
const authLogs = ref([]);
const loadingLogs = ref(false);
const totalAuditRecords = ref(0);
const logsPage = ref(0);
const logsRowsPerPage = ref(25);

// Filtres logs
const logFilterUser = ref(null);
const logFilterOrg = ref(null);
const logFilterType = ref(null);
const logDateRange = ref(null);

// Options pour les dropdowns filtres
const userOptions = computed(() =>
    users.value.map(u => ({ label: u.full_name || u.email, value: u.id }))
);
const orgOptions = computed(() =>
    organizations.value.map(o => ({ label: o.name, value: o.id }))
);
const eventTypeOptions = [
    { label: 'Création', value: 'creation' },
    { label: 'Modification', value: 'modification' },
    { label: 'Ajout rôle', value: 'ajout_role' },
    { label: 'Suppression rôle', value: 'suppression_role' },
    { label: 'Ajout document', value: 'ajout_document' },
    { label: 'Suppression document', value: 'suppression_document' },
    { label: 'Ajout contact', value: 'ajout_relation' },
    { label: 'Suppression contact', value: 'suppression_relation' },
    { label: 'Archivage', value: 'archivage' },
];

// Composable audit
const { fetchAdminAuditLogs, fetchAuthLogs } = useAuditTrail();

// ── Fetch logs d'activité ──
const fetchActivityLogs = async () => {
    loadingLogs.value = true;
    try {
        const filters = {};
        if (logFilterUser.value) filters.userId = logFilterUser.value;
        if (logFilterOrg.value) filters.organizationId = logFilterOrg.value;
        if (logFilterType.value) filters.typeEvenement = logFilterType.value;
        if (logDateRange.value?.[0]) {
            const start = new Date(logDateRange.value[0]);
            start.setHours(0, 0, 0, 0);
            filters.dateFrom = start.toISOString();
        }
        if (logDateRange.value?.[1]) {
            const end = new Date(logDateRange.value[1]);
            end.setHours(23, 59, 59, 999);
            filters.dateTo = end.toISOString();
        }

        const { data, totalRecords } = await fetchAdminAuditLogs({
            page: logsPage.value,
            rowsPerPage: logsRowsPerPage.value,
            filters,
        });

        auditLogs.value = data;
        totalAuditRecords.value = totalRecords;

        // Charger les auth logs (première page, sans filtres spécifiques)
        if (logsPage.value === 0 && !logFilterType.value && !logFilterOrg.value) {
            authLogs.value = await fetchAuthLogs({ limit: 20, offset: 0 });
        }
    } catch (err) {
        console.error('[AdminDashboard] Erreur fetch logs:', err);
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les logs', life: 5000 });
    } finally {
        loadingLogs.value = false;
    }
};

const onLogsPageChange = (event) => {
    logsPage.value = event.page;
    logsRowsPerPage.value = event.rows;
    fetchActivityLogs();
};

const onLogFiltersChange = () => {
    logsPage.value = 0;
    fetchActivityLogs();
};

const clearLogFilters = () => {
    logFilterUser.value = null;
    logFilterOrg.value = null;
    logFilterType.value = null;
    logDateRange.value = null;
    logsPage.value = 0;
    fetchActivityLogs();
};

// Détection d'activité suspecte
const isSuspiciousHour = (dateString) => {
    if (!dateString) return false;
    const hour = new Date(dateString).getHours();
    return hour >= 0 && hour < 6;
};

const getSuspiciousIndicators = (log) => {
    const indicators = [];
    if (isSuspiciousHour(log.created_at)) {
        indicators.push({ label: 'Heure inhabituelle (00h-06h)', severity: 'warn' });
    }
    if (['suppression_role', 'suppression_document', 'suppression_relation'].includes(log.type_evenement)) {
        indicators.push({ label: 'Action destructive', severity: 'danger' });
    }
    return indicators;
};

// Helpers affichage audit
const getAuditSeverity = (type) => {
    const map = {
        creation: 'success', modification: 'info',
        ajout_role: 'success', suppression_role: 'danger',
        ajout_document: 'info', suppression_document: 'danger',
        ajout_relation: 'info', suppression_relation: 'danger',
        archivage: 'warn',
    };
    return map[type] || 'secondary';
};

const getAuditLabel = (type) => {
    const map = {
        creation: 'Création', modification: 'Modification',
        ajout_role: 'Ajout rôle', suppression_role: 'Suppr. rôle',
        ajout_document: 'Ajout doc.', suppression_document: 'Suppr. doc.',
        ajout_relation: 'Ajout contact', suppression_relation: 'Suppr. contact',
        archivage: 'Archivage',
    };
    return map[type] || type;
};

const getAuthActionLabel = (action) => {
    const map = {
        'login': 'Connexion', 'logout': 'Déconnexion',
        'token_refreshed': 'Renouvellement', 'user_signedup': 'Inscription',
        'user_invited': 'Invitation', 'user_deleted': 'Suppression compte',
    };
    return map[action] || action || '-';
};

const getAuthActionSeverity = (action) => {
    const map = {
        'login': 'success', 'logout': 'info',
        'token_refreshed': 'secondary', 'user_signedup': 'success',
        'user_invited': 'info', 'user_deleted': 'danger',
    };
    return map[action] || 'secondary';
};

const truncateValue = (val) => {
    if (!val) return '';
    try {
        const parsed = JSON.parse(val);
        const str = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed);
        return str.length > 50 ? str.substring(0, 50) + '…' : str;
    } catch {
        return val.length > 50 ? val.substring(0, 50) + '…' : val;
    }
};

// Charger les logs quand l'onglet est activé (index 3)
watch(activeTab, (newTab) => {
    if (newTab === 3 && auditLogs.value.length === 0) {
        fetchActivityLogs();
    }
});

onMounted(() => {
    fetchUsers();
    fetchOrganizations();
    fetchGdprRequests();
});
</script>

<template>
    <div class="space-y-8" v-if="authStore.isSuperAdmin">
        <!-- En-tête -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('admin.title') }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400">{{ t('admin.subtitle') }}</p>
        </div>

        <!-- Cartes statistiques -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-primary">
                <div class="text-gray-500 mb-1 text-sm font-medium">Utilisateurs</div>
                <div class="text-3xl font-bold">{{ stats.totalUsers }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-blue-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">Organisations</div>
                <div class="text-3xl font-bold">{{ stats.totalOrgs }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-red-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">Super Admins</div>
                <div class="text-3xl font-bold">{{ stats.superAdmins }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">Nouveaux (30j)</div>
                <div class="text-3xl font-bold">{{ stats.recentUsers }}</div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-orange-500">
                <div class="text-gray-500 mb-1 text-sm font-medium">Suppressions en attente</div>
                <div class="text-3xl font-bold">{{ stats.pendingDeletions }}</div>
            </div>
        </div>

        <!-- Onglets -->
        <TabView v-model:activeIndex="activeTab">

            <!-- ═══════════ Onglet Organisations ═══════════ -->
            <TabPanel header="Organisations">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Organisations</h2>
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="searchOrgs" placeholder="Rechercher une organisation..." class="w-64" />
                        </span>
                    </div>

                    <DataTable :value="filteredOrgs" :loading="loadingOrgs" paginator :rows="10" dataKey="id">
                        <template #empty>Aucune organisation trouvée</template>

                        <Column field="name" header="Nom" sortable style="width: 25%">
                            <template #body="{ data }">
                                <div>
                                    <span class="font-medium">{{ data.name }}</span>
                                    <span class="block text-xs text-gray-400">{{ data.slug }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="member_count" header="Membres" sortable style="width: 15%">
                            <template #body="{ data }">
                                <div class="flex items-center gap-2">
                                    <i class="pi pi-users text-gray-400"></i>
                                    <span>{{ data.member_count }}</span>
                                </div>
                            </template>
                        </Column>

                        <Column field="is_active" header="Statut" sortable style="width: 15%">
                            <template #body="{ data }">
                                <Tag :value="data.is_active ? 'Active' : 'Désactivée'"
                                     :severity="data.is_active ? 'success' : 'danger'" />
                            </template>
                        </Column>

                        <Column field="created_at" header="Créée le" sortable style="width: 20%">
                            <template #body="{ data }">
                                <span class="text-sm text-gray-500">{{ formatDate(data.created_at) }}</span>
                            </template>
                        </Column>

                        <Column header="Actions" style="width: 30%">
                            <template #body="{ data }">
                                <div class="flex gap-2">
                                    <Button
                                        label="Membres"
                                        icon="pi pi-users"
                                        severity="info"
                                        size="small"
                                        outlined
                                        @click="viewOrgMembers(data)"
                                    />
                                    <Button
                                        :label="data.is_active ? 'Désactiver' : 'Activer'"
                                        :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'"
                                        :severity="data.is_active ? 'danger' : 'success'"
                                        size="small"
                                        outlined
                                        @click="toggleOrgActive(data)"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </TabPanel>

            <!-- ═══════════ Onglet Utilisateurs ═══════════ -->
            <TabPanel header="Utilisateurs">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ t('admin.users_list') }}</h2>
                        <span class="p-input-icon-left">
                            <i class="pi pi-search" />
                            <InputText v-model="searchQuery" :placeholder="t('admin.search_placeholder')" class="w-64" />
                        </span>
                    </div>

                    <DataTable :value="filteredUsers" :loading="loadingUsers" paginator :rows="10" dataKey="id">
                        <template #empty>{{ t('admin.empty_list') }}</template>

                        <Column field="full_name" :header="t('admin.columns.name')" sortable style="width: 20%">
                            <template #body="{ data }">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <i class="pi pi-user text-primary"></i>
                                    </div>
                                    <div>
                                        <span class="font-medium">{{ data.full_name || '-' }}</span>
                                        <span v-if="isCurrentUser(data.id)" class="ml-2 text-xs text-primary">({{ t('admin.you') }})</span>
                                    </div>
                                </div>
                            </template>
                        </Column>

                        <Column field="email" :header="t('admin.columns.email')" sortable style="width: 25%">
                            <template #body="{ data }">
                                <span class="text-gray-600 dark:text-gray-400">{{ data.email || '-' }}</span>
                            </template>
                        </Column>

                        <Column field="role" :header="t('admin.columns.role')" sortable style="width: 15%">
                            <template #body="{ data }">
                                <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
                            </template>
                        </Column>

                        <Column field="updated_at" :header="t('admin.columns.last_activity')" sortable style="width: 25%">
                            <template #body="{ data }">
                                <span class="text-sm text-gray-500">{{ formatDate(data.updated_at) }}</span>
                            </template>
                        </Column>

                        <Column :header="t('admin.columns.actions')" style="width: 15%">
                            <template #body="{ data }">
                                <Button
                                    v-if="!isCurrentUser(data.id)"
                                    :label="data.role === 'super_admin' ? 'Rétrograder' : 'Promouvoir'"
                                    :icon="data.role === 'super_admin' ? 'pi pi-user' : 'pi pi-shield'"
                                    :severity="data.role === 'super_admin' ? 'secondary' : 'warning'"
                                    size="small"
                                    outlined
                                    @click="openRoleChangeDialog(data)"
                                />
                                <span v-else class="text-xs text-gray-400 italic">-</span>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </TabPanel>

            <!-- ═══════════ Onglet RGPD ═══════════ -->
            <TabPanel header="RGPD">
                <div class="space-y-6">
                    <!-- Demandes de suppression -->
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-trash mr-2"></i>Demandes de suppression
                        </h2>

                        <DataTable :value="deletionRequests" :loading="loadingGdpr" paginator :rows="10" dataKey="id">
                            <template #empty>Aucune demande de suppression</template>

                            <Column header="Utilisateur" style="width: 25%">
                                <template #body="{ data }">
                                    <div>
                                        <span class="font-medium">{{ data.profiles?.full_name || '-' }}</span>
                                        <span class="block text-xs text-gray-400">{{ data.profiles?.email }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="reason" header="Raison" style="width: 25%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-600">{{ data.reason || '-' }}</span>
                                </template>
                            </Column>

                            <Column field="status" header="Statut" style="width: 15%">
                                <template #body="{ data }">
                                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>

                            <Column field="requested_at" header="Date" sortable style="width: 15%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-500">{{ formatDate(data.requested_at) }}</span>
                                </template>
                            </Column>

                            <Column header="Actions" style="width: 20%">
                                <template #body="{ data }">
                                    <div v-if="data.status === 'pending'" class="flex gap-2">
                                        <Button label="Approuver" icon="pi pi-check" severity="success" size="small" outlined @click="updateDeletionStatus(data, 'approved')" />
                                        <Button label="Refuser" icon="pi pi-times" severity="danger" size="small" outlined @click="updateDeletionStatus(data, 'rejected')" />
                                    </div>
                                    <span v-else-if="data.status === 'approved'">
                                        <Button label="Terminé" icon="pi pi-check-circle" severity="success" size="small" outlined @click="updateDeletionStatus(data, 'completed')" />
                                    </span>
                                    <span v-else class="text-xs text-gray-400 italic">Traité</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- Demandes d'export -->
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-download mr-2"></i>Demandes d'export
                        </h2>

                        <DataTable :value="exportRequests" :loading="loadingGdpr" paginator :rows="10" dataKey="id">
                            <template #empty>Aucune demande d'export</template>

                            <Column header="Utilisateur" style="width: 30%">
                                <template #body="{ data }">
                                    <div>
                                        <span class="font-medium">{{ data.profiles?.full_name || '-' }}</span>
                                        <span class="block text-xs text-gray-400">{{ data.profiles?.email }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column field="status" header="Statut" style="width: 20%">
                                <template #body="{ data }">
                                    <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>

                            <Column field="requested_at" header="Date" sortable style="width: 25%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-500">{{ formatDate(data.requested_at) }}</span>
                                </template>
                            </Column>

                            <Column field="completed_at" header="Traité le" style="width: 25%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-500">{{ data.completed_at ? formatDate(data.completed_at) : '-' }}</span>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </TabPanel>

            <!-- ═══════════ Onglet Logs d'activité ═══════════ -->
            <TabPanel header="Logs d'activité">
                <div class="space-y-4">
                    <!-- Barre de filtres -->
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                        <div class="flex flex-col lg:flex-row gap-3 items-end">
                            <div class="flex flex-col gap-1 w-full lg:w-52">
                                <label class="text-xs text-gray-500">Utilisateur</label>
                                <Dropdown
                                    v-model="logFilterUser"
                                    :options="userOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Tous"
                                    class="w-full"
                                    showClear
                                    filter
                                    @change="onLogFiltersChange"
                                />
                            </div>
                            <div class="flex flex-col gap-1 w-full lg:w-52">
                                <label class="text-xs text-gray-500">Organisation</label>
                                <Dropdown
                                    v-model="logFilterOrg"
                                    :options="orgOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Toutes"
                                    class="w-full"
                                    showClear
                                    filter
                                    @change="onLogFiltersChange"
                                />
                            </div>
                            <div class="flex flex-col gap-1 w-full lg:w-52">
                                <label class="text-xs text-gray-500">Type d'événement</label>
                                <Dropdown
                                    v-model="logFilterType"
                                    :options="eventTypeOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Tous"
                                    class="w-full"
                                    showClear
                                    @change="onLogFiltersChange"
                                />
                            </div>
                            <div class="flex flex-col gap-1 w-full lg:w-64">
                                <label class="text-xs text-gray-500">Période</label>
                                <DatePicker
                                    v-model="logDateRange"
                                    selectionMode="range"
                                    dateFormat="dd/mm/yy"
                                    placeholder="Toute la période"
                                    class="w-full"
                                    showIcon
                                    showButtonBar
                                    @date-select="onLogFiltersChange"
                                />
                            </div>
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-filter-slash"
                                    severity="secondary"
                                    outlined
                                    @click="clearLogFilters"
                                    v-tooltip="'Réinitialiser les filtres'"
                                />
                                <Button
                                    icon="pi pi-refresh"
                                    severity="secondary"
                                    outlined
                                    @click="fetchActivityLogs"
                                    :loading="loadingLogs"
                                    v-tooltip="'Rafraîchir'"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Tableau des logs applicatifs -->
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-list mr-2"></i>Journal d'activité
                            <span class="text-sm font-normal text-gray-400 ml-2">(6 derniers mois)</span>
                        </h2>

                        <DataTable
                            :value="auditLogs"
                            :loading="loadingLogs"
                            :lazy="true"
                            :paginator="true"
                            :rows="logsRowsPerPage"
                            :totalRecords="totalAuditRecords"
                            :rowsPerPageOptions="[10, 25, 50]"
                            @page="onLogsPageChange"
                            dataKey="id"
                        >
                            <template #empty>
                                <div class="text-center py-8 text-gray-500">
                                    <i class="pi pi-inbox text-3xl mb-2 block"></i>
                                    <p>Aucun log trouvé pour cette période.</p>
                                </div>
                            </template>

                            <Column field="created_at" header="Date" style="width: 14%">
                                <template #body="{ data }">
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm">{{ formatDate(data.created_at) }}</span>
                                        <i v-if="isSuspiciousHour(data.created_at)"
                                           class="pi pi-moon text-orange-500 text-xs"
                                           v-tooltip="'Activité entre 00h et 06h'" />
                                    </div>
                                </template>
                            </Column>

                            <Column field="type_evenement" header="Type" style="width: 12%">
                                <template #body="{ data }">
                                    <Tag
                                        :value="getAuditLabel(data.type_evenement)"
                                        :severity="getAuditSeverity(data.type_evenement)"
                                        class="text-xs"
                                    />
                                </template>
                            </Column>

                            <Column field="objet" header="Objet" style="width: 10%">
                                <template #body="{ data }">
                                    <span class="text-sm font-medium capitalize">{{ data.objet }}</span>
                                </template>
                            </Column>

                            <Column header="Utilisateur" style="width: 18%">
                                <template #body="{ data }">
                                    <div>
                                        <span class="text-sm">{{ data.profiles?.full_name || '-' }}</span>
                                        <span class="block text-xs text-gray-400">{{ data.profiles?.email }}</span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="Organisation" style="width: 14%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-600 dark:text-gray-400">
                                        {{ data.organizations?.name || '-' }}
                                    </span>
                                </template>
                            </Column>

                            <Column header="Détail" style="width: 24%">
                                <template #body="{ data }">
                                    <div class="text-xs text-gray-500 space-y-0.5">
                                        <div v-if="data.champ">
                                            <span class="font-medium">{{ data.champ }}</span>
                                        </div>
                                        <div v-if="data.ancienne_valeur" class="text-red-400">
                                            − {{ truncateValue(data.ancienne_valeur) }}
                                        </div>
                                        <div v-if="data.nouvelle_valeur" class="text-green-400">
                                            + {{ truncateValue(data.nouvelle_valeur) }}
                                        </div>
                                        <span v-if="!data.champ && !data.ancienne_valeur && !data.nouvelle_valeur" class="text-gray-400">-</span>
                                    </div>
                                </template>
                            </Column>

                            <Column header="" style="width: 8%">
                                <template #body="{ data }">
                                    <div class="flex gap-1">
                                        <Tag
                                            v-for="indicator in getSuspiciousIndicators(data)"
                                            :key="indicator.label"
                                            :severity="indicator.severity"
                                            value="!"
                                            v-tooltip="indicator.label"
                                            class="text-xs"
                                        />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- Section Connexions récentes (auth logs Supabase) -->
                    <div v-if="authLogs.length > 0" class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-sign-in mr-2"></i>Connexions récentes
                        </h2>

                        <DataTable :value="authLogs" :rows="10" paginator dataKey="id">
                            <template #empty>Aucun log d'authentification</template>

                            <Column field="created_at" header="Date" sortable style="width: 20%">
                                <template #body="{ data }">
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm">{{ formatDate(data.created_at) }}</span>
                                        <i v-if="isSuspiciousHour(data.created_at)"
                                           class="pi pi-moon text-orange-500 text-xs"
                                           v-tooltip="'Heure inhabituelle'" />
                                    </div>
                                </template>
                            </Column>

                            <Column header="Action" style="width: 20%">
                                <template #body="{ data }">
                                    <Tag
                                        :value="getAuthActionLabel(data.payload?.action)"
                                        :severity="getAuthActionSeverity(data.payload?.action)"
                                    />
                                </template>
                            </Column>

                            <Column header="Utilisateur" style="width: 30%">
                                <template #body="{ data }">
                                    <span class="text-sm">{{ data.payload?.actor_username || data.payload?.actor_email || '-' }}</span>
                                </template>
                            </Column>

                            <Column header="Adresse IP" style="width: 15%">
                                <template #body="{ data }">
                                    <span class="text-sm text-gray-500 font-mono">{{ data.ip_address || '-' }}</span>
                                </template>
                            </Column>

                            <Column header="" style="width: 15%">
                                <template #body="{ data }">
                                    <Tag
                                        v-if="isSuspiciousHour(data.created_at)"
                                        severity="warn"
                                        value="Heure inhabituelle"
                                        class="text-xs"
                                    />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
            </TabPanel>

            <!-- ═══════════ Onglet Monitoring (Sentry) ═══════════ -->
            <TabPanel header="Monitoring">
                <div class="space-y-6">
                    <!-- Statut Sentry -->
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-shield mr-2"></i>Monitoring des erreurs — Sentry
                        </h2>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Statut -->
                            <div class="p-5 rounded-xl border-l-4" :class="sentryConfigured ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-red-50 dark:bg-red-900/20 border-red-500'">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="pi text-xl" :class="sentryConfigured ? 'pi-check-circle text-green-600' : 'pi-times-circle text-red-600'"></i>
                                    <span class="font-semibold text-lg">{{ sentryConfigured ? 'Sentry actif' : 'Sentry non configuré' }}</span>
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">
                                    {{ sentryConfigured
                                        ? 'Les erreurs JavaScript en production sont capturées automatiquement.'
                                        : 'Ajoutez VITE_SENTRY_DSN dans les variables d\'environnement Vercel.' }}
                                </p>
                            </div>

                            <!-- Lien vers Sentry -->
                            <div class="p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="pi pi-external-link text-xl text-blue-600"></i>
                                    <span class="font-semibold text-lg">Dashboard Sentry</span>
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Consultez les erreurs, performances et sessions utilisateurs.
                                </p>
                                <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">
                                    <Button label="Ouvrir Sentry" icon="pi pi-external-link" severity="info" />
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Ce que Sentry capture -->
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">
                            <i class="pi pi-info-circle mr-2"></i>Ce que Sentry capture
                        </h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <i class="pi pi-bug text-red-500 text-xl mt-0.5"></i>
                                <div>
                                    <p class="font-medium">Erreurs JavaScript</p>
                                    <p class="text-sm text-gray-500">Exceptions non gérées, erreurs de rendu Vue, requêtes Supabase échouées</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <i class="pi pi-chart-line text-blue-500 text-xl mt-0.5"></i>
                                <div>
                                    <p class="font-medium">Performance</p>
                                    <p class="text-sm text-gray-500">Temps de chargement des pages, transactions lentes, requêtes réseau</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <i class="pi pi-users text-green-500 text-xl mt-0.5"></i>
                                <div>
                                    <p class="font-medium">Sessions</p>
                                    <p class="text-sm text-gray-500">Nombre d'utilisateurs affectés par les erreurs, taux de crash</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </TabPanel>
        </TabView>

        <!-- Dialogue changement de rôle -->
        <Dialog v-model:visible="showRoleDialog" header="Modifier le rôle plateforme" :modal="true" :closable="!isUpdating" :style="{ width: '450px' }">
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
                        <Tag :value="getRoleLabel(selectedUser.role)" :severity="getRoleSeverity(selectedUser.role)" class="text-lg px-4 py-2" />
                        <p class="text-xs text-gray-500 mt-1">Actuel</p>
                    </div>
                    <i class="pi pi-arrow-right text-2xl text-gray-400"></i>
                    <div class="text-center">
                        <Tag :value="getRoleLabel(newRole)" :severity="getRoleSeverity(newRole)" class="text-lg px-4 py-2" />
                        <p class="text-xs text-gray-500 mt-1">Nouveau</p>
                    </div>
                </div>

                <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div class="flex items-start gap-3">
                        <i class="pi pi-exclamation-triangle text-yellow-600 dark:text-yellow-400 mt-0.5"></i>
                        <p class="text-sm text-yellow-700 dark:text-yellow-300">
                            {{ newRole === 'super_admin'
                                ? 'Cet utilisateur aura accès à toutes les données de toutes les organisations.'
                                : 'Cet utilisateur perdra son accès super-admin et ne verra plus que les données de ses organisations.' }}
                        </p>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Annuler" severity="secondary" @click="cancelRoleChange" :disabled="isUpdating" />
                    <Button label="Confirmer" :icon="isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
                            :severity="newRole === 'super_admin' ? 'warning' : 'secondary'"
                            @click="confirmRoleChange" :disabled="isUpdating" />
                </div>
            </template>
        </Dialog>

        <!-- Dialogue membres d'une organisation -->
        <Dialog v-model:visible="showMembersDialog"
                :header="'Membres de ' + (selectedOrg?.name || '')"
                :modal="true"
                :style="{ width: '700px' }">
            <DataTable :value="orgMembers" :loading="loadingMembers" dataKey="id" stripedRows>
                <template #empty>
                    <div class="text-center py-6 text-gray-500">
                        <i class="pi pi-users text-3xl mb-2 block"></i>
                        <p>Aucun membre dans cette organisation</p>
                    </div>
                </template>

                <Column header="Utilisateur" style="width: 40%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <i class="pi pi-user text-primary text-sm"></i>
                            </div>
                            <div>
                                <span class="font-medium">{{ data.profile?.full_name || '-' }}</span>
                                <span class="block text-xs text-gray-400">{{ data.profile?.email }}</span>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column field="role" header="Rôle organisation" style="width: 25%">
                    <template #body="{ data }">
                        <Tag :value="getOrgRoleLabel(data.role)" :severity="getOrgRoleSeverity(data.role)" />
                    </template>
                </Column>

                <Column field="profile.role" header="Rôle plateforme" style="width: 20%">
                    <template #body="{ data }">
                        <Tag :value="getRoleLabel(data.profile?.role)" :severity="getRoleSeverity(data.profile?.role)" />
                    </template>
                </Column>

                <Column field="joined_at" header="Membre depuis" style="width: 15%">
                    <template #body="{ data }">
                        <span class="text-sm text-gray-500">{{ formatDate(data.joined_at) }}</span>
                    </template>
                </Column>
            </DataTable>

            <template #footer>
                <Button label="Fermer" severity="secondary" @click="showMembersDialog = false" />
            </template>
        </Dialog>
    </div>

    <!-- Accès refusé -->
    <div v-else class="flex items-center justify-center h-64">
        <div class="text-center">
            <i class="pi pi-lock text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">{{ t('admin.access_denied') }}</p>
        </div>
    </div>
</template>
