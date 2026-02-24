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
  TIER_FILES_BUCKET: 'tier-files',
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

// Rôles utilisateur (niveau plateforme)
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  USER: 'user',
};

// Rôles au sein d'une organisation
export const ORG_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const ORG_ROLE_OPTIONS = [
  { label: 'Propriétaire', value: 'owner', severity: 'danger' },
  { label: 'Administrateur', value: 'admin', severity: 'warn' },
  { label: 'Membre', value: 'member', severity: 'info' },
];

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

// =============================================
// CDC CertiGestion V1 — Constantes métier
// =============================================

// Tiers — Rôles
export const TIER_ROLES = {
  CLIENT: 'client',
  APPRENANT: 'apprenant',
  FORMATEUR: 'formateur',
  FOURNISSEUR: 'fournisseur',
  PARTENAIRE: 'partenaire',
};

export const TIER_ROLE_OPTIONS = [
  { label: 'Client', value: 'client', icon: 'pi-building' },
  { label: 'Apprenant', value: 'apprenant', icon: 'pi-user' },
  { label: 'Formateur', value: 'formateur', icon: 'pi-id-card' },
  { label: 'Fournisseur', value: 'fournisseur', icon: 'pi-briefcase' },
  { label: 'Partenaire', value: 'partenaire', icon: 'pi-handshake' },
];

export const TIER_ROLE_COLORS = {
  client: 'info',
  apprenant: 'success',
  formateur: 'warn',
  fournisseur: 'secondary',
  partenaire: 'primary',
};

// Tiers — Nature
export const TIER_NATURES = [
  { label: 'Personne physique', value: 'personne_physique' },
  { label: 'Organisation', value: 'organisation' },
];

// Tiers — Statuts
export const TIER_STATUTS = [
  { label: 'Actif', value: 'actif' },
  { label: 'Inactif', value: 'inactif' },
  { label: 'Archivé', value: 'archive' },
];

// Tiers — Statut commercial (si rôle client)
export const STATUT_COMMERCIAL = [
  { label: 'Prospect', value: 'prospect' },
  { label: 'Client actif', value: 'client_actif' },
  { label: 'Client inactif', value: 'client_inactif' },
];

// Tiers — Types de relation personne ↔ organisation
export const RELATION_TYPES = [
  { label: 'Dirigeant', value: 'dirigeant' },
  { label: 'Salarié', value: 'salarie' },
  { label: 'Contact facturation', value: 'contact_facturation' },
  { label: 'Contact pédagogique', value: 'contact_pedagogique' },
  { label: 'Apprenant rattaché', value: 'apprenant_rattache' },
];

// Tiers — Types de fournisseur
export const FOURNISSEUR_TYPES = [
  { label: 'Sous-traitant pédagogique', value: 'sous_traitant_pedagogique' },
  { label: 'Prestataire technique', value: 'prestataire_technique' },
  { label: 'Autre', value: 'autre' },
];

// Tiers — Handicap
export const HANDICAP_OPTIONS = [
  { label: 'Oui', value: 'oui' },
  { label: 'Non', value: 'non' },
  { label: 'Non renseigné', value: 'non_renseigne' },
];

// Tiers — Types de documents
export const TIER_DOC_TYPES = [
  { label: 'NDA contractuel', value: 'nda' },
  { label: 'Certificat Qualiopi', value: 'certificat_qualiopi' },
  { label: 'CV', value: 'cv' },
  { label: 'Kbis', value: 'kbis' },
  { label: 'RIB', value: 'rib' },
  { label: 'Accord cadre', value: 'accord_cadre' },
  { label: 'Autre', value: 'autre' },
];

// Score conformité tiers
export const SCORE_THRESHOLDS = { GREEN: 80, ORANGE: 50 };

// Prestations — Types
export const PRESTATION_TYPES = {
  FORMATION: 'formation',
  COACHING: 'coaching',
  CONSEIL: 'conseil',
};

export const PRESTATION_TYPE_OPTIONS = [
  { label: 'Formation', value: 'formation', icon: 'pi-book', color: '#3B82F6' },
  { label: 'Coaching', value: 'coaching', icon: 'pi-comments', color: '#F59E0B' },
  { label: 'Conseil', value: 'conseil', icon: 'pi-chart-line', color: '#10B981' },
];

export const PRESTATION_COLORS = {
  formation: '#3B82F6',
  coaching: '#F59E0B',
  conseil: '#10B981',
};

