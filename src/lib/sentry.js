import * as Sentry from '@sentry/vue';

/**
 * Initialise Sentry pour le monitoring d'erreurs en production.
 * DSN à configurer dans les variables d'environnement Vercel :
 * VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 *
 * Pour créer un projet Sentry gratuit : https://sentry.io
 */
export const initSentry = (app, router) => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  // Ne pas initialiser si pas de DSN (dev local)
  if (!dsn) {
    console.info('[Sentry] Pas de DSN configuré — monitoring désactivé');
    return;
  }

  Sentry.init({
    app,
    dsn,
    environment: import.meta.env.MODE, // 'production' ou 'development'
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    integrations: [
      // Suivi automatique des navigations Vue Router
      Sentry.browserTracingIntegration({ router }),
      // Replay des sessions en cas d'erreur
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance : 10% des transactions en prod
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session Replay : 0% normal, 100% en cas d'erreur
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Ignorer les erreurs réseau courantes
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      'ChunkLoadError',
      'ResizeObserver loop',
      'AbortError',
    ],

    // Ne pas envoyer les données perso
    beforeSend(event) {
      // Supprimer les données utilisateur sensibles
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
};

/**
 * Identifie l'utilisateur courant pour Sentry (après connexion)
 */
export const setSentryUser = (user, organization) => {
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  Sentry.setUser({
    id: user?.id,
    email: user?.email,
  });

  if (organization) {
    Sentry.setTag('organization', organization.name);
    Sentry.setTag('organization_id', organization.id);
  }
};

/**
 * Efface l'utilisateur Sentry (après déconnexion)
 */
export const clearSentryUser = () => {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  Sentry.setUser(null);
};
