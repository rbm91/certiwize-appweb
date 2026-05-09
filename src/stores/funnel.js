import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const SEED_FUNNELS = [
  { id: 'f1', name: 'Marre des outils partout', slug: 'tunnel-1-outils', status: 'active', visits: 1247, conversions: 89, revenue: 10591, createdAt: '2026-02-10' },
  { id: 'f2', name: "Prêt pour l'audit", slug: 'tunnel-2-audit', status: 'active', visits: 892, conversions: 67, revenue: 7973, createdAt: '2026-02-15' },
  { id: 'f3', name: 'Structuration en 30 jours', slug: 'tunnel-3-structure', status: 'active', visits: 634, conversions: 41, revenue: 4879, createdAt: '2026-02-20' },
  { id: 'f4', name: 'Options Premium', slug: 'tunnel-4-options', status: 'draft', visits: 156, conversions: 12, revenue: 18000, createdAt: '2026-03-01' },
  { id: 'f5', name: 'Tarifs & Pricing', slug: 'tunnel-5-tarifs', status: 'active', visits: 523, conversions: 38, revenue: 4522, createdAt: '2026-03-10' },
];

function generateVisitHistory() {
  const events = [];
  const today = new Date('2026-03-20');
  const base = {
    f1: { v: 42, c: 3 },
    f2: { v: 30, c: 2 },
    f3: { v: 21, c: 1 },
    f4: { v: 5, c: 0 },
    f5: { v: 17, c: 1 },
  };

  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);
    for (const fid of ['f1', 'f2', 'f3', 'f4', 'f5']) {
      const b = base[fid];
      const visits = Math.max(1, Math.round(b.v * (0.7 + rand() * 0.6)));
      const conversions = Math.min(visits, Math.max(0, Math.round(b.c * (0.5 + rand() * 1.0))));
      events.push({ id: `ve-${fid}-${dateStr}`, funnelId: fid, date: dateStr, visits, conversions });
    }
  }
  return events;
}

export const useFunnelStore = defineStore('funnel', () => {
  const funnels = ref([...SEED_FUNNELS]);
  const visitHistory = ref(generateVisitHistory());

  const stats = computed(() => {
    const totalVisits = funnels.value.reduce((s, f) => s + f.visits, 0);
    const totalConversions = funnels.value.reduce((s, f) => s + f.conversions, 0);
    const totalRevenue = funnels.value.reduce((s, f) => s + f.revenue, 0);
    const conversionRate = totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;
    return { totalVisits, totalConversions, totalRevenue, conversionRate };
  });

  function addFunnel(data) {
    funnels.value.push({
      ...data,
      id: `f${Date.now()}`,
      visits: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  }

  function updateFunnel(id, data) {
    const idx = funnels.value.findIndex((f) => f.id === id);
    if (idx !== -1) funnels.value[idx] = { ...funnels.value[idx], ...data };
  }

  function deleteFunnel(id) {
    funnels.value = funnels.value.filter((f) => f.id !== id);
    visitHistory.value = visitHistory.value.filter((v) => v.funnelId !== id);
  }

  function addVisitEvent(event) {
    const newEvent = { ...event, id: `ve-${Date.now()}` };
    visitHistory.value.push(newEvent);
    const idx = funnels.value.findIndex((f) => f.id === event.funnelId);
    if (idx !== -1) {
      funnels.value[idx] = {
        ...funnels.value[idx],
        visits: funnels.value[idx].visits + event.visits,
        conversions: funnels.value[idx].conversions + event.conversions,
      };
    }
  }

  function getFunnelById(id) {
    return funnels.value.find((f) => f.id === id);
  }

  function getHistoryFor(funnelId) {
    return visitHistory.value.filter((v) => v.funnelId === funnelId);
  }

  return {
    funnels,
    visitHistory,
    stats,
    addFunnel,
    updateFunnel,
    deleteFunnel,
    addVisitEvent,
    getFunnelById,
    getHistoryFor,
  };
}, {
  persist: {
    key: 'certiwize-funnels',
    pick: ['funnels', 'visitHistory'],
  },
});
