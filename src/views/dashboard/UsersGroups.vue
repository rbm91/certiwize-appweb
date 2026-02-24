<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { useOrganizationStore } from '../../stores/organization';
import { ORG_ROLE_OPTIONS, USER_ROLES_CDC } from '../../config/constants';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import { useConfirm } from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';

const authStore = useAuthStore();
const orgStore = useOrganizationStore();
const confirm = useConfirm();

const showInviteDialog = ref(false);
const inviteForm = ref({ email: '', role: 'member' });
const message = ref(null);
const inviteLoading = ref(false);

// Rôles disponibles pour l'invitation (pas owner — un seul owner par org)
const inviteRoleOptions = ORG_ROLE_OPTIONS.filter(r => r.value !== 'owner');

// Limite de membres par organisation
const MAX_MEMBERS_PER_ORG = 5;

// Permissions
const canManageMembers = computed(() => authStore.isOrgAdmin);
const canChangeRoles = computed(() => authStore.isOrgOwner);

// Vérifier si la limite de membres est atteinte
const memberCount = computed(() => orgStore.members?.length || 0);
const memberLimitReached = computed(() => memberCount.value >= MAX_MEMBERS_PER_ORG);

onMounted(async () => {
  await Promise.all([
    orgStore.fetchMembers(),
    orgStore.fetchPendingInvitations(),
  ]);
});

// ── Rôles helpers ──
const getRoleSeverity = (role) => {
  const found = ORG_ROLE_OPTIONS.find(r => r.value === role);
  return found?.severity || 'info';
};

