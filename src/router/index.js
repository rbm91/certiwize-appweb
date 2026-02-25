import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: to => {
      const authStore = useAuthStore();
      if (authStore.user) {
        return '/dashboard';
      } else {
        return '/login';
      }
    }
  },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  { path: '/forgot-password', component: () => import('../views/ForgotPassword.vue') },
  { path: '/update-password', component: () => import('../views/UpdatePassword.vue') },

  // Page d'acceptation d'invitation
  {
    path: '/join/:token',
    name: 'join-organization',
    component: () => import('../views/JoinOrganization.vue')
  },

  // Public pages (Sales Funnel)
  { path: '/pricing', component: () => import('../views/public/Pricing.vue') },
  { path: '/checkout', component: () => import('../views/public/Checkout.vue') },
  { path: '/checkout/success', component: () => import('../views/public/CheckoutSuccess.vue') },
  { path: '/schedule', component: () => import('../views/public/Schedule.vue') },
  {
    path: '/quiz/:token',
    name: 'quiz-public',
    component: () => import('../views/public/QuizPublic.vue')
  },
  { path: '/settings', component: () => import('../views/Settings.vue'), meta: { requiresAuth: true } },
  { path: '/generate-convention', component: () => import('../views/GenerateConvention.vue'), meta: { requiresAuth: true } },

  // ──────────────────────────────────────
  // Dashboard — Routes protégées
  // ──────────────────────────────────────
  {
    path: '/dashboard',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // ── Accueil ──
      {
        path: '',
        name: 'dashboard-home',
        component: () => import('../views/dashboard/DashboardHome.vue')
      },

      // ══════════════════════════════════
      // MODULE TIERS
      // ══════════════════════════════════
      {
        path: 'tiers',
        name: 'dashboard-tiers',
        component: () => import('../views/dashboard/Tiers.vue')
      },
      {
        path: 'tiers/create',
        name: 'dashboard-tiers-create',
        component: () => import('../views/dashboard/TiersCreate.vue')
      },
      {
        path: 'tiers/edit/:id',
        name: 'dashboard-tiers-edit',
        component: () => import('../views/dashboard/TiersCreate.vue')
      },
      {
        path: 'tiers/:id',
        name: 'dashboard-tiers-view',
        component: () => import('../views/dashboard/TierView.vue')
      },

      // ══════════════════════════════════
      // MODULE CATALOGUE
      // ══════════════════════════════════
      {
        path: 'catalogue',
        name: 'dashboard-catalogue',
        component: () => import('../views/dashboard/Catalogue.vue')
      },
      {
        path: 'catalogue/create',
        name: 'dashboard-catalogue-create',
        component: () => import('../views/dashboard/TrainingCreate.vue')
      },
      {
        path: 'catalogue/edit/:id',
        name: 'dashboard-catalogue-edit',
        component: () => import('../views/dashboard/TrainingCreate.vue')
      },
      {
        path: 'catalogue/missions',
        name: 'dashboard-catalogue-missions',
        component: () => import('../views/dashboard/Catalogue.vue'),
        props: { tab: 'missions' }
      },
      {
        path: 'catalogue/missions/create',
        name: 'dashboard-mission-create',
        component: () => import('../views/dashboard/MissionCreate.vue')
      },
      {
        path: 'catalogue/missions/edit/:id',
        name: 'dashboard-mission-edit',
        component: () => import('../views/dashboard/MissionCreate.vue')
      },

      // ══════════════════════════════════
      // MODULE PRESTATIONS — Formations (bleu)
      // ══════════════════════════════════
      {
        path: 'sessions',
        name: 'dashboard-sessions',
        component: () => import('../views/dashboard/Prestations.vue'),
        props: { typeFilter: 'formation' }
      },
      {
        path: 'sessions/create',
        name: 'dashboard-session-create',
        component: () => import('../views/dashboard/SessionCreate.vue')
      },
      {
        path: 'sessions/edit/:id',
        name: 'dashboard-session-edit',
        component: () => import('../views/dashboard/SessionCreate.vue')
      },
      {
        path: 'sessions/:id',
        name: 'dashboard-session-view',
        component: () => import('../views/dashboard/SessionView.vue')
      },

      // ── Prestations — Coaching (orange) ──
      {
        path: 'coaching',
        name: 'dashboard-coaching',
        component: () => import('../views/dashboard/Prestations.vue'),
        props: { typeFilter: 'coaching' }
      },
      {
        path: 'coaching/create',
        name: 'dashboard-coaching-create',
        component: () => import('../views/dashboard/CoachingCreate.vue')
      },
      {
        path: 'coaching/edit/:id',
        name: 'dashboard-coaching-edit',
        component: () => import('../views/dashboard/CoachingCreate.vue')
      },
      {
        path: 'coaching/:id',
        name: 'dashboard-coaching-view',
        component: () => import('../views/dashboard/PrestationView.vue'),
        props: { typePrestation: 'coaching' }
      },

      // ── Prestations — Conseil (vert) ──
      {
        path: 'conseil',
        name: 'dashboard-conseil',
        component: () => import('../views/dashboard/Prestations.vue'),
        props: { typeFilter: 'conseil' }
      },
      {
        path: 'conseil/create',
        name: 'dashboard-conseil-create',
        component: () => import('../views/dashboard/ConseilCreate.vue')
      },
      {
        path: 'conseil/edit/:id',
        name: 'dashboard-conseil-edit',
        component: () => import('../views/dashboard/ConseilCreate.vue')
      },
      {
        path: 'conseil/:id',
        name: 'dashboard-conseil-view',
        component: () => import('../views/dashboard/PrestationView.vue'),
        props: { typePrestation: 'conseil' }
      },

      // ── Prestations — Vue unifiée ──
      {
        path: 'prestations',
        name: 'dashboard-prestations',
        component: () => import('../views/dashboard/Prestations.vue')
      },

      // ══════════════════════════════════
      // MODULE FACTURATION
      // ══════════════════════════════════
      {
        path: 'factures',
        name: 'dashboard-factures',
        component: () => import('../views/dashboard/Factures.vue')
      },
      {
        path: 'factures/create',
        name: 'dashboard-facture-create',
        component: () => import('../views/dashboard/FactureCreate.vue')
      },
      {
        path: 'factures/edit/:id',
        name: 'dashboard-facture-edit',
        component: () => import('../views/dashboard/FactureCreate.vue')
      },
      {
        path: 'avoirs',
        name: 'dashboard-avoirs',
        component: () => import('../views/dashboard/Factures.vue'),
        props: { typeFilter: 'avoir' }
      },
      {
        path: 'tresorerie',
        name: 'dashboard-tresorerie',
        component: () => import('../views/dashboard/Tresorerie.vue')
      },
      {
        path: 'facturation-params',
        name: 'dashboard-facturation-params',
        component: () => import('../views/dashboard/FacturationParams.vue')
      },

      // ══════════════════════════════════
      // MODULE QUALITÉ
      // ══════════════════════════════════
      {
        path: 'qualite',
        name: 'dashboard-qualite',
        component: () => import('../views/dashboard/QualiteHome.vue')
      },
      {
        path: 'qualite/manuel',
        name: 'dashboard-qualite-manuel',
        component: () => import('../views/dashboard/ManuelQualiopi.vue')
      },
      {
        path: 'qualite/boite-outils',
        name: 'dashboard-qualite-boite-outils',
        component: () => import('../views/dashboard/BoiteOutils.vue')
      },
      {
        path: 'qualite/evaluations',
        name: 'dashboard-qualite-evaluations',
        component: () => import('../views/dashboard/BibliothequeEvaluations.vue')
      },
      {
        path: 'qualite/analyse-doc',
        name: 'dashboard-qualite-analyse-doc',
        component: () => import('../views/dashboard/DocumentAnalysis.vue')
      },
      {
        path: 'qualite/reclamations',
        name: 'dashboard-qualite-reclamations',
        component: () => import('../views/dashboard/Reclamations.vue')
      },
      {
        path: 'qualite/indicateurs',
        name: 'dashboard-qualite-indicateurs',
        component: () => import('../views/dashboard/Indicateurs.vue')
      },

      // ══════════════════════════════════
      // MODULE BPF
      // ══════════════════════════════════
      {
        path: 'bpf',
        name: 'dashboard-bpf',
        component: () => import('../views/dashboard/BPF.vue')
      },

      // ══════════════════════════════════
      // MODULE E-LEARNING
      // ══════════════════════════════════
      {
        path: 'elearning',
        name: 'dashboard-elearning',
        component: () => import('../views/dashboard/Elearning.vue')
      },

      // ══════════════════════════════════
      // MODULE PARRAINAGE
      // ══════════════════════════════════
      {
        path: 'parrainage',
        name: 'dashboard-parrainage',
        component: () => import('../views/dashboard/Parrainage.vue')
      },

      // ══════════════════════════════════
      // MODULE VEILLE
      // ══════════════════════════════════
      {
        path: 'veille',
        name: 'dashboard-veille',
        component: () => import('../views/dashboard/Veille.vue')
      },

      // ══════════════════════════════════
      // MODULE ASSISTANT IA
      // ══════════════════════════════════
      {
        path: 'assistant-ia',
        name: 'dashboard-assistant-ia',
        component: () => import('../views/dashboard/AssistantIA.vue')
      },
      {
        path: 'assistant-ia/historique',
        name: 'dashboard-appels-historique',
        component: () => import('../views/dashboard/AppelsHistorique.vue')
      },
      {
        path: 'assistant-ia/stats',
        name: 'dashboard-appels-stats',
        component: () => import('../views/dashboard/AppelsStats.vue')
      },

      // ══════════════════════════════════
      // PARAMÈTRES & ADMIN
      // ══════════════════════════════════
      {
        path: 'company',
        name: 'dashboard-company',
        component: () => import('../views/dashboard/SettingsCompany.vue')
      },
      {
        path: 'users',
        name: 'dashboard-users',
        component: () => import('../views/dashboard/UsersGroups.vue')
      },
      {
        path: 'doc-types-settings',
        name: 'dashboard-doc-types-settings',
        component: () => import('../views/dashboard/DocTypesSettings.vue')
      },
      {
        path: 'workflow-settings',
        name: 'dashboard-workflow-settings',
        component: () => import('../views/dashboard/WorkflowSettings.vue'),
        meta: { requiresOrgAdmin: true }
      },
      {
        path: 'gdpr',
        name: 'dashboard-gdpr',
        component: () => import('../views/dashboard/GDPRSettings.vue')
      },
      {
        path: 'subscription',
        name: 'dashboard-subscription',
        component: () => import('../views/dashboard/Subscription.vue')
      },

      // ── Super-Admin (niveau plateforme) ──
      {
        path: 'admin',
        name: 'dashboard-admin',
        component: () => import('../views/dashboard/AdminDashboard.vue'),
        meta: { requiresSuperAdmin: true }
      },

      // ── Quiz ──
      {
        path: 'quiz',
        name: 'dashboard-quiz',
        component: () => import('../views/dashboard/QuizBuilder.vue')
      },
      {
        path: 'quiz/create',
        name: 'dashboard-quiz-create',
        component: () => import('../views/dashboard/QuizBuilderEdit.vue')
      },
      {
        path: 'quiz/edit/:id',
        name: 'dashboard-quiz-edit',
        component: () => import('../views/dashboard/QuizBuilderEdit.vue')
      },
      {
        path: 'quiz/results/:id',
        name: 'dashboard-quiz-results',
        component: () => import('../views/dashboard/QuizResults.vue')
      },

      // ══════════════════════════════════
      // ESPACE APPRENANT (module séparé)
      // ══════════════════════════════════
      {
        path: 'learners',
        name: 'dashboard-learners',
        component: () => import('../views/dashboard/LearnerList.vue')
      },
      {
        path: 'learners/create',
        name: 'dashboard-learner-create',
        component: () => import('../views/dashboard/LearnerCreate.vue')
      },
      {
        path: 'learners/edit/:id',
        name: 'dashboard-learner-edit',
        component: () => import('../views/dashboard/LearnerCreate.vue')
      },
      {
        path: 'projets',
        redirect: '/dashboard/sessions'
      },
      {
        path: 'projets/create',
        redirect: '/dashboard/sessions/create'
      },
      {
        path: 'projets/edit/:id',
        redirect: to => `/dashboard/sessions/edit/${to.params.id}`
      },
      {
        path: 'analyse-doc',
        redirect: '/dashboard/qualite/analyse-doc'
      },
      {
        path: 'manuel-qualiopi',
        redirect: '/dashboard/qualite/manuel'
      },
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // Attendre que l'authentification soit initialisée avant de vérifier
  if (!authStore.initialized && to.meta.requiresAuth) {
    try {
      await Promise.race([
        authStore.waitForInit(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth init timeout')), 5000))
      ]);
    } catch (err) {
      console.warn('[Router] Auth initialization timeout, proceeding anyway');
    }
  }

  // Si on vient de /login et qu'on va vers une route auth, laisser un instant
  // au listener Supabase pour mettre à jour le state
  if (to.meta.requiresAuth && !authStore.user && from.path === '/login') {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Vérifications d'accès
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login');
  } else if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    next('/dashboard');
  } else if (to.meta.requiresOrgAdmin && !authStore.isOrgAdmin) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
