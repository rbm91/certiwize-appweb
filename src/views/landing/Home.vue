<script setup>
import { onMounted } from 'vue';
import RevealSection from '../../components/marketing/RevealSection.vue';

onMounted(() => {
  document.title = 'Certigestion — Sécurisez votre certification Qualiopi en continu';
});

const GREEN = 'oklch(0.55 0.14 145)';

const tensionItems = [
  { icon: 'pi pi-search', title: 'Preuve introuvable', desc: '= non-conformité' },
  { icon: 'pi pi-cog', title: 'Process flou', desc: '= perte de crédibilité' },
  { icon: 'pi pi-building', title: 'Organisation fragile', desc: '= stress le jour J' },
];

const projectionItems = [
  'Vous cherchez vos preuves au dernier moment',
  "Vous découvrez vos écarts le jour de l'audit",
  "Vous corrigez dans l'urgence",
  'Vous prenez un risque réel',
];

const solutionItems = [
  { icon: 'pi pi-search', title: 'Preuves accessibles', desc: 'Centralisées, organisées, retrouvables en un clic.' },
  { icon: 'pi pi-cog', title: 'Process clairs', desc: 'Traces reproductibles, conformité documentée.' },
  { icon: 'pi pi-shield', title: 'Organisation fiable', desc: 'Autonome, structurée, prête à tout moment.' },
];

const transformations = [
  'Centralisation de toutes vos preuves',
  'Structuration de vos process',
  'Fiabilité de votre organisation',
];

const businessImpact = [
  'Gain de temps considérable',
  'Réduction des erreurs humaines',
  'Image renforcée auprès des financeurs',
];

const beforeItems = [
  'Dispersion des preuves',
  'Stress à chaque audit',
  'Dépendance aux personnes clés',
];

const afterItems = [
  'Système structuré et centralisé',
  'Conformité pilotée en continu',
  'Automatisation des tâches clés',
];
</script>