const getRoleLabel = (role) => {
  const found = ORG_ROLE_OPTIONS.find(r => r.value === role);
  return found?.label || role;
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ── Invitation ──
const openInviteDialog = () => {
  inviteForm.value = { email: '', role: 'member' };
  showInviteDialog.value = true;
};

const handleInvite = async () => {
  if (!inviteForm.value.email) return;

  // Vérifier la limite de membres avant d'inviter
  if (memberLimitReached.value) {
    message.value = {
      severity: 'warn',
      text: `Votre organisation a atteint la limite de ${MAX_MEMBERS_PER_ORG} membres. Retirez un membre existant pour pouvoir en inviter un nouveau.`,
    };
    showInviteDialog.value = false;
    return;
  }

  inviteLoading.value = true;
  const result = await orgStore.inviteMember(inviteForm.value.email, inviteForm.value.role);
  inviteLoading.value = false;

  if (result.success) {
    message.value = {
      severity: 'success',
      text: `Invitation envoyée à ${inviteForm.value.email}. Le lien d'invitation est valable 7 jours.`,
    };
    showInviteDialog.value = false;
    // Rafraîchir la liste des invitations en attente pour afficher immédiatement
    await orgStore.fetchPendingInvitations();
  } else {
    message.value = {
      severity: 'error',
      text: result.error || 'Erreur lors de l\'envoi de l\'invitation.',
    };
  }
};

// ── Gestion des membres ──
const handleChangeRole = async (member, newRole) => {
  const result = await orgStore.updateMemberRole(member.id, newRole);
  if (result.success) {
    message.value = { severity: 'success', text: 'Rôle mis à jour.' };
  } else {
    message.value = { severity: 'error', text: result.error };
  }
};

const handleRemoveMember = (member) => {
  // Protection : ne pas retirer le owner
  if (member.role === 'owner') return;
  // Protection : ne pas se retirer soi-même
  if (member.user_id === authStore.user?.id) return;

  confirm.require({
    message: `Voulez-vous vraiment retirer ${member.profiles?.email || 'cet utilisateur'} de l'organisation ?`,
    header: 'Confirmer le retrait',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Retirer',
    rejectLabel: 'Annuler',
    accept: async () => {
      const result = await orgStore.removeMember(member.id);
      if (result.success) {
        message.value = { severity: 'success', text: 'Membre retiré.' };
      } else {
        message.value = { severity: 'error', text: result.error };
      }
    },
  });
};

const handleCancelInvitation = async (invitation) => {
  const result = await orgStore.cancelInvitation(invitation.id);
  if (result.success) {
    message.value = { severity: 'success', text: 'Invitation annulée.' };
  } else {
    message.value = { severity: 'error', text: result.error };
  }
};

// Générer le lien d'invitation pour copier
const getInviteLink = (invitation) => {
  return `${window.location.origin}/join/${invitation.token}`;
};

const copyInviteLink = async (invitation) => {
  try {
    await navigator.clipboard.writeText(getInviteLink(invitation));
    message.value = { severity: 'success', text: 'Lien copié dans le presse-papier.' };
  } catch {
    message.value = { severity: 'warn', text: 'Impossible de copier le lien.' };
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto pb-10">
    <ConfirmDialog />

    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Membres de l'organisation</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ authStore.currentOrganization?.name }}
        </p>
      </div>
      <div v-if="canManageMembers" class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ memberCount }}/{{ MAX_MEMBERS_PER_ORG }} membres
        </span>
        <Button
          label="Inviter un membre"
          icon="pi pi-user-plus"
          @click="openInviteDialog"
          :disabled="memberLimitReached"
          v-tooltip="memberLimitReached ? 'Limite de ' + MAX_MEMBERS_PER_ORG + ' membres atteinte' : ''"
        />
      </div>
    </div>

    <Message v-if="message" :severity="message.severity" class="mb-4" :closable="true" @close="message = null">
      {{ message.text }}
    </Message>

    <!-- Tableau des membres -->
    <div class="card bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-users mr-2"></i>Membres actifs
      </h2>
      <DataTable
        :value="orgStore.members"
        :loading="orgStore.loading"
        stripedRows
        paginator
        :rows="20"
        rowHover
        dataKey="id"
      >
        <template #empty>
          <div class="text-center py-8 text-gray-500">
            <i class="pi pi-users text-4xl mb-3 block"></i>
            <p>Aucun membre trouvé</p>
          </div>
        </template>

        <Column field="profiles.email" header="Email" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-gray-400"></i>
              <span class="font-medium">{{ data.profiles?.email }}</span>
              <Tag v-if="data.user_id === authStore.user?.id" value="Vous" severity="secondary" class="text-xs" />
            </div>
          </template>
        </Column>

        <Column field="role" header="Rôle dans l'organisation" sortable>
          <template #body="{ data }">
            <Dropdown
              v-if="canChangeRoles && data.role !== 'owner' && data.user_id !== authStore.user?.id"
              :modelValue="data.role"
              :options="ORG_ROLE_OPTIONS.filter(r => r.value !== 'owner')"
              optionLabel="label"
              optionValue="value"
              @update:modelValue="(val) => handleChangeRole(data, val)"
              class="w-40"
            />
            <Tag v-else :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
          </template>
        </Column>

        <Column field="joined_at" header="Membre depuis" sortable>
          <template #body="{ data }">
            <span class="text-gray-500">{{ formatDate(data.joined_at) }}</span>
          </template>
        </Column>

        <Column header="Actions" style="width: 100px">
          <template #body="{ data }">
            <Button
              v-if="canManageMembers && data.role !== 'owner' && data.user_id !== authStore.user?.id"
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              size="small"
              v-tooltip="'Retirer de l\'organisation'"
              @click="handleRemoveMember(data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Invitations en attente -->
    <div v-if="canManageMembers && orgStore.pendingInvitations.length > 0" class="card bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        <i class="pi pi-envelope mr-2"></i>Invitations en attente
      </h2>
      <DataTable :value="orgStore.pendingInvitations" stripedRows dataKey="id">
        <Column field="email" header="Email">
          <template #body="{ data }">
            <span class="font-medium">{{ data.email }}</span>
          </template>
        </Column>

        <Column field="role" header="Rôle">
          <template #body="{ data }">
            <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
          </template>
        </Column>

        <Column field="expires_at" header="Expire le">
          <template #body="{ data }">
            <span class="text-gray-500">{{ formatDate(data.expires_at) }}</span>
          </template>
        </Column>

        <Column header="Actions" style="width: 150px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                icon="pi pi-copy"
                text
                rounded
                size="small"
                v-tooltip="'Copier le lien'"
                @click="copyInviteLink(data)"
              />
              <Button
                icon="pi pi-times"
                text
                rounded
                severity="danger"
                size="small"
                v-tooltip="'Annuler l\'invitation'"
                @click="handleCancelInvitation(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Info rôles -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex items-center gap-2 mb-2">
        <i class="pi pi-info-circle text-blue-500"></i>
        <span class="font-semibold text-blue-700 dark:text-blue-300">Rôles dans l'organisation</span>
      </div>
      <ul class="text-sm text-blue-600 dark:text-blue-400 space-y-1 ml-6 list-disc">
        <li><strong>Propriétaire</strong> : accès complet, gestion des admins et des membres, paramètres organisation</li>
        <li><strong>Administrateur</strong> : gestion des membres, invitations, configuration</li>
        <li><strong>Membre</strong> : accès aux données de l'organisation (lecture et écriture)</li>
      </ul>
    </div>

    <!-- Dialog d'invitation -->
    <Dialog v-model:visible="showInviteDialog" header="Inviter un membre" :modal="true" :style="{ width: '450px' }">
      <div class="flex flex-col gap-4 p-2">
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Email</label>
          <InputText v-model="inviteForm.email" type="email" placeholder="utilisateur@organisme.fr" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-semibold">Rôle</label>
          <Dropdown v-model="inviteForm.role" :options="inviteRoleOptions" optionLabel="label" optionValue="value" />
        </div>
        <Message severity="info" :closable="false" class="text-sm">
          Un lien d'invitation sera généré. Partagez-le avec la personne pour qu'elle rejoigne votre organisation.
          Le lien est valable 7 jours.
        </Message>
      </div>
      <template #footer>
        <Button label="Annuler" text @click="showInviteDialog = false" />
        <Button
          label="Envoyer l'invitation"
          icon="pi pi-send"
          :loading="inviteLoading"
          @click="handleInvite"
          :disabled="!inviteForm.email"
        />
      </template>
    </Dialog>
  </div>
</template>