// Prestations — Statuts
export const PRESTATION_STATUTS = [
  { label: 'Brouillon', value: 'brouillon', severity: 'secondary' },
  { label: 'En attente', value: 'en_attente', severity: 'warn' },
  { label: 'En cours', value: 'en_cours', severity: 'info' },
  { label: 'Terminée', value: 'terminee', severity: 'success' },
  { label: 'Annulée', value: 'annulee', severity: 'danger' },
];

// Prestations — Étapes workflow Formation (10 étapes)
export const FORMATION_WORKFLOW_STEPS = [
  { step: 1, label: 'Identification', icon: 'pi-user' },
  { step: 2, label: 'Analyse du besoin', icon: 'pi-search' },
  { step: 3, label: 'Convention', icon: 'pi-file' },
  { step: 4, label: 'Convocation', icon: 'pi-envelope' },
  { step: 5, label: 'Réalisation', icon: 'pi-play' },
  { step: 6, label: 'Évaluation', icon: 'pi-check-circle' },
  { step: 7, label: 'Satisfaction', icon: 'pi-star' },
  { step: 8, label: 'Facturation', icon: 'pi-wallet' },
  { step: 9, label: 'Clôture', icon: 'pi-lock' },
  { step: 10, label: 'Archivé', icon: 'pi-box' },
];

// Prestations — Étapes workflow Coaching (6 étapes)
export const COACHING_WORKFLOW_STEPS = [
  { step: 1, label: 'Cadrage', icon: 'pi-compass' },
  { step: 2, label: 'Contractualisation', icon: 'pi-file' },
  { step: 3, label: 'Plan accompagnement', icon: 'pi-map' },
  { step: 4, label: 'Séances', icon: 'pi-comments' },
  { step: 5, label: 'Bilan', icon: 'pi-chart-bar' },
  { step: 6, label: 'Clôture', icon: 'pi-lock' },
];

// Prestations — Étapes workflow Conseil (5 étapes)
export const CONSEIL_WORKFLOW_STEPS = [
  { step: 1, label: 'Cadrage', icon: 'pi-compass' },
  { step: 2, label: 'Proposition', icon: 'pi-file-edit' },
  { step: 3, label: 'Réalisation', icon: 'pi-play' },
  { step: 4, label: 'Facturation', icon: 'pi-wallet' },
  { step: 5, label: 'Clôture', icon: 'pi-lock' },
];

// Workflow — Couleurs de statut d'étape
export const WORKFLOW_STEP_COLORS = {
  not_started: '#9CA3AF',  // gris
  in_progress: '#3B82F6',  // bleu
  waiting: '#F59E0B',      // orange
  completed: '#10B981',    // vert
  critical: '#EF4444',     // rouge
};

// Facturation — Types de facture
export const FACTURE_TYPES = [
  { label: 'Standard', value: 'standard' },
  { label: 'Acompte', value: 'acompte' },
  { label: 'Solde', value: 'solde' },
  { label: 'Avoir', value: 'avoir' },
];

// Facturation — Statuts
export const FACTURE_STATUTS = [
  { label: 'Brouillon', value: 'brouillon', severity: 'secondary' },
  { label: 'Émise', value: 'emise', severity: 'info' },
  { label: 'Envoyée', value: 'envoyee', severity: 'info' },
  { label: 'Payée', value: 'payee', severity: 'success' },
  { label: 'En retard', value: 'en_retard', severity: 'danger' },
  { label: 'Annulée', value: 'annulee', severity: 'warn' },
];

// Facturation — Conditions de paiement
export const CONDITIONS_PAIEMENT = [
  { label: 'Immédiat', value: 'immediat' },
  { label: '7 jours', value: '7_jours' },
  { label: '30 jours', value: '30_jours' },
  { label: 'Autre', value: 'autre' },
];

// Facturation — Modes de paiement
export const MODES_PAIEMENT = [
  { label: 'Virement', value: 'virement' },
  { label: 'Chèque', value: 'cheque' },
  { label: 'Carte bancaire', value: 'carte' },
  { label: 'Espèces', value: 'especes' },
  { label: 'Prélèvement', value: 'prelevement' },
];

// Trésorerie — Couleurs
export const TRESORERIE_COLORS = {
  signe_non_facture: '#93C5FD',  // bleu clair
  facture: '#2563EB',            // bleu foncé
  encaisse: '#10B981',           // vert
  en_retard: '#EF4444',          // rouge
};

// Qualité — Thèmes procédures
export const QUALITE_THEMES = [
  { label: 'Commercial', value: 'commercial' },
  { label: 'Pédagogique', value: 'pedagogique' },
  { label: 'Administratif', value: 'administratif' },
  { label: 'RH / Formateurs', value: 'rh_formateurs' },
  { label: 'Finance', value: 'finance' },
  { label: 'Handicap', value: 'handicap' },
  { label: 'Amélioration continue', value: 'amelioration_continue' },
  { label: 'Autre', value: 'autre' },
];

