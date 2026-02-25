import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import { useNavConfigStore } from '../stores/navConfig';

// =============================================
// CDC CertiGestion V1 — 7 items menu principal
// =============================================

// Items affichés dans la barre horizontale du haut (mode topnav)
const topNavItems = [
  { name: 'accueil', href: '/dashboard', icon: 'pi-home' },
  { name: 'tiers', href: '/dashboard/tiers', icon: 'pi-users' },
  { name: 'catalogue', href: '/dashboard/catalogue', icon: 'pi-book' },
  { name: 'prestations', href: '/dashboard/sessions', icon: 'pi-briefcase' },
  { name: 'facturation', href: '/dashboard/factures', icon: 'pi-wallet' },
  { name: 'qualite', href: '/dashboard/qualite', icon: 'pi-shield' },
  { name: 'veille', href: '/dashboard/veille', icon: 'pi-eye' },
  { name: 'assistant_ia', href: '/dashboard/assistant-ia', icon: 'pi-microphone' },
  { name: 'bpf', href: '/dashboard/bpf', icon: 'pi-file-export' },
  { name: 'audit_blanc', href: 'https://qualiopi.genedoc.fr/', icon: 'pi-search', external: true },
  { name: 'elearning', href: '/dashboard/elearning', icon: 'pi-graduation-cap' },
  { name: 'parrainage', href: '/dashboard/parrainage', icon: 'pi-gift' },
];

// Sous-éléments de la sidebar contextuelle par section
const sidebarItemsBySection = {
  accueil: [],

  tiers: [
    { type: 'separator', label: 'Tiers' },
    { name: 'sidebar_tiers_list', href: '/dashboard/tiers', icon: 'pi-list' },
    { name: 'sidebar_tiers_create', href: '/dashboard/tiers/create', icon: 'pi-plus' },
    { type: 'separator', label: 'Apprenants' },
    { name: 'sidebar_learners_list', href: '/dashboard/learners', icon: 'pi-list' },
    { name: 'sidebar_learners_create', href: '/dashboard/learners/create', icon: 'pi-user-plus' },
  ],

  catalogue: [
    { name: 'sidebar_catalogue_formations', href: '/dashboard/catalogue', icon: 'pi-book' },
    { name: 'sidebar_catalogue_create', href: '/dashboard/catalogue/create', icon: 'pi-plus' },
    { name: 'sidebar_catalogue_missions', href: '/dashboard/catalogue/missions', icon: 'pi-briefcase' },
    { name: 'sidebar_catalogue_missions_create', href: '/dashboard/catalogue/missions/create', icon: 'pi-plus' },
  ],

  prestations: [
    { type: 'separator', label: 'Formation' },
    { name: 'sidebar_sessions_create', href: '/dashboard/sessions/create', icon: 'pi-plus', badge: 'blue' },
    { name: 'sidebar_sessions_list', href: '/dashboard/sessions', icon: 'pi-list' },
    { type: 'separator', label: 'Coaching' },
    { name: 'sidebar_coaching_create', href: '/dashboard/coaching/create', icon: 'pi-plus', badge: 'orange' },
    { name: 'sidebar_coaching_list', href: '/dashboard/coaching', icon: 'pi-list' },
    { type: 'separator', label: 'Conseil' },
    { name: 'sidebar_conseil_create', href: '/dashboard/conseil/create', icon: 'pi-plus', badge: 'green' },
    { name: 'sidebar_conseil_list', href: '/dashboard/conseil', icon: 'pi-list' },
  ],

  facturation: [
    { name: 'sidebar_factures_create', href: '/dashboard/factures/create', icon: 'pi-plus' },
    { name: 'sidebar_factures_list', href: '/dashboard/factures', icon: 'pi-list' },
    { name: 'sidebar_avoirs', href: '/dashboard/avoirs', icon: 'pi-replay' },
    { name: 'sidebar_tresorerie', href: '/dashboard/tresorerie', icon: 'pi-chart-line' },
    { name: 'sidebar_facturation_params', href: '/dashboard/facturation-params', icon: 'pi-cog' },
  ],

  qualite: [
    { name: 'sidebar_qualite_manuel', href: '/dashboard/qualite/manuel', icon: 'pi-book' },
    { name: 'sidebar_qualite_boite_outils', href: '/dashboard/qualite/boite-outils', icon: 'pi-box' },
    { name: 'sidebar_qualite_evaluations', href: '/dashboard/qualite/evaluations', icon: 'pi-question-circle' },
    { name: 'sidebar_qualite_analyse_doc', href: '/dashboard/qualite/analyse-doc', icon: 'pi-search' },
    { name: 'sidebar_qualite_reclamations', href: '/dashboard/qualite/reclamations', icon: 'pi-exclamation-triangle' },
    { name: 'sidebar_qualite_indicateurs', href: '/dashboard/qualite/indicateurs', icon: 'pi-chart-bar' },
    { name: 'sidebar_qualite_audit_blanc', href: 'https://qualiopi-modelisation.genedoc.fr/', icon: 'pi-link', external: true },
  ],

  veille: [
    { name: 'sidebar_veille_all', href: '/dashboard/veille', icon: 'pi-list' },
  ],

  assistant_ia: [
    { name: 'sidebar_ia_historique', href: '/dashboard/assistant-ia/historique', icon: 'pi-history' },
    { name: 'sidebar_ia_stats', href: '/dashboard/assistant-ia/stats', icon: 'pi-chart-bar' },
  ],

  bpf: [],

  elearning: [],

  parrainage: [],
};

