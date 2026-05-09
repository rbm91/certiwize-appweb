<script setup>
import { onMounted } from 'vue'

const problems = [
  {
    icon: 'pi-file',
    title: 'Des habitudes non documentées',
    desc: 'Vos process existent dans la tête de vos collaborateurs, pas sur papier.',
  },
  {
    icon: 'pi-folder-open',
    title: 'Des fichiers éparpillés',
    desc: "Excel, Drive, emails... l'information est partout, donc nulle part.",
  },
  {
    icon: 'pi-user-minus',
    title: 'Des personnes clés irremplaçables',
    desc: 'Si quelqu\'un part, tout le savoir-faire disparaît avec lui.',
  },
]

const journey = [
  {
    week: 'Semaine 1',
    title: 'Diagnostic',
    desc: 'Analyse de votre organisation actuelle, identification des points critiques et des zones de fragilité.',
    icon: 'pi-search',
  },
  {
    week: 'Semaine 2',
    title: 'Structuration',
    desc: 'Mise en place des process clairs et des modèles adaptés à votre activité.',
    icon: 'pi-cog',
  },
  {
    week: 'Semaine 3',
    title: 'Déploiement',
    desc: 'Informations organisées, suivi opérationnel en place, équipe embarquée.',
    icon: 'pi-send',
  },
  {
    week: 'Semaine 4',
    title: 'Autonomie',
    desc: 'Équipe autonome, système rodé, amélioration continue enclenchée.',
    icon: 'pi-verified',
  },
]

const values = [
  { icon: 'pi-list', title: 'Organisation logique' },
  { icon: 'pi-refresh', title: 'Process reproductibles' },
  { icon: 'pi-users', title: 'Autonomie équipe' },
  { icon: 'pi-arrow-up-right', title: 'Capacité à se développer' },
]

const bonuses = [
  { icon: 'pi-list', title: 'Plan de structuration simple' },
  { icon: 'pi-file', title: 'Modèles de process prêts' },
  { icon: 'pi-chart-bar', title: 'Score de maturité' },
  { icon: 'pi-map', title: "Roadmap d'amélioration" },
]

const pricingFeatures = [
  'Diagnostic complet de votre organisation',
  'Modèles de process personnalisés',
  'Accompagnement semaine par semaine',
  'Score de maturité organisationnelle',
  "Roadmap d'amélioration continue",
  'Support dédié pendant 6 mois',
]

const milestones = [0, 33, 66, 100]

onMounted(() => {
  document.title = 'Certigestion — Structurez votre organisme en 30 jours'
})
</script>

