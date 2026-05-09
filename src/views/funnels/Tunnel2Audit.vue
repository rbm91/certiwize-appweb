<script setup>
import { onMounted } from 'vue'

const G = {
  main: '#3A9D5C',
  dark: '#2D7A47',
  light: '#5BBF7A',
  bg: '#F0FAF4',
  bgDark: '#E2F5EA',
  subtle: 'rgba(58, 157, 92, 0.1)',
  subtle20: 'rgba(58, 157, 92, 0.2)',
}

const stats = [
  { value: '0', label: 'stress' },
  { value: '100%', label: 'couvert' },
  { value: '0', label: 'écart' },
  { value: '1', label: 'système' },
]

const problems = [
  {
    num: '01',
    icon: 'pi-clock',
    title: 'Préparation au dernier moment',
    desc: "Les organismes attendent la convocation pour commencer à rassembler leurs preuves. Le stress s'accumule, les oublis se multiplient.",
  },
  {
    num: '02',
    icon: 'pi-search',
    title: 'Preuves introuvables',
    desc: 'Fichiers éparpillés, dossiers incomplets, versions obsolètes. Le jour J, impossible de retrouver ce qui est demandé.',
  },
  {
    num: '03',
    icon: 'pi-exclamation-triangle',
    title: 'Écarts découverts trop tard',
    desc: "Les non-conformités apparaissent au moment de l'audit, quand il est déjà trop tard pour corriger.",
  },
]

const solutionTexts = [
  'Chaque élément est à sa place',
  'Chaque exigence est couverte',
  'Chaque document est accessible',
]

const checklist = [
  "Checklist audit prête à l'emploi",
  'Trame de réponse aux écarts',
  'Vidéos de préparation audit',
  'Structure complète des preuves',
]

const beforeItems = ['Stress', 'Doute', 'Préparation tardive']
const afterItems = ['Visibilité', 'Maîtrise', 'Sérénité']

const pricingFeatures = [
  'Dossier complet et organisé',
  'Réduction du risque de non-conformité',
  'Vision claire des attentes',
  'Préparation continue',
]

onMounted(() => {
  document.title = "Certigestion — Vous êtes déjà prêt pour l'audit"
})
</script>