<template>
  <div>
    <!-- ─── HERO ─── -->
    <section
      class="relative min-h-screen flex items-center overflow-hidden"
      style="background: oklch(0.08 0.01 145);"
    >
      <div class="marketing-container relative z-10 py-32">
        <div class="max-w-3xl">
          <RevealSection>
            <span
              class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6 text-white"
              :style="{ background: GREEN }"
            >
              Certigestion
            </span>
          </RevealSection>

          <RevealSection :delay="100">
            <h1
              class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
              style="font-family: var(--font-serif);"
            >
              Dormez sur vos deux oreilles.<br />
              <span :style="{ color: GREEN }">Votre certification est sécurisée.</span>
            </h1>
          </RevealSection>

          <RevealSection :delay="200">
            <p class="text-gray-300 text-lg md:text-xl leading-relaxed mb-4 max-w-xl">
              Sans stress. Sans nuits blanches. Sans dépendre de vos équipes.
            </p>
          </RevealSection>

          <RevealSection :delay="300">
            <router-link to="/landing/diagnostic" class="editorial-btn-primary">
              Tester mon niveau Qualiopi <i class="pi pi-arrow-right text-sm" />
            </router-link>
          </RevealSection>
        </div>
      </div>

      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span class="text-gray-500 text-xs uppercase tracking-widest">Découvrir</span>
        <div class="w-px h-8 bg-gray-600 animate-pulse" />
      </div>
    </section>

    <!-- ─── SOUS-TITRE ─── -->
    <section class="py-16" :style="{ background: GREEN }">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2 class="text-2xl md:text-3xl font-bold text-white" style="font-family: var(--font-serif);">
              Un audit ne se prépare pas la veille.<br />
              Il se vit tous les jours.
            </h2>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── TENSION ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="mb-12">
              <span class="section-label block mb-3">La réalité</span>
              <div class="accent-bar" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-2" style="font-family: var(--font-serif);">
                Votre risque n'est pas votre niveau.<br />
                C'est ce que vous êtes capable de prouver immédiatement.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <RevealSection v-for="(item, i) in tensionItems" :key="item.title" :delay="i * 100">
              <div class="p-6 bg-gray-50" style="border-left: 3px solid #fca5a5;">
                <i :class="item.icon + ' text-red-400 mb-3'" style="font-size: 1.5rem;" />
                <h3 class="font-bold text-gray-900 mb-1">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PROJECTION ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <h2 class="text-3xl md:text-4xl font-bold text-white mb-8 text-center" style="font-family: var(--font-serif);">
              Vous pensez être prêt...
            </h2>
          </RevealSection>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <RevealSection v-for="(item, i) in projectionItems" :key="i" :delay="i * 80">
              <div class="flex items-start gap-3 p-4 bg-white/5 border border-white/10">
                <i class="pi pi-exclamation-triangle text-amber-400 flex-shrink-0 mt-0.5 text-sm" />
                <span class="text-gray-300 text-sm">{{ item }}</span>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── SOLUTION ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-4xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">La solution</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mt-4" style="font-family: var(--font-serif);">
                Certigestion structure votre organisme en continu.
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RevealSection v-for="(item, i) in solutionItems" :key="item.title" :delay="i * 100">
              <div class="p-6 bg-gray-50" :style="{ borderLeft: `3px solid ${GREEN}` }">
                <i :class="item.icon + ' mb-3'" :style="{ color: GREEN, fontSize: '1.5rem' }" />
                <h3 class="font-bold text-gray-900 mb-2">{{ item.title }}</h3>
                <p class="text-gray-600 text-sm leading-relaxed">{{ item.desc }}</p>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── VALEUR ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Ce que vous gagnez</span>
              <div class="accent-bar mx-auto" />
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <RevealSection :delay="100">
              <div class="bg-white/5 border border-white/10 p-8">
                <h3 class="text-xl font-bold text-white mb-6" style="font-family: var(--font-serif);">
                  Transformation opérationnelle
                </h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in transformations" :key="i" class="flex items-start gap-3">
                    <i class="pi pi-check-circle flex-shrink-0 mt-0.5 text-sm" :style="{ color: GREEN }" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>

            <RevealSection :delay="200">
              <div class="bg-white/5 border border-white/10 p-8">
                <h3 class="text-xl font-bold text-white mb-6" style="font-family: var(--font-serif);">
                  Impact business
                </h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in businessImpact" :key="i" class="flex items-start gap-3">
                    <i class="pi pi-check-circle flex-shrink-0 mt-0.5 text-sm" :style="{ color: GREEN }" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>
          </div>

          <RevealSection :delay="300">
            <div class="text-center">
              <p class="text-2xl font-bold text-white" style="font-family: var(--font-serif);">
                Vous passez de <span class="text-red-400">subir</span> à <span :style="{ color: GREEN }">piloter</span>.
              </p>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── PREUVE SOCIALE ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <i class="pi pi-comment opacity-40 mx-auto mb-6 block" :style="{ color: GREEN, fontSize: '2.5rem' }" />
            <blockquote
              class="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed mb-6"
              style="font-family: var(--font-serif);"
            >
              «&nbsp;On pensait être conformes. On a découvert des écarts invisibles.
              On les a corrigés avant l'audit. Aujourd'hui, on dort tranquilles.&nbsp;»
            </blockquote>
            <p class="text-gray-500 text-sm">— Directeur général, agence de coaching</p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── CAS CONCRET ─── -->
    <section class="py-20 section-dark">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <RevealSection>
            <div class="text-center mb-12">
              <span class="section-label block mb-3" :style="{ color: GREEN }">Cas concret</span>
              <div class="accent-bar mx-auto" />
              <h2 class="text-3xl md:text-4xl font-bold text-white mt-4" style="font-family: var(--font-serif);">
                Avant / Après
              </h2>
            </div>
          </RevealSection>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <RevealSection :delay="100">
              <div class="p-8" style="background: oklch(0.12 0.02 145); border-left: 4px solid #fca5a5;">
                <h3 class="text-lg font-bold text-red-400 mb-6" style="font-family: var(--font-serif);">Avant</h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in beforeItems" :key="i" class="flex items-start gap-3">
                    <i class="pi pi-exclamation-triangle text-red-400 flex-shrink-0 mt-0.5 text-sm" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>

            <RevealSection :delay="200">
              <div class="p-8" :style="{ background: 'oklch(0.12 0.02 145)', borderLeft: `4px solid ${GREEN}` }">
                <h3 class="text-lg font-bold mb-6" :style="{ fontFamily: 'var(--font-serif)', color: GREEN }">Après</h3>
                <ul class="space-y-3">
                  <li v-for="(item, i) in afterItems" :key="i" class="flex items-start gap-3">
                    <i class="pi pi-check-circle flex-shrink-0 mt-0.5 text-sm" :style="{ color: GREEN }" />
                    <span class="text-gray-300 text-sm">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── PONT CERTIWIZE ─── -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto">
          <RevealSection>
            <div class="p-8" :style="{ background: 'oklch(0.97 0.02 145)', borderLeft: `4px solid ${GREEN}` }">
              <h3 class="text-xl font-bold text-gray-900 mb-4" style="font-family: var(--font-serif);">
                Quand la structuration dépasse le cadre de l'outil
              </h3>
              <p class="text-gray-600 leading-relaxed mb-4">
                Nous intervenons directement dans votre organisation pour transformer
                vos process, vos équipes et vos systèmes.
              </p>
              <router-link
                to="/landing/certiwize"
                class="inline-flex items-center gap-2 text-sm font-semibold"
                :style="{ color: GREEN }"
              >
                Découvrir Certiwize <i class="pi pi-arrow-right text-xs" />
              </router-link>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- ─── CTA FINAL ─── -->
    <section class="py-20" :style="{ background: GREEN }">
      <div class="marketing-container text-center">
        <RevealSection>
          <h2 class="text-3xl md:text-4xl font-bold text-white mb-8" style="font-family: var(--font-serif);">
            Prêt à sécuriser votre certification ?
          </h2>
          <router-link to="/landing/diagnostic" class="editorial-btn-primary">
            Tester mon niveau Qualiopi <i class="pi pi-chevron-right text-sm" />
          </router-link>
        </RevealSection>
      </div>
    </section>
  </div>
</template>