<template>
  <div>
    <!-- 1. HERO -->
    <section class="relative bg-navy bg-diagonal-pattern overflow-hidden">
      <div class="absolute top-20 -left-32 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div class="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-gold/5 blur-3xl pointer-events-none" />

      <div class="relative mx-auto max-w-4xl px-6 py-28 text-center md:py-36">
        <span class="inline-block rounded-full bg-gold/15 px-5 py-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-8">
          Structuration
        </span>

        <h1 class="font-serif text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
          Structurez votre organisme
          <br />
          <span class="italic text-gold">en 30 jours</span>
        </h1>

        <p class="mx-auto mt-6 max-w-2xl text-lg text-white/70 leading-relaxed">
          Passez d'un fonctionnement artisanal à un système clair et piloté
        </p>

        <div class="mt-10">
          <a href="#journey" class="btn-gold">
            Voir comment structurer mon organisme
            <i class="pi pi-arrow-right" style="font-size: 14px"></i>
          </a>
        </div>

        <!-- Progress bar -->
        <div class="mx-auto mt-16 max-w-lg">
          <div class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
            <span>Jour 1</span>
            <span>Jour 30</span>
          </div>
          <div class="relative h-1.5 rounded-full bg-white/10">
            <div class="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-gold/40 via-gold to-gold-light" />
            <div
              v-for="pos in milestones"
              :key="pos"
              class="absolute top-1/2 h-4 w-4 rounded-full border-2 border-gold bg-navy"
              :style="{ left: `${pos}%`, transform: 'translate(-50%, -50%)' }"
            />
          </div>
          <div class="mt-3 flex justify-between text-[11px] text-white/40 font-medium">
            <span>Diagnostic</span>
            <span>Structuration</span>
            <span>Déploiement</span>
            <span>Autonomie</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. PROBLEM SECTION -->
    <section class="bg-surface px-6 py-24">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl font-bold text-navy sm:text-4xl">
          Votre situation actuelle
        </h2>

        <div class="mt-14 grid gap-8 sm:grid-cols-3">
          <div
            v-for="p in problems"
            :key="p.title"
            class="group relative rounded-2xl border border-dashed border-navy/15 bg-white p-8 text-center transition-all hover:border-gold/40 hover:shadow-lg"
          >
            <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-red-50 text-red-400 transition-colors group-hover:bg-red-100">
              <i :class="['pi', p.icon]" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-navy">{{ p.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ p.desc }}</p>
          </div>
        </div>

        <p class="mt-12 text-center text-lg font-bold text-navy">
          Sans structure claire,
          <span class="text-gold underline decoration-gold/40 underline-offset-4">
            vous êtes fragile.
          </span>
        </p>
      </div>
    </section>

    <!-- 3. THE JOURNEY -->
    <section id="journey" class="bg-white px-6 py-24">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl font-bold text-navy sm:text-4xl">
          Votre parcours en 30 jours
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-center text-muted">
          Quatre semaines pour passer du flou à la maîtrise, étape par étape.
        </p>

        <div class="relative mt-20">
          <div class="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-gold to-gold-light md:left-1/2 md:-translate-x-px" />

          <div v-for="(step, i) in journey" :key="step.week" class="relative mb-16 last:mb-0">
            <div class="absolute left-6 -translate-x-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gold text-white font-bold text-lg shadow-lg shadow-gold/20 md:left-1/2">
              {{ i + 1 }}
            </div>

            <div
              :class="[
                'ml-16 md:ml-0 md:w-[calc(50%-40px)]',
                i % 2 === 0 ? 'md:mr-auto md:pr-4' : 'md:ml-auto md:pl-4',
              ]"
            >
              <div class="rounded-2xl border border-surface-dark bg-surface/50 p-6 shadow-sm transition-all hover:shadow-md hover:border-gold/30">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <i :class="['pi', step.icon]" style="font-size: 20px"></i>
                  </div>
                  <span class="text-xs font-bold uppercase tracking-widest text-gold">
                    {{ step.week }}
                  </span>
                </div>
                <h3 class="font-serif text-xl font-bold text-navy">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-relaxed text-muted">{{ step.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. VALUE SECTION -->
    <section class="bg-navy bg-grid-pattern px-6 py-24">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl font-bold text-gold sm:text-4xl">
          Les résultats
        </h2>

        <div class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="v in values"
            :key="v.title"
            class="rounded-xl border-l-4 border-gold bg-navy-lighter p-6 transition-transform hover:-translate-y-1"
          >
            <i :class="['pi', v.icon, 'mb-4', 'text-gold', 'block']" style="font-size: 28px"></i>
            <h3 class="font-serif text-lg font-bold text-white">{{ v.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. BONUS SECTION -->
    <section class="bg-surface px-6 py-24">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl font-bold text-navy sm:text-4xl">
          Vos outils inclus
        </h2>

        <div class="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="b in bonuses"
            :key="b.title"
            class="group rounded-2xl bg-white p-6 text-center shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 text-gold transition-colors group-hover:bg-gold/20">
              <i :class="['pi', b.icon]" style="font-size: 24px"></i>
            </div>
            <h3 class="font-serif text-base font-bold text-navy">{{ b.title }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. SOCIAL PROOF -->
    <section class="bg-white px-6 py-24">
      <div class="mx-auto max-w-3xl">
        <div class="relative rounded-2xl border border-surface-dark p-10 text-center md:p-14">
          <i class="pi pi-comment mx-auto mb-6 text-gold block" style="font-size: 40px"></i>
          <blockquote class="font-serif text-2xl italic leading-relaxed text-navy sm:text-3xl">
            Méthode issue du terrain, construite par un auditeur.
          </blockquote>
          <p class="mt-6 text-sm font-bold uppercase tracking-widest text-gold">
            Certigestion
          </p>
        </div>
      </div>
    </section>

    <!-- 7. GUARANTEE -->
    <section class="bg-gold px-6 py-16">
      <div class="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center md:flex-row md:text-left">
        <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy/10">
          <i class="pi pi-shield text-navy" style="font-size: 32px"></i>
        </div>
        <p class="text-lg font-bold leading-snug text-navy md:text-xl">
          Résultat visible en 30 jours ou accompagnement renforcé
        </p>
      </div>
    </section>

    <!-- 8. PRICING -->
    <section class="bg-white px-6 py-24">
      <div class="mx-auto max-w-lg">
        <div class="overflow-hidden rounded-3xl border border-navy/10 shadow-xl">
          <div class="bg-navy px-8 py-10 text-center">
            <h2 class="font-serif text-2xl font-bold text-white">
              Structuration en 30 jours
            </h2>
            <div class="mt-4 flex items-baseline justify-center gap-1">
              <span class="font-serif text-5xl font-black text-gold">119€</span>
              <span class="text-lg text-white/60">/mois</span>
            </div>
            <p class="mt-2 text-sm text-white/50">Engagement 6 mois</p>
          </div>

          <div class="px-8 py-8">
            <ul class="space-y-4">
              <li v-for="f in pricingFeatures" :key="f" class="flex items-start gap-3">
                <i class="pi pi-check mt-0.5 shrink-0 text-gold" style="font-size: 20px"></i>
                <span class="text-sm text-text">{{ f }}</span>
              </li>
            </ul>

            <a href="#demo" class="btn-gold mt-8 w-full justify-center">
              Structurer mon organisme
              <i class="pi pi-chevron-right" style="font-size: 14px"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 9. FINAL CTA -->
    <section class="bg-navy bg-hex-pattern px-6 py-24">
      <div class="mx-auto max-w-3xl text-center">
        <h2 class="font-serif text-3xl font-bold text-white sm:text-4xl">
          Prêt à transformer votre organisation ?
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-white/60">
          Rejoignez les organismes qui ont structuré leur fonctionnement en 30 jours.
        </p>
        <div class="mt-10">
          <a href="#demo" class="btn-gold">
            Structurer mon organisme
            <i class="pi pi-arrow-right" style="font-size: 14px"></i>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
