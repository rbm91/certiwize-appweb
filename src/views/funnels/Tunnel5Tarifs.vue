<script setup>
import { onMounted, ref } from 'vue'

const FAQ = [
  {
    q: 'Que se passe-t-il après les 30 jours de garantie ?',
    a: "Si vous n'êtes pas satisfait dans les 30 premiers jours, vous êtes intégralement remboursé, sans condition. Au-delà, votre abonnement continue normalement selon la formule choisie.",
  },
  {
    q: 'Combien de temps faut-il pour être opérationnel ?',
    a: "La plupart de nos clients sont opérationnels en moins d'une semaine grâce à l'onboarding guidé et aux modèles prêts à l'emploi.",
  },
  {
    q: "L'outil est-il adapté à mon référentiel de certification ?",
    a: 'Certigestion est conçu pour répondre aux exigences du référentiel Qualiopi. Les modèles et la structure sont alignés sur les 7 critères et 32 indicateurs.',
  },
  {
    q: 'Puis-je ajouter les options IA plus tard ?',
    a: 'Absolument. Les options IA peuvent être ajoutées ou retirées à tout moment depuis votre espace, sans engagement supplémentaire.',
  },
  {
    q: "L'audit blanc est-il disponible pour tous les clients ?",
    a: "L'audit blanc est disponible pour tous, abonnés ou non. Les abonnés Certigestion bénéficient d'un tarif préférentiel (1 200 € au lieu de 1 500 €/jour).",
  },
]

const FEATURES = [
  'Centralisation clients, formations, documents',
  'Dossier de preuves automatisé',
  "Modèles prêts à l'emploi",
  'Bibliothèque qualité',
  'Onboarding guidé',
  'Checklist audit incluse',
  'Support par email',
]

const COMPARE_ROWS = [
  { label: 'Centralisation clients & formations', cols: [true, true, true, true] },
  { label: 'Dossier de preuves automatisé', cols: [true, true, true, true] },
  { label: "Modèles prêts à l'emploi", cols: [true, true, true, true] },
  { label: 'Checklist audit', cols: [true, true, true, true] },
  { label: 'Analyse documentaire IA', cols: [false, false, true, true] },
  { label: 'Assistant IA dédié', cols: [false, false, false, true] },
]

const COMPARE_HEADERS = ['6 mois', 'Sans engagement', '+ Analyse IA', '+ Assistant IA']
const COMPARE_PRICES = ['119 €', '139 €', '149 € / 169 €', '219 € / 239 €']

const engagement = ref('6mois')
const openFaq = ref(null)

function toggleFaq(i) {
  openFaq.value = openFaq.value === i ? null : i
}

onMounted(() => {
  document.title = 'Certigestion — Tarifs & Options'
})
</script>

