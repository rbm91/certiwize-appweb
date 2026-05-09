<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Chart from 'primevue/chart';
import Button from 'primevue/button';
import InputNumber from 'primevue/inputnumber';
import DatePicker from 'primevue/datepicker';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import { useFunnelStore } from '../../stores/funnel';
import StatsCard from '../../components/admin-funnels/StatsCard.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const funnelStore = useFunnelStore();

const funnelId = computed(() => route.params.id || route.params.funnelId);

const funnel = computed(() => funnelStore.getFunnelById(funnelId.value));

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

const formatDate = (d) => {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
};

const dailyData = computed(() => {
  if (!funnelId.value) return [];
  return funnelStore.visitHistory
    .filter((v) => v.funnelId === funnelId.value)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
});

const rate = computed(() =>
  funnel.value && funnel.value.visits > 0
    ? ((funnel.value.conversions / funnel.value.visits) * 100).toFixed(1)
    : '0.0'
);

// Form state
const formDate = ref(new Date());
const formVisits = ref(null);
const formConversions = ref(null);

const handleAddVisit = (e) => {
  e.preventDefault();
  if (!funnel.value) return;
  const visits = Number(formVisits.value);
  const conversions = Number(formConversions.value);
  if (!formDate.value || Number.isNaN(visits) || Number.isNaN(conversions)) return;

  const dateStr =
    formDate.value instanceof Date
      ? formDate.value.toISOString().slice(0, 10)
      : String(formDate.value);

  funnelStore.addVisitEvent({
    funnelId: funnel.value.id,
    date: dateStr,
    visits,
    conversions,
  });

  toast?.add?.({
    severity: 'success',
    summary: 'Visites ajoutées',
    detail: `+${visits} visites, +${conversions} conversions`,
    life: 2500,
  });

  formVisits.value = null;
  formConversions.value = null;
};

// Chart
const chartData = computed(() => ({
  labels: dailyData.value.map((d) => formatDate(d.date)),
  datasets: [
    {
      label: 'Visites',
      data: dailyData.value.map((d) => d.visits),
      borderColor: '#045089',
      backgroundColor: '#045089',
      tension: 0.3,
      fill: false,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Conversions',
      data: dailyData.value.map((d) => d.conversions),
      borderColor: '#6d6afc',
      backgroundColor: '#6d6afc',
      tension: 0.3,
      fill: false,
      pointRadius: 0,
      borderWidth: 2,
    },
  ],
}));

const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } },
    tooltip: { mode: 'index', intersect: false },
  },
  scales: {
    x: { ticks: { font: { size: 11 } }, grid: { color: '#f0f0f0' } },
    y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#f0f0f0' } },
  },
});

const goBack = () => router.push('/dashboard/admin/funnels/list');
</script>

<template>
  <div v-if="!funnel" class="py-12 text-center">
    <p class="text-gray-500">Tunnel introuvable.</p>
    <router-link
      to="/dashboard/admin/funnels/list"
      class="mt-2 inline-block text-sm text-[#045089] hover:underline"
    >
      Retour aux tunnels
    </router-link>
  </div>

  <div v-else class="space-y-6">
    <button
      type="button"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      @click="goBack"
    >
      <i class="pi pi-arrow-left" style="font-size: 0.9rem"></i> Retour aux tunnels
    </button>

    <!-- Header -->
    <div class="flex flex-wrap items-center gap-3">
      <h2 class="text-2xl font-bold text-gray-900">{{ funnel.name }}</h2>
      <Tag
        :value="STATUS_LABELS[funnel.status]"
        :severity="statusSeverity(funnel.status)"
        rounded
      />
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        icon="pi-eye"
        label="Visites"
        :value="funnel.visits.toLocaleString('fr-FR')"
        color="#045089"
      />
      <StatsCard
        icon="pi-check-circle"
        label="Conversions"
        :value="funnel.conversions.toLocaleString('fr-FR')"
        color="#6d6afc"
      />
      <StatsCard
        icon="pi-arrow-up-right"
        label="Taux de conversion"
        :value="`${rate}%`"
        color="#f96d64"
      />
      <StatsCard
        icon="pi-euro"
        label="Revenu"
        :value="`${funnel.revenue.toLocaleString('fr-FR')} €`"
        color="#045089"
      />
    </div>

    <!-- Daily line chart -->
    <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-700">
        Visites &amp; conversions quotidiennes
      </h3>
      <div class="h-72">
        <Chart type="line" :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Manual add visits form -->
    <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <i class="pi pi-plus" style="font-size: 1rem"></i> Ajouter des visites
      </h3>
      <form class="flex flex-wrap items-end gap-3" @submit="handleAddVisit">
        <div>
          <label for="visit-date" class="mb-1 block text-xs font-medium text-gray-500">
            Date
          </label>
          <DatePicker
            id="visit-date"
            v-model="formDate"
            date-format="dd/mm/yy"
            show-icon
          />
        </div>
        <div>
          <label for="visit-count" class="mb-1 block text-xs font-medium text-gray-500">
            Visites
          </label>
          <InputNumber
            id="visit-count"
            v-model="formVisits"
            :min="0"
            placeholder="0"
            input-class="w-24"
          />
        </div>
        <div>
          <label for="conv-count" class="mb-1 block text-xs font-medium text-gray-500">
            Conversions
          </label>
          <InputNumber
            id="conv-count"
            v-model="formConversions"
            :min="0"
            placeholder="0"
            input-class="w-24"
          />
        </div>
        <Button type="submit" label="Ajouter" severity="info" />
      </form>
    </div>
  </div>
</template>