// Items fixes en bas du sidebar (toujours visibles)
const fixedSideNavItems = [
  {
    name: 'settings',
    href: '/dashboard/company',
    icon: 'pi-cog',
    submenu: [
      { name: 'company_settings', href: '/dashboard/company', icon: 'pi-building' },
      { name: 'users_groups', href: '/dashboard/users', icon: 'pi-users' },
      { name: 'doc_types_settings', href: '/dashboard/doc-types-settings', icon: 'pi-file-edit' },
      { name: 'workflow_settings', href: '/dashboard/workflow-settings', icon: 'pi-sliders-h', orgAdminOnly: true },
      { name: 'gdpr_settings', href: '/dashboard/gdpr', icon: 'pi-lock' },
      { name: 'subscription', href: '/dashboard/subscription', icon: 'pi-credit-card' },
    ],
  },
];

const adminNavItem = { name: 'admin', href: '/dashboard/admin', icon: 'pi-shield', superAdminOnly: true };

// Tous les items pour le mode sidebar classique
const allNavItems = [
  { name: 'dashboard', href: '/dashboard', icon: 'pi-home' },
  { name: 'tiers', href: '/dashboard/tiers', icon: 'pi-users' },
  { name: 'catalogue', href: '/dashboard/catalogue', icon: 'pi-book' },
  { name: 'prestations', href: '/dashboard/sessions', icon: 'pi-briefcase' },
  { name: 'facturation', href: '/dashboard/factures', icon: 'pi-wallet' },
  { name: 'qualite', href: '/dashboard/qualite', icon: 'pi-shield' },
  { name: 'veille', href: '/dashboard/veille', icon: 'pi-eye' },
  { name: 'assistant_ia', href: '/dashboard/assistant-ia', icon: 'pi-microphone' },
  { name: 'bpf', href: '/dashboard/bpf', icon: 'pi-file-export' },
  { name: 'audit_blanc', href: 'https://qualiopi.genedoc.fr/', icon: 'pi-search', external: true },
  { name: 'elearning', href: '/dashboard/elearning', icon: 'pi-graduation-cap' },
  { name: 'parrainage', href: '/dashboard/parrainage', icon: 'pi-gift' },
  {
    name: 'settings',
    href: '/dashboard/company',
    icon: 'pi-cog',
    submenu: [
      { name: 'company_settings', href: '/dashboard/company', icon: 'pi-building' },
      { name: 'users_groups', href: '/dashboard/users', icon: 'pi-users' },
      { name: 'doc_types_settings', href: '/dashboard/doc-types-settings', icon: 'pi-file-edit' },
      { name: 'workflow_settings', href: '/dashboard/workflow-settings', icon: 'pi-sliders-h', orgAdminOnly: true },
      { name: 'gdpr_settings', href: '/dashboard/gdpr', icon: 'pi-lock' },
      { name: 'subscription', href: '/dashboard/subscription', icon: 'pi-credit-card' },
    ],
  },
];

