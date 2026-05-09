<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useFunnelStore } from '../../stores/funnel';

const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const funnelStore = useFunnelStore();

const funnels = computed(() => funnelStore.funnels);

const STATUS_LABELS = {
  active: 'Actif',
  draft: 'Brouillon',
  paused: 'En pause',
};

const statusSeverity = (s) => {
  if (s === 'active') return 'success';
  if (s === 'draft') return 'warn';
  return 'secondary';
};

const computeRate = (f) =>
  f.visits > 0 ? ((f.conversions / f.visits) * 100).toFixed(1) : '0.0';

const toggleStatus = (f) => {
  funnelStore.updateFunnel(f.id, {
    status: f.status === 'active' ? 'paused' : 'active',
  });
  toast?.add?.({
    severity: 'info',
    summary: 'Statut modifié',
    detail: `Le tunnel "${f.name}" a été ${f.status === 'active' ? 'mis en pause' : 'activé'}.`,
    life: 2500,
  });
};

const goEdit = (f) => {
  router.push(`/dashboard/admin/funnels/${f.id}/edit`);
};

const goStats = (f) => {
  router.push(`/dashboard/admin/funnels/${f.id}/stats`);
};

const handleDelete = (f) => {
  confirm.require({
    message: `Supprimer le tunnel "${f.name}" ? Cette action est irréversible.`,
    header: 'Confirmer la suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => {
      funnelStore.deleteFunnel(f.id);
      toast?.add?.({
        severity: 'success',
        summary: 'Tunnel supprimé',
        detail: `"${f.name}" a été supprimé.`,
        life: 2500,
      });
    },
  });
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">Tunnels de vente</h2>
      <router-link to="/dashboard/admin/funnels/new">
        <Button icon="pi pi-plus" label="Ajouter un tunnel" severity="primary" />
      </router-link>
    </div>

    <!-- Desktop: PrimeVue DataTable -->
    <div class="hidden md:block">
      <DataTable
        :value="funnels"
        data-key="id"
        striped-rows
        class="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
      >
        <Column field="name" header="Nom">
          <template #body="{ data }">
            <button
              type="button"
              class="font-medium text-gray-900 hover:text-[#045089] text-left"
              @click="goStats(data)"
            >
              {{ data.name }}
            </button>
            <p class="text-xs text-gray-400">/{{ data.slug }}</p>
          </template>
        </Column>

        <Column field="status" header="Statut">
          <template #body="{ data }">
            <Tag
              :value="STATUS_LABELS[data.status]"
              :severity="statusSeverity(data.status)"
              rounded
            />
          </template>
        </Column>

        <Column field="visits" header="Visites" header-class="text-right" body-class="text-right tabular-nums text-gray-700">
          <template #body="{ data }">
            {{ data.visits.toLocaleString('fr-FR') }}
          </template>
        </Column>

        <Column field="conversions" header="Conversions" header-class="text-right" body-class="text-right tabular-nums text-gray-700">
          <template #body="{ data }">
            {{ data.conversions.toLocaleString('fr-FR') }}
          </template>
        </Column>

        <Column header="Taux" header-class="text-right" body-class="text-right tabular-nums text-gray-700">
          <template #body="{ data }">{{ computeRate(data) }}%</template>
        </Column>

        <Column field="revenue" header="Revenu" header-class="text-right" body-class="text-right tabular-nums font-medium text-gray-900">
          <template #body="{ data }">
            {{ data.revenue.toLocaleString('fr-FR') }} €
          </template>
        </Column>

        <Column header="Actions" header-class="text-right" body-class="text-right">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-1">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                v-tooltip.top="'Modifier'"
                @click="goEdit(data)"
              />
              <a
                :href="`/${data.slug}`"
                target="_blank"
                rel="noopener noreferrer"
                class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 inline-flex"
                title="Voir le tunnel"
              >
                <i class="pi pi-eye"></i>
              </a>
              <Button
                :icon="data.status === 'active' ? 'pi pi-pause' : 'pi pi-play'"
                text
                rounded
                severity="secondary"
                v-tooltip.top="data.status === 'active' ? 'Mettre en pause' : 'Activer'"
                @click="toggleStatus(data)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                v-tooltip.top="'Supprimer'"
                @click="handleDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Mobile cards -->
    <div class="space-y-3 md:hidden">
      <div
        v-for="f in funnels"
        :key="f.id"
        class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div>
            <button
              type="button"
              class="font-medium text-gray-900 hover:text-[#045089] text-left"
              @click="goStats(f)"
            >
              {{ f.name }}
            </button>
            <p class="text-xs text-gray-400">/{{ f.slug }}</p>
          </div>
          <Tag
            :value="STATUS_LABELS[f.status]"
            :severity="statusSeverity(f.status)"
            rounded
          />
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Visites : <span class="font-semibold">{{ f.visits.toLocaleString('fr-FR') }}</span></div>
          <div>Conv. : <span class="font-semibold">{{ f.conversions.toLocaleString('fr-FR') }}</span></div>
          <div>Taux : <span class="font-semibold">{{ computeRate(f) }}%</span></div>
          <div>Revenu : <span class="font-semibold">{{ f.revenue.toLocaleString('fr-FR') }} €</span></div>
        </div>
        <div class="mt-3 flex gap-1 border-t border-gray-100 pt-3">
          <Button icon="pi pi-pencil" text rounded severity="secondary" @click="goEdit(f)" />
          <Button
            :icon="f.status === 'active' ? 'pi pi-pause' : 'pi pi-play'"
            text
            rounded
            severity="secondary"
            @click="toggleStatus(f)"
          />
          <Button icon="pi pi-trash" text rounded severity="danger" @click="handleDelete(f)" />
        </div>
      </div>
    </div>
  </div>
</template>