<template>
  <div>
    <!-- 1. HERO — Split layout -->
    <section class="relative overflow-hidden">
      <div class="grid lg:grid-cols-2 min-h-[600px]">
        <div class="flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-20 bg-white">
          <span
            class="inline-flex items-center self-start gap-2 px-4 py-1.5 rounded-full border text-xs font-bold tracking-widest uppercase mb-8"
            :style="{ borderColor: G.main, backgroundColor: G.subtle, color: G.dark }"
          >
            <i class="pi pi-shield" :style="{ color: G.main, fontSize: '14px' }"></i>
            Conformité Audit
          </span>

          <h1 class="font-serif text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.1] text-navy mb-2">
            Vous ne vous préparez plus à l'audit.
          </h1>
          <p class="font-serif text-3xl sm:text-4xl lg:text-[2.6rem] italic leading-tight mb-6" :style="{ color: G.main }">
            Vous êtes déjà prêt.
          </p>
          <p class="text-lg text-text/70 max-w-lg leading-relaxed mb-10">
            Arrêtez de douter. Votre organisation est déjà structurée pour
            répondre aux exigences.
          </p>

          <a
            href="#pricing"
            class="self-start inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] uppercase tracking-wide text-white transition-all hover:-translate-y-0.5"
            :style="{ backgroundColor: G.main, boxShadow: `0 8px 24px ${G.subtle20}` }"
          >
            Tester votre niveau de préparation
            <i class="pi pi-arrow-right" style="font-size: 14px"></i>
          </a>
        </div>

        <div class="hidden lg:flex items-center justify-center relative" :style="{ backgroundColor: G.dark }">
          <div class="absolute inset-0 bg-dot-pattern opacity-40" />
          <i class="pi pi-shield relative z-10" :style="{ color: `${G.light}CC`, fontSize: '11rem' }"></i>
        </div>

        <div class="flex lg:hidden items-center justify-center py-16" :style="{ backgroundColor: G.dark }">
          <i class="pi pi-shield" :style="{ color: `${G.light}CC`, fontSize: '6rem' }"></i>
        </div>
      </div>
    </section>

    <!-- 2. STATS BAR -->
    <section :style="{ backgroundColor: G.dark }">
      <div class="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-10 text-center">
        <div v-for="s in stats" :key="s.label">
          <p class="font-serif text-3xl sm:text-4xl font-black" :style="{ color: G.light }">
            {{ s.value }}
          </p>
          <p class="text-white/60 text-sm uppercase tracking-wider mt-1">
            {{ s.label }}
          </p>
        </div>
      </div>
    </section>

    <!-- 3. PROBLEM -->
    <section class="bg-white py-20 sm:py-28 px-6">
      <div class="max-w-6xl mx-auto">
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-navy text-center mb-16">
          Ce que nous constatons
        </h2>

        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="item in problems"
            :key="item.num"
            class="relative rounded-2xl p-8 border hover:shadow-lg transition-shadow"
            :style="{ backgroundColor: G.bg, borderColor: G.bgDark }"
          >
            <span class="font-serif text-5xl font-black absolute top-4 right-6 select-none" style="color: rgba(220, 80, 80, 0.15)">
              {{ item.num }}
            </span>
            <i :class="['pi', item.icon, 'text-navy/60', 'mb-5', 'block']" style="font-size: 32px"></i>
            <h3 class="font-serif text-xl font-bold text-navy mb-3">
              {{ item.title }}
            </h3>
            <p class="text-text/60 leading-relaxed text-sm">
              {{ item.desc }}
            </p>
          </div>
        </div>

        <div class="mt-14 text-center">
          <blockquote class="inline-block border-l-4 px-8 py-5 rounded-r-xl" :style="{ backgroundColor: G.subtle, borderColor: G.main }">
            <p class="font-serif text-xl sm:text-2xl italic text-navy font-bold">
              « Un audit ne s'improvise pas. »
            </p>
          </blockquote>
        </div>
      </div>
    </section>

    <!-- 4. SOLUTION -->
    <section class="py-20 sm:py-28 px-6" :style="{ backgroundColor: G.bg }">
      <div class="max-w-5xl mx-auto text-center">
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-navy mb-16">
          Certigestion structure automatiquement votre dossier
        </h2>

        <div class="grid md:grid-cols-3 gap-10">
          <div v-for="text in solutionTexts" :key="text" class="flex flex-col items-center gap-4">
            <div class="w-16 h-16 rounded-full flex items-center justify-center" :style="{ backgroundColor: G.subtle }">
              <i class="pi pi-check-circle" :style="{ color: G.main, fontSize: '32px' }"></i>
            </div>
            <p class="font-serif text-lg font-bold text-navy leading-snug">
              {{ text }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. CHECKLIST -->
    <section class="bg-white py-20 sm:py-28 px-6">
      <div class="max-w-3xl mx-auto">
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-navy text-center mb-14">
          Votre checklist audit
        </h2>

        <div class="space-y-5">
          <div
            v-for="item in checklist"
            :key="item"
            class="flex items-center gap-4 rounded-xl px-6 py-5 border"
            :style="{ backgroundColor: G.bg, borderColor: G.bgDark }"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :style="{ backgroundColor: G.subtle }">
              <i class="pi pi-check" :style="{ color: G.main, fontSize: '14px' }"></i>
            </div>
            <span class="text-navy font-semibold text-base sm:text-lg">
              {{ item }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. TRANSFORMATION -->
    <section class="bg-navy bg-dot-pattern py-20 sm:py-28 px-6">
      <div class="max-w-5xl mx-auto">
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-white text-center mb-16">
          La transformation
        </h2>

        <div class="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          <div class="space-y-4 text-center md:text-right">
            <p class="text-sm uppercase tracking-widest text-white/40 font-bold mb-4">
              Avant
            </p>
            <p v-for="t in beforeItems" :key="t" class="font-serif text-xl text-white/30 font-bold">
              {{ t }}
            </p>
          </div>

          <div class="hidden md:flex items-center justify-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center" :style="{ backgroundColor: G.subtle20 }">
              <i class="pi pi-chevron-right" :style="{ color: G.light, fontSize: '32px' }"></i>
            </div>
          </div>
          <div class="flex md:hidden items-center justify-center py-2">
            <div class="w-12 h-12 rounded-full flex items-center justify-center rotate-90" :style="{ backgroundColor: G.subtle20 }">
              <i class="pi pi-chevron-right" :style="{ color: G.light, fontSize: '24px' }"></i>
            </div>
          </div>

          <div class="space-y-4 text-center md:text-left">
            <p class="text-sm uppercase tracking-widest font-bold mb-4" :style="{ color: G.light }">
              Après
            </p>
            <p v-for="t in afterItems" :key="t" class="font-serif text-xl font-bold" :style="{ color: G.light }">
              {{ t }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. GUARANTEE -->
    <section class="py-16 sm:py-20 px-6" :style="{ backgroundColor: G.main }">
      <div class="max-w-3xl mx-auto text-center">
        <i class="pi pi-shield text-white mx-auto mb-6 block" style="font-size: 64px"></i>
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-white mb-6">
          Notre garantie
        </h2>
        <p class="text-white/85 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
          Si une non-conformité liée à l'organisation apparaît&nbsp;:
          <span class="font-bold text-white">
            accompagnement correctif inclus.
          </span>
        </p>
      </div>
    </section>

    <!-- 8. PRICING -->
    <section id="pricing" class="bg-white py-20 sm:py-28 px-6">
      <div class="max-w-xl mx-auto">
        <div class="rounded-2xl overflow-hidden shadow-xl border border-surface-dark">
          <div class="h-2" :style="{ backgroundColor: G.main }" />

          <div class="bg-navy p-8 sm:p-12 text-center">
            <i class="pi pi-eye mx-auto mb-4 block" :style="{ color: G.light, fontSize: '40px' }"></i>
            <h2 class="font-serif text-3xl sm:text-4xl font-black text-white mb-2">
              119€
              <span class="text-lg font-sans text-white/50">/mois</span>
            </h2>
            <p class="text-white/50 text-sm mb-6">
              Engagement 6 mois ou 139&nbsp;€/mois sans engagement
            </p>

            <div class="space-y-3 text-left max-w-xs mx-auto mb-8">
              <div v-for="f in pricingFeatures" :key="f" class="flex items-start gap-3">
                <i class="pi pi-check-circle shrink-0 mt-0.5" :style="{ color: G.light, fontSize: '20px' }"></i>
                <span class="text-white/80 text-sm">{{ f }}</span>
              </div>
            </div>

            <div class="bg-navy-light/60 rounded-xl px-5 py-4 mb-8 border border-white/5">
              <div class="flex items-center gap-3 justify-center">
                <i class="pi pi-shield shrink-0" :style="{ color: G.light, fontSize: '20px' }"></i>
                <p class="text-white/60 text-xs leading-relaxed text-left">
                  Accompagnement correctif inclus en cas de non-conformité organisationnelle
                </p>
              </div>
            </div>

            <a
              href="#demo"
              class="w-full justify-center inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] uppercase tracking-wide text-white transition-all hover:-translate-y-0.5"
              :style="{ backgroundColor: G.main }"
            >
              Sécuriser mon audit
              <i class="pi pi-arrow-right" style="font-size: 14px"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. FINAL CTA -->
    <section class="bg-navy py-20 sm:py-28 px-6 text-center">
      <div class="max-w-2xl mx-auto">
        <i class="pi pi-clone mx-auto mb-6 block" :style="{ color: G.light, fontSize: '40px' }"></i>
        <h2 class="font-serif text-3xl sm:text-4xl font-black text-white mb-4">
          Arrêtez de douter.
        </h2>
        <p class="font-serif text-2xl sm:text-3xl italic mb-10" :style="{ color: G.light }">
          Soyez prêt.
        </p>
        <a
          href="#pricing"
          class="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] uppercase tracking-wide text-white transition-all hover:-translate-y-0.5"
          :style="{ backgroundColor: G.main }"
        >
          Sécuriser mon audit
          <i class="pi pi-arrow-right" style="font-size: 14px"></i>
        </a>
      </div>
    </section>
  </div>
</template>
