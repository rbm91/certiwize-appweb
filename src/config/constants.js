/**
 * Constantes globales de l'application Certiwize
 * Centralise tous les magic numbers et valeurs hardcodées
 */

// Délais et timeouts (en millisecondes)
export const TIMEOUTS = {
  TOAST_NOTIFICATION: 3000,           // Durée d'affichage des toasts
  SLOW_LOADING_THRESHOLD: 10000,      // Seuil pour afficher le dialog de chargement lent
  DEFAULT_REQUEST_TIMEOUT: 30000,     // Timeout par défaut pour les requêtes
};

// Configuration du stockage Supabase
export const STORAGE = {
  QUALIOPI_BUCKET: 'qualiopi-files',
  PROJECT_DOCS_BUCKET: 'project-docs',
  MAX_FILE_SIZE: 10000000,            // 10 MB en octets
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ],
};

// Calculs financiers
export const CALCULATIONS = {
  VAT_RATE: 0.20,                     // TVA à 20%
  DEFAULT_CURRENCY: 'EUR',
  CURRENCY_LOCALE: 'fr-FR',
};

// Configuration des tableaux PrimeVue
export const TABLE = {
  DEFAULT_ROWS: 10,
  ROWS_PER_PAGE_OPTIONS: [10, 25, 50],
  MIN_WIDTH: '50rem',
};

// Formats de date
export const DATE_FORMATS = {
  DISPLAY: 'dd/mm/yy',                // Format d'affichage dans les calendriers
  API: 'yyyy-MM-dd',                  // Format pour les API
  LOCALE: 'fr-FR',                    // Locale française
};

// Statuts de projet
export const PROJECT_STATUS = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  VALIDATED: 'Validé',
  FINISHED: 'Terminé',
};

// Types de documents projet
export const DOCUMENT_TYPES = {
  IDENTIFICATION: 'etude',
  CONVENTION: 'convention',
  CONVOCATION: 'convocation',
  BOOKLET: 'livret',
};

// Colonnes de la base de données pour les documents
export const DOCUMENT_COLUMNS = {
  [DOCUMENT_TYPES.IDENTIFICATION]: 'identification',
  [DOCUMENT_TYPES.CONVENTION]: 'convention',
  [DOCUMENT_TYPES.CONVOCATION]: 'convocation',
  [DOCUMENT_TYPES.BOOKLET]: 'livret',
};

// Rôles utilisateur
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Configuration de génération de séquences
export const SEQUENCE = {
  RANDOM_MAX: 10000,
  PADDING_LENGTH: 5,
};

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
  SIRET_LENGTH: 14,
};

// Messages d'erreur par défaut
export const ERROR_MESSAGES = {
  GENERIC: 'Une erreur est survenue',
  NETWORK: 'Erreur de connexion au serveur',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  NOT_FOUND: 'Ressource introuvable',
  VALIDATION: 'Les données fournies sont invalides',
};

// Sévérités des toasts
export const TOAST_SEVERITY = {
  SUCCESS: 'success',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// Classes CSS pour les tags de sévérité
export const TAG_SEVERITY = {
  SUCCESS: 'success',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'danger',
  SECONDARY: 'secondary',
  PRIMARY: 'primary',
};

export default {
  TIMEOUTS,
  STORAGE,
  CALCULATIONS,
  TABLE,
  DATE_FORMATS,
  PROJECT_STATUS,
  DOCUMENT_TYPES,
  DOCUMENT_COLUMNS,
  USER_ROLES,
  SEQUENCE,
  VALIDATION,
  ERROR_MESSAGES,
  TOAST_SEVERITY,
  TAG_SEVERITY,
};