export const useNavigation = () => {
  const route = useRoute();
  const { t } = useI18n();
  const authStore = useAuthStore();
  const navConfigStore = useNavConfigStore();

  // Navigation complète (mode sidebar classique)
  const navigation = computed(() => {
    if (authStore.isSuperAdmin) {
      return [...allNavItems, adminNavItem];
    }
    return allNavItems;
  });

  // Items pour la barre horizontale du haut (mode topnav)
  // Applique l'ordre custom depuis navConfigStore si disponible
  const topNavigation = computed(() => {
    const overrides = navConfigStore.config;
    let items = [...topNavItems];

    // Appliquer l'ordre custom
    if (overrides?.topNav?.order?.length) {
      const orderMap = new Map(overrides.topNav.order.map((name, i) => [name, i]));
      items.sort((a, b) => {
        const ai = orderMap.has(a.name) ? orderMap.get(a.name) : (a.name === 'accueil' ? -1 : 999);
        const bi = orderMap.has(b.name) ? orderMap.get(b.name) : (b.name === 'accueil' ? -1 : 999);
        return ai - bi;
      });
    }

    return items;
  });

  // Section active dérivée de la route courante
  const activeSection = computed(() => {
    const path = route.path;
    if (path === '/dashboard') return 'accueil';
    if (path.startsWith('/dashboard/learners') || path.startsWith('/dashboard/tiers')) return 'tiers';
    if (path.startsWith('/dashboard/catalogue')) return 'catalogue';
    if (path.startsWith('/dashboard/sessions') ||
        path.startsWith('/dashboard/coaching') ||
        path.startsWith('/dashboard/conseil') ||
        path.startsWith('/dashboard/projets')) return 'prestations';
    if (path.startsWith('/dashboard/factures') ||
        path.startsWith('/dashboard/avoirs') ||
        path.startsWith('/dashboard/tresorerie') ||
        path.startsWith('/dashboard/facturation-params')) return 'facturation';
    if (path.startsWith('/dashboard/qualite') ||
        path.startsWith('/dashboard/analyse-doc') ||
        path.startsWith('/dashboard/manuel-qualiopi') ||
        path.startsWith('/dashboard/quiz')) return 'qualite';
    if (path.startsWith('/dashboard/veille')) return 'veille';
    if (path.startsWith('/dashboard/assistant-ia')) return 'assistant_ia';
    if (path.startsWith('/dashboard/bpf')) return 'bpf';
    if (path.startsWith('/dashboard/elearning')) return 'elearning';
    if (path.startsWith('/dashboard/parrainage')) return 'parrainage';
    if (path.startsWith('/dashboard/company') ||
        path.startsWith('/dashboard/users') ||
        path.startsWith('/dashboard/doc-types-settings') ||
        path.startsWith('/dashboard/workflow-settings') ||
        path.startsWith('/dashboard/gdpr') ||
        path.startsWith('/dashboard/subscription')) return 'settings';
    if (path.startsWith('/dashboard/admin')) return 'admin';
    return 'accueil';
  });

  // Items pour le sidebar gauche (mode topnav) — contextuel selon la section active
  const sideNavigation = computed(() => {
    const section = activeSection.value;
    const sectionConfig = sidebarItemsBySection[section];

    let contextual = [];
    if (sectionConfig?.comingSoon) {
      contextual = [{ type: 'comingSoon' }];
    } else if (Array.isArray(sectionConfig)) {
      contextual = [...sectionConfig];
    }

    // Items fixes toujours présents en bas
    const fixed = [...fixedSideNavItems];
    if (authStore.isSuperAdmin) {
      fixed.push(adminNavItem);
    }

    return { contextual, fixed };
  });

  // Vérifier si un lien correspond à la page courante (supporte les query params)
  const isCurrent = (href) => {
    if (!href || href === '#') return false;

    try {
      const url = new URL(href, window.location.origin);

      // Match exact pour /dashboard (accueil)
      if (url.pathname === '/dashboard') {
        return route.path === '/dashboard' && !route.query.type && !route.query.role;
      }

      // Le path doit matcher en préfixe
      if (!route.path.startsWith(url.pathname)) return false;

      // Si le href a des query params, ils doivent tous matcher
      for (const [key, value] of url.searchParams.entries()) {
        if (route.query[key] !== value) return false;
      }

      // Si pas de query params dans le href mais la route en a, ne pas matcher
      if (!url.search && (route.query.type || route.query.role) && url.pathname === route.path) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  // Labels : utilise le label custom sidebar, puis topnav, puis i18n
  const getLabel = (name) => {
    const sidebarLabel = navConfigStore.config?.sidebar?.labels?.[name];
    if (sidebarLabel) return sidebarLabel;
    const customLabel = navConfigStore.config?.topNav?.labels?.[name];
    return customLabel || t(`nav.${name}`);
  };

  return {
    navigation,
    topNavigation,
    sideNavigation,
    activeSection,
    isCurrent,
    getLabel,
  };
};