// Qualité — Statuts procédures
export const PROCEDURE_STATUTS = [
  { label: 'Brouillon', value: 'brouillon', severity: 'secondary' },
  { label: 'Validée', value: 'validee', severity: 'success' },
  { label: 'Archivée', value: 'archivee', severity: 'warn' },
];

// Qualité — Réclamations types
export const RECLAMATION_TYPES = [
  { label: 'Stagiaire', value: 'stagiaire' },
  { label: 'Formateur', value: 'formateur' },
  { label: 'Financeur', value: 'financeur' },
  { label: 'Interne', value: 'interne' },
];

// Qualité — Motifs ticket (aléas / dysfonctionnement / réclamation)
export const RECLAMATION_MOTIFS = [
  { label: 'Aléas', value: 'aleas', severity: 'info' },
  { label: 'Dysfonctionnement', value: 'dysfonctionnement', severity: 'warn' },
  { label: 'Réclamation', value: 'reclamation', severity: 'danger' },
];

// Qualité — Gravité réclamations
export const RECLAMATION_GRAVITE = [
  { label: 'Sans impact', value: 'sans_impact', severity: 'success' },
  { label: 'Mineur', value: 'mineur', severity: 'warn' },
  { label: 'Majeure', value: 'majeure', severity: 'danger' },
];

// Qualité — Statuts réclamations
export const RECLAMATION_STATUTS = [
  { label: 'Ouverte', value: 'ouverte', severity: 'danger' },
  { label: 'En cours', value: 'en_cours', severity: 'warn' },
  { label: 'Clôturée', value: 'cloturee', severity: 'success' },
];

// Signaux qualité — Statuts
export const SIGNAL_STATUTS = [
  { label: 'Ouvert', value: 'ouvert', severity: 'danger' },
  { label: 'En analyse', value: 'en_analyse', severity: 'warn' },
  { label: 'Clos', value: 'clos', severity: 'success' },
];

// Évaluations — Types
export const EVALUATION_TYPES = [
  { label: 'Quiz positionnement', value: 'quiz_positionnement', category: 'quiz' },
  { label: 'Quiz validation des acquis', value: 'quiz_validation', category: 'quiz' },
  { label: 'Satisfaction stagiaire', value: 'satisfaction_stagiaire', category: 'enquete' },
  { label: 'Satisfaction formateur', value: 'satisfaction_formateur', category: 'enquete' },
  { label: 'Satisfaction financeur', value: 'satisfaction_financeur', category: 'enquete' },
];

// Évaluations — Statuts d'exécution
export const EVALUATION_EXEC_STATUTS = [
  { label: 'Non envoyé', value: 'non_envoye' },
  { label: 'Envoyé', value: 'envoye' },
  { label: 'En cours', value: 'en_cours' },
  { label: 'Clôturé', value: 'cloture' },
];

// Assistant IA — Motifs d'appel
export const APPEL_MOTIFS = [
  { label: 'Information formation', value: 'information_formation' },
  { label: 'Demande devis', value: 'demande_devis' },
  { label: 'Réclamation', value: 'reclamation' },
  { label: 'Question administrative', value: 'question_administrative' },
  { label: 'Autre', value: 'autre' },
];

// Assistant IA — Statuts appels
export const APPEL_STATUTS = [
  { label: 'À qualifier', value: 'a_qualifier', severity: 'warn' },
  { label: 'Transformé', value: 'transforme', severity: 'success' },
  { label: 'Classé', value: 'classe', severity: 'secondary' },
  { label: 'Archivé', value: 'archive', severity: 'info' },
];

// Rôles utilisateurs internes CDC
export const USER_ROLES_CDC = [
  { label: 'Administrateur', value: 'administrateur' },
  { label: 'Responsable pédagogique', value: 'responsable_pedagogique' },
  { label: 'Assistant administratif', value: 'assistant_administratif' },
  { label: 'Formateur', value: 'formateur' },
  { label: 'Consultant', value: 'consultant' },
];

// Formes juridiques
export const FORMES_JURIDIQUES = [
  { label: 'SARL', value: 'SARL' },
  { label: 'SAS', value: 'SAS' },
  { label: 'SASU', value: 'SASU' },
  { label: 'EURL', value: 'EURL' },
  { label: 'SA', value: 'SA' },
  { label: 'SCI', value: 'SCI' },
  { label: 'Association', value: 'Association' },
  { label: 'Auto-entrepreneur', value: 'Auto-entrepreneur' },
  { label: 'Autre', value: 'Autre' },
];

