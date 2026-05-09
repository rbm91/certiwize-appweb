<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import RevealSection from '../../components/marketing/RevealSection.vue';

const GREEN = 'oklch(0.55 0.14 145)';

const formData = ref({
  nom: '',
  email: '',
  telephone: '',
  message: '',
});
const submitting = ref(false);
const submitted = ref(false);
const toast = useToast();

onMounted(() => {
  document.title = 'Contact — Certigestion';
});

async function handleSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const res = await fetch('/api/create-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.value.nom,
        email: formData.value.email,
        phone: formData.value.telephone || null,
        message: formData.value.message || null,
        source: 'landing_contact',
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    submitted.value = true;
    toast.add({
      severity: 'success',
      summary: 'Message envoyé',
      detail: 'Nous vous recontactons rapidement.',
      life: 4000,
    });
    formData.value = { nom: '', email: '', telephone: '', message: '' };
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Échec de l\'envoi',
      detail: err.message || 'Une erreur est survenue. Réessayez plus tard.',
      life: 5000,
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="pt-32 pb-20" style="background: oklch(0.08 0.01 145);">
      <div class="marketing-container">
        <div class="max-w-3xl mx-auto text-center">
          <RevealSection>
            <span class="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 mb-6 text-white" :style="{ background: GREEN }">
              Contact
            </span>
          </RevealSection>
          <RevealSection :delay="100">
            <h1 class="text-4xl md:text-5xl font-bold text-white leading-tight mb-6" style="font-family: var(--font-serif);">
              Une question ? Un doute ?
            </h1>
          </RevealSection>
          <RevealSection :delay="200">
            <p class="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto">
              Un échange rapide pour comprendre votre situation.
            </p>
          </RevealSection>
        </div>
      </div>
    </section>

    <!-- FORM -->
    <section class="py-20 bg-white">
      <div class="marketing-container">
        <div class="max-w-5xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <!-- Form -->
            <div class="lg:col-span-2">
              <RevealSection>
                <form v-if="!submitted" class="space-y-6" @submit.prevent="handleSubmit">
                  <div>
                    <label for="nom" class="block text-sm font-semibold text-gray-700 mb-2">Nom complet *</label>
                    <input
                      id="nom"
                      v-model="formData.nom"
                      type="text"
                      required
                      placeholder="Votre nom"
                      class="w-full px-4 py-3 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-green-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      id="email"
                      v-model="formData.email"
                      type="email"
                      required
                      placeholder="votre@email.com"
                      class="w-full px-4 py-3 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-green-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label for="telephone" class="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                    <input
                      id="telephone"
                      v-model="formData.telephone"
                      type="tel"
                      placeholder="+33 6 00 00 00 00"
                      class="w-full px-4 py-3 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-green-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label for="message" class="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                    <textarea
                      id="message"
                      v-model="formData.message"
                      required
                      rows="5"
                      placeholder="Décrivez votre situation ou votre question..."
                      class="w-full px-4 py-3 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-green-600 transition-colors resize-vertical"
                    />
                  </div>
                  <button
                    type="submit"
                    :disabled="submitting"
                    class="inline-flex items-center gap-2 px-8 py-4 text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-60"
                    :style="{ background: GREEN }"
                  >
                    {{ submitting ? 'Envoi en cours...' : 'Envoyer mon message' }}
                    <i class="pi pi-arrow-right text-sm" />
                  </button>
                </form>
                <div v-else class="p-8 bg-gray-50" :style="{ borderLeft: `4px solid ${GREEN}` }">
                  <h3 class="text-xl font-bold text-gray-900 mb-3" style="font-family: var(--font-serif);">
                    Message bien reçu.
                  </h3>
                  <p class="text-gray-600 mb-4">
                    Nous vous recontactons dans les meilleurs délais. À très vite.
                  </p>
                  <button
                    type="button"
                    class="text-sm font-semibold inline-flex items-center gap-1"
                    :style="{ color: GREEN }"
                    @click="submitted = false"
                  >
                    Envoyer un autre message <i class="pi pi-arrow-right text-xs" />
                  </button>
                </div>
              </RevealSection>
            </div>

            <!-- Sidebar -->
            <div class="lg:col-span-1">
              <RevealSection :delay="200">
                <div class="space-y-6">
                  <router-link to="/landing/diagnostic" class="block">
                    <div class="p-5 border border-gray-200 hover:border-green-300 transition-colors cursor-pointer">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="pi pi-bullseye" :style="{ color: GREEN, fontSize: '1.25rem' }" />
                        <h4 class="font-bold text-gray-900 text-sm">Tester mon niveau</h4>
                      </div>
                      <p class="text-gray-500 text-xs">Évaluez votre conformité Qualiopi en 30 minutes.</p>
                    </div>
                  </router-link>

                  <router-link to="/landing/diagnostic" class="block">
                    <div class="p-5 border-2 transition-colors cursor-pointer" :style="{ borderColor: GREEN }">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="pi pi-file-check" :style="{ color: GREEN, fontSize: '1.25rem' }" />
                        <h4 class="font-bold text-gray-900 text-sm">Diagnostic 149 €</h4>
                      </div>
                      <p class="text-gray-500 text-xs">Rapport complet : scoring, cartographie, roadmap.</p>
                    </div>
                  </router-link>

                  <router-link to="/schedule" class="block">
                    <div class="p-5 border border-gray-200 hover:border-green-300 transition-colors cursor-pointer mt-6">
                      <div class="flex items-center gap-3 mb-2">
                        <i class="pi pi-comments" :style="{ color: GREEN, fontSize: '1.25rem' }" />
                        <h4 class="font-bold text-gray-900 text-sm">Échange gratuit 15 min</h4>
                      </div>
                      <p class="text-gray-500 text-xs">Réservez un créneau pour discuter de votre situation.</p>
                    </div>
                  </router-link>

                  <div class="pt-6 border-t border-gray-200">
                    <h4 class="font-bold text-gray-900 text-sm mb-4">Nous contacter</h4>
                    <ul class="space-y-3">
                      <li>
                        <a href="tel:+33745089227" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
                          <i class="pi pi-phone text-sm" :style="{ color: GREEN }" /> +33 7 45 08 92 27
                        </a>
                      </li>
                      <li>
                        <a href="tel:+33678066156" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
                          <i class="pi pi-phone text-sm" :style="{ color: GREEN }" /> +33 6 78 06 61 56
                        </a>
                      </li>
                      <li>
                        <a href="mailto:contact@certigestion.fr" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
                          <i class="pi pi-envelope text-sm" :style="{ color: GREEN }" /> contact@certigestion.fr
                        </a>
                      </li>
                      <li>
                        <div class="flex items-center gap-2 text-gray-600 text-sm">
                          <i class="pi pi-map-marker text-sm" :style="{ color: GREEN }" /> Paris
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