<template>
  <div>
    <!-- 1. HERO -->
    <section class="relative bg-navy bg-hex-pattern overflow-hidden">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-gold/5 blur-3xl" />
      </div>
      <div class="relative z-10 mx-auto max-w-3xl px-6 py-20 sm:py-28 text-center">
        <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
          Tarifs <span class="italic text-gold">&amp; Options</span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-white/70 leading-relaxed">
          Choisissez votre niveau d'accompagnement. De l'abonnement de base
          aux options premium, construisez la solution qui correspond
          exactement à vos besoins.
        </p>
      </div>
    </section>

    <!-- 2. PRICING TOGGLE + CARDS -->
    <section class="bg-surface px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
          Abonnement Certigestion
        </h2>
        <p class="text-center text-text/60 mb-10">
          Votre base de travail quotidienne
        </p>

        <!-- Toggle -->
        <div class="flex justify-center mb-12">
          <div class="inline-flex rounded-full bg-navy/10 p-1">
            <button
              @click="engagement = '6mois'"
              :class="[
                'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                engagement === '6mois' ? 'bg-gold text-navy shadow-md' : 'text-navy/60 hover:text-navy',
              ]"
            >
              Engagement 6 mois
            </button>
            <button
              @click="engagement = 'libre'"
              :class="[
                'px-6 py-2.5 rounded-full text-sm font-bold transition-all',
                engagement === 'libre' ? 'bg-gold text-navy shadow-md' : 'text-navy/60 hover:text-navy',
              ]"
            >
              Sans engagement
            </button>
          </div>
        </div>

        <!-- Cards -->
        <div class="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <!-- 6 mois -->
          <div
            :class="[
              'relative rounded-2xl bg-white p-8 shadow-lg border-2 transition-all duration-300',
              engagement === '6mois'
                ? 'border-gold ring-2 ring-gold/20 scale-[1.02]'
                : 'border-transparent opacity-70',
            ]"
          >
            <span v-if="engagement === '6mois'" class="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-gold text-navy text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              <i class="pi pi-star" style="font-size: 14px"></i> Meilleure valeur
            </span>
            <p class="text-sm font-bold text-navy/50 uppercase tracking-wider mb-4">
              Engagement 6 mois
            </p>
            <p class="text-5xl font-black text-navy">
              119<span class="text-xl font-bold">€</span>
              <span class="text-lg font-semibold text-text/50">/mois</span>
            </p>
            <p class="text-sm text-text/50 mt-2 mb-8">
              Soit 714 € sur 6 mois — économisez 120 € vs sans engagement
            </p>

            <ul class="space-y-3 mb-8">
              <li v-for="f in FEATURES" :key="f" class="flex items-start gap-2.5 text-sm text-text/80">
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <i class="pi pi-check text-gold" style="font-size: 12px; font-weight: bold"></i>
                </span>
                {{ f }}
              </li>
            </ul>

            <a href="#contact" class="btn-gold w-full justify-center">
              Démarrer maintenant <i class="pi pi-arrow-right" style="font-size: 14px"></i>
            </a>
          </div>

          <!-- Sans engagement -->
          <div
            :class="[
              'relative rounded-2xl bg-white p-8 shadow-lg border-2 transition-all duration-300',
              engagement === 'libre'
                ? 'border-gold ring-2 ring-gold/20 scale-[1.02]'
                : 'border-transparent opacity-70',
            ]"
          >
            <p class="text-sm font-bold text-navy/50 uppercase tracking-wider mb-4">
              Sans engagement
            </p>
            <p class="text-5xl font-black text-navy">
              139<span class="text-xl font-bold">€</span>
              <span class="text-lg font-semibold text-text/50">/mois</span>
            </p>
            <p class="text-sm text-text/50 mt-2 mb-8">
              Résiliable à tout moment, sans préavis
            </p>

            <ul class="space-y-3 mb-8">
              <li v-for="f in FEATURES" :key="f" class="flex items-start gap-2.5 text-sm text-text/80">
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15">
                  <i class="pi pi-check text-gold" style="font-size: 12px; font-weight: bold"></i>
                </span>
                {{ f }}
              </li>
            </ul>

            <a href="#contact" class="btn-outline-gold w-full justify-center">
              Commencer sans engagement <i class="pi pi-arrow-right" style="font-size: 14px"></i>
            </a>
          </div>
        </div>

        <!-- Guarantee badge -->
        <div class="mt-10 flex justify-center">
          <div class="inline-flex items-center gap-3 bg-gold/10 border border-gold/30 rounded-full px-6 py-3">
            <i class="pi pi-shield text-gold" style="font-size: 20px"></i>
            <p class="text-sm font-semibold text-navy">
              30 jours satisfait ou remboursé — sans condition ni justification
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. OPTIONS PREMIUM -->
    <section class="bg-navy bg-grid-pattern px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl sm:text-4xl font-bold text-gold mb-4">
          Options premium
        </h2>
        <p class="text-center text-white/60 mb-4">
          Allez plus loin avec un accompagnement expert
        </p>
        <p class="text-center text-white/40 text-sm mb-14">
          Disponibles en complément de votre abonnement, ou de façon indépendante.
        </p>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Audit blanc assisté -->
          <div class="rounded-2xl bg-navy-lighter/80 p-8 ring-1 ring-white/10 hover:ring-gold/30 transition-all">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/15">
              <i class="pi pi-search text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-xl font-bold text-white mb-4">
              Audit blanc assisté
            </h3>
            <div class="space-y-2 mb-6">
              <div class="flex items-center justify-between">
                <span class="text-sm text-white/50">Prix standard</span>
                <span class="text-lg font-black text-white">1 500 €</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gold">Prix abonné</span>
                <span class="text-lg font-black text-gold">1 200 €</span>
              </div>
              <p class="text-xs text-white/40 text-right">par jour</p>
            </div>
            <p class="text-sm text-white/60 leading-relaxed mb-6">
              Simulez un audit réel avec une auditrice expérimentée. Repartez
              avec un plan d'action clair et priorisé pour corriger vos écarts
              avant le jour J.
            </p>
            <a href="#contact" class="btn-outline-gold self-start">
              Réserver un audit blanc <i class="pi pi-arrow-right" style="font-size: 14px"></i>
            </a>
          </div>

          <!-- Accompagnement 1h -->
          <div class="rounded-2xl bg-navy-lighter/80 p-8 ring-1 ring-white/10 hover:ring-gold/30 transition-all">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/15">
              <i class="pi pi-clock text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-xl font-bold text-white mb-4">
              Accompagnement 1h
            </h3>
            <p class="text-3xl font-black text-gold mb-6">
              190 €<span class="text-sm font-semibold text-white/50"> / heure</span>
            </p>
            <p class="text-sm text-white/60 leading-relaxed mb-6">
              Accès direct à une auditrice expérimentée. En 1 heure, vous
              débloquez ce qui vous prend des semaines seul — questions
              spécifiques, points bloquants, stratégie.
            </p>
            <a href="#contact" class="btn-outline-gold self-start">
              Réserver une session <i class="pi pi-arrow-right" style="font-size: 14px"></i>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. OPTIONS IA -->
    <section class="bg-surface px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
          Intelligence artificielle
        </h2>
        <p class="text-center text-text/60 mb-4">
          Boostez votre productivité avec l'IA
        </p>
        <p class="text-center text-text/40 text-sm mb-14">
          Des options IA pour aller encore plus vite dans votre gestion documentaire.
        </p>

        <div class="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div class="rounded-2xl bg-white p-8 shadow-md ring-1 ring-navy/5 hover:-translate-y-1 hover:shadow-lg transition-all">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
              <i class="pi pi-star text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-navy">Analyse documentaire IA</h3>
            <p class="mt-2 text-2xl font-black text-navy">
              30 €<span class="text-sm font-semibold text-text/50">/mois</span>
            </p>
            <p class="mt-3 text-sm leading-relaxed text-text/70">
              Analyse automatique de vos documents pour détecter les manques et
              incohérences avant l'audit.
            </p>
          </div>

          <div class="rounded-2xl bg-white p-8 shadow-md ring-1 ring-navy/5 hover:-translate-y-1 hover:shadow-lg transition-all">
            <div class="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
              <i class="pi pi-sparkles text-gold" style="font-size: 28px"></i>
            </div>
            <h3 class="font-serif text-lg font-bold text-navy">Assistant IA</h3>
            <p class="mt-2 text-2xl font-black text-navy">
              100 €<span class="text-sm font-semibold text-text/50">/mois</span>
            </p>
            <p class="mt-3 text-sm leading-relaxed text-text/70">
              Un assistant IA dédié à votre organisme : rédaction, suggestions,
              réponses aux questions qualité en temps réel.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. COMPARISON TABLE -->
    <section class="bg-white px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
          Comparatif
        </h2>
        <p class="text-center text-text/60 mb-14">
          Ce qui est inclus dans chaque formule
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b-2 border-navy/10">
                <th class="text-left py-4 pr-4 font-serif text-base font-bold text-navy">
                  Fonctionnalité
                </th>
                <th v-for="h in COMPARE_HEADERS" :key="h" class="py-4 px-3 text-center font-bold text-navy/80">
                  {{ h }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in COMPARE_ROWS" :key="row.label" class="border-b border-navy/5">
                <td class="py-4 pr-4 text-text/70">{{ row.label }}</td>
                <td v-for="(val, i) in row.cols" :key="i" class="py-4 px-3 text-center">
                  <i v-if="val === true" class="pi pi-check text-gold mx-auto" style="font-size: 20px; font-weight: bold"></i>
                  <i v-else class="pi pi-times text-navy/20 mx-auto" style="font-size: 20px"></i>
                </td>
              </tr>
              <tr class="border-t-2 border-navy/10">
                <td class="py-4 pr-4 font-bold text-navy">Tarif mensuel</td>
                <td v-for="p in COMPARE_PRICES" :key="p" class="py-4 px-3 text-center font-black text-navy">
                  {{ p }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- 6. FAQ -->
    <section class="bg-surface px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-3xl">
        <h2 class="text-center font-serif text-3xl sm:text-4xl font-bold text-navy mb-4">
          Questions fréquentes
        </h2>
        <p class="text-center text-text/60 mb-14">
          Tout ce que vous voulez savoir
        </p>

        <div class="space-y-3">
          <div
            v-for="(item, i) in FAQ"
            :key="i"
            class="rounded-xl bg-white shadow-sm ring-1 ring-navy/5 overflow-hidden"
          >
            <button
              @click="toggleFaq(i)"
              class="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-navy hover:bg-navy/[0.02] transition-colors"
            >
              <span>{{ item.q }}</span>
              <i
                :class="[
                  'pi pi-chevron-down text-navy/40 shrink-0 ml-4 transition-transform duration-200',
                  openFaq === i ? 'rotate-180' : '',
                ]"
                style="font-size: 20px"
              ></i>
            </button>
            <div v-if="openFaq === i" class="px-6 pb-5 text-sm text-text/70 leading-relaxed">
              {{ item.a }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. FINAL CTA -->
    <section id="contact" class="bg-navy bg-hex-pattern px-6 py-20 sm:py-28">
      <div class="mx-auto max-w-2xl text-center">
        <h2 class="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
          Prêt à transformer votre organisation ?
        </h2>
        <p class="text-white/60 text-lg mb-10">
          Commencez avec 30 jours de garantie satisfait ou remboursé. Aucun risque.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-4">
          <a href="#contact" class="btn-gold">
            <i class="pi pi-envelope" style="font-size: 20px"></i> Démarrer à 119 €/mois
          </a>
          <router-link to="/funnels/tunnel-1-outils" class="btn-outline-light">
            <i class="pi pi-eye" style="font-size: 20px"></i> Voir la démo gratuite
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>
