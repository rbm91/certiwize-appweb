<script setup>
import { computed, ref } from 'vue';
import Chart from 'primevue/chart';
import { useFunnelStore } from '../../stores/funnel';
import StatsCard from '../../components/admin-funnels/StatsCard.vue';

const funnelStore = useFunnelStore();
const funnels = computed(() => funnelStore.funnels);
const visitHistory = computed(() => funnelStore.visitHistory);
const stats = computed(() => funnelStore.stats);

const formatDate = (d) => {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
};

// Aggregate visits per day (all funnels)
const dailyData = computed(() => {
  const map = new Map();
  for (const ev of visitHistory.value) {
    const existing = map.get(ev.date);
    if (existing) {
      existing.visits += ev.visits;
      existing.conversions += ev.conversions;
    } else {
      map.set(ev.date, { date: ev.date, visits: ev.visits, conversions: ev.conversions });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
});

// Revenue per funnel
const revenueData = computed(() =>
  funnels.value.map((f) => ({
    name: f.name.length > 20 ? f.name.slice(0, 18) + '...' : f.name,
    revenue: f.revenue,
  }))
);

// Recent activity
const recentActivity = computed(() =>
  [...visitHistory.value]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 8)
    .map((ev) => ({
      ...ev,
      funnelName: funnels.value.find((f) => f.id === ev.funnelId)?.name ?? 'Inconnu',
    }))
);

// Line chart (visites & conversions sur 30 jours)
const lineChartData = computed(() => ({
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

const lineChartOptions = ref({
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

// Bar chart (revenu par tunnel)
const barChartData = computed(() => ({
  labels: revenueData.value.map((d) => d.name),
  datasets: [
    {
      label: 'Revenu',
      data: revenueData.value.map((d) => d.revenue),
      backgroundColor: '#6d6afc',
      borderRadius: 6,
    },
  ],
}));

const barChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `Revenu : ${Number(ctx.parsed.y).toLocaleString('fr-FR')} €`,
      },
    },
  },
  scales: {
    x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    y: { beginAtZero: true, ticks: { font: { size: 11 } }, grid: { color: '#f0f0f0' } },
  },
});
</script>

<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900">Tableau de bord</h2>

    <!-- Stats cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        icon="pi-eye"
        label="Total visites"
        :value="stats.totalVisits.toLocaleString('fr-FR')"
        :change="4.2"
        color="#045089"
      />
      <StatsCard
        icon="pi-check-circle"
        label="Conversions"
        :value="stats.totalConversions.toLocaleString('fr-FR')"
        :change="2.8"
        color="#6d6afc"
      />
      <StatsCard
        icon="pi-arrow-up-right"
        label="Taux de conversion"
        :value="`${stats.conversionRate.toFixed(1)}%`"
        :change="-0.3"
        color="#f96d64"
      />
      <StatsCard
        icon="pi-euro"
        label="Revenu total"
        :value="`${stats.totalRevenue.toLocaleString('fr-FR')} €`"
        :change="6.1"
        color="#045089"
      />
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-700">Visites &amp; conversions (30 jours)</h3>
        <div class="h-72">
          <Chart type="line" :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>

      <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-700">Revenu par tunnel</h3>
        <div class="h-72">
          <Chart type="bar" :data="barChartData" :options="barChartOptions" />
        </div>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 class="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <i class="pi pi-chart-line" style="font-size: 1rem"></i> Activité récente
      </h3>
      <div class="divide-y divide-gray-100">
        <div
          v-for="a in recentActivity"
          :key="a.id"
          class="flex items-center justify-between py-2.5 text-sm"
        >
          <div>
            <span class="font-medium text-gray-800">{{ a.funnelName }}</span>
            <span class="ml-2 text-gray-500">{{ formatDate(a.date) }}</span>
          </div>
          <div class="flex gap-4 text-xs">
            <span style="color: #045089">{{ a.visits }} visites</span>
            <span style="color: #6d6afc">{{ a.conversions }} conv.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