// Indicateurs RNQ (référentiel national qualité)
export const INDICATEURS_RNQ = Array.from({ length: 32 }, (_, i) => ({
  label: `Indicateur ${i + 1}`,
  value: `ind_${i + 1}`,
}));

// Boîte à outils — Catégories de modèles
export const BOITE_OUTILS_CATEGORIES = [
  { label: 'Procédure', value: 'procedure' },
  { label: 'Règlement intérieur', value: 'reglement_interieur' },
  { label: 'Convention', value: 'convention' },
  { label: 'Programme', value: 'programme' },
  { label: 'Analyse du besoin', value: 'analyse_besoin' },
  { label: 'Questionnaire satisfaction', value: 'questionnaire_satisfaction' },
  { label: 'Plan d\'action', value: 'plan_action' },
  { label: 'Gestion réclamation', value: 'gestion_reclamation' },
];

// =============================================
// Options legacy (Formateur, Financeur, Entreprise, Apprenant)
// =============================================

// Options de profils (Formateur, Financeur, Entreprise, Apprenant)
export const PROFILE_OPTIONS = {
  FORMATEUR_ORIGINS: [
    'Personnes extérieures à votre organisme (sous-traitance)',
    'Salarié de votre organisme',
    'Bénévole',
    'Candidature spontanée',
    'Recommandation',
    'Autre',
  ],
  GENDER: [
    { label: 'Homme', value: 'Homme' },
    { label: 'Femme', value: 'Femme' },
  ],
  RATE_UNITS: [
    { label: '/ heure', value: 'heure' },
    { label: '/ jour', value: 'jour' },
    { label: '/ demi-journée', value: 'demi-journee' },
    { label: '/ forfait', value: 'forfait' },
  ],
  FINANCEUR_TYPES: [
    'Caisse des dépôts',
    'OPCO',
    'CPF',
    'Pôle Emploi / France Travail',
    'Région',
    'Employeur',
    'Autofinancement',
    'Autre',
  ],
  CSP: [
    'Agriculteur',
    'Artisan, commerçant',
    'Cadre',
    'Profession intermédiaire',
    'Employé',
    'Ouvrier',
    'Retraité',
    'Sans activité',
    'Autre',
  ],
  CONTRACT_TYPES: [
    'CDI',
    'CDD',
    'Intérim',
    'Contrat de professionnalisation',
    "Contrat d'apprentissage",
    'Stage',
    'Indépendant',
    'Sans emploi',
    'Autre',
  ],
  YES_NO: [
    { label: 'Oui', value: true },
    { label: 'Non', value: false },
  ],
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
  ORG_ROLES,
  ORG_ROLE_OPTIONS,
  SEQUENCE,
  VALIDATION,
  ERROR_MESSAGES,
  TOAST_SEVERITY,
  TAG_SEVERITY,
  PROFILE_OPTIONS,
  // CDC CertiGestion V1
  TIER_ROLES,
  TIER_ROLE_OPTIONS,
  TIER_ROLE_COLORS,
  TIER_NATURES,
  TIER_STATUTS,
  STATUT_COMMERCIAL,
  RELATION_TYPES,
  FOURNISSEUR_TYPES,
  HANDICAP_OPTIONS,
  TIER_DOC_TYPES,
  SCORE_THRESHOLDS,
  PRESTATION_TYPES,
  PRESTATION_TYPE_OPTIONS,
  PRESTATION_COLORS,
  PRESTATION_STATUTS,
  FORMATION_WORKFLOW_STEPS,
  COACHING_WORKFLOW_STEPS,
  CONSEIL_WORKFLOW_STEPS,
  WORKFLOW_STEP_COLORS,
  FACTURE_TYPES,
  FACTURE_STATUTS,
  CONDITIONS_PAIEMENT,
  MODES_PAIEMENT,
  TRESORERIE_COLORS,
  QUALITE_THEMES,
  PROCEDURE_STATUTS,
  RECLAMATION_TYPES,
  RECLAMATION_MOTIFS,
  RECLAMATION_GRAVITE,
  RECLAMATION_STATUTS,
  SIGNAL_STATUTS,
  EVALUATION_TYPES,
  EVALUATION_EXEC_STATUTS,
  APPEL_MOTIFS,
  APPEL_STATUTS,
  USER_ROLES_CDC,
  FORMES_JURIDIQUES,
  INDICATEURS_RNQ,
  BOITE_OUTILS_CATEGORIES,
};
