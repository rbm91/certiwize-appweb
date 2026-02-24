/**
 * Mapper de champs entre Formation (catalogue) et Projet
 * Centralise la logique de pré-remplissage pour éviter la duplication
 */

import { calculateTTC } from './helpers';

/**
 * Mapping de configuration entre les champs de formation et de projet
 * Structure: { projectField: 'formationField' }
 */
const FIELD_MAPPINGS = {
  // Document 1 : Identification du Projet
  objectifs: 'objc_pedagq',
  public_concerne: 'public_vise',
  duree: 'duree',
  lieu: 'lieu',
  cout: 'tarif',

  // Document 2 : Convention de Formation
  formation: 'titre',
  duree_conv: 'duree',
  dates: 'dates',
  dates_fin: 'dates_fin',
  horaires_debut: 'horaires_debut',
  horaires_fin: 'horaires_fin',
  lieu_conv: 'lieu',
  contenu_forma: 'prgm',          // Programme détaillé
  moyens_pedagq: 'moyens_pedagq',

  // Document 3 : Convocation
  nom_formation: 'titre',
  horaires_convoc_debut: 'horaires_debut',
  horaires_convoc_fin: 'horaires_fin',
  lieu_convoc: 'lieu',
  ref_handicap: 'ref_handi',

  // Document 4 : Livret d'Accueil
  lieu_livret: 'lieu'
};

/**
 * Transformations spéciales pour certains champs
 */
const FIELD_TRANSFORMERS = {
  /**
   * Calcule cout_ht et cout_ttc à partir du tarif
   * @param {Object} formationContent - Contenu de la formation
   * @param {Object} projectForm - Formulaire projet
   */
  tarif: (formationContent, projectForm) => {
    if (formationContent.tarif) {
      projectForm.cout_ht = formationContent.tarif;
      projectForm.cout_ttc = calculateTTC(formationContent.tarif);
    }
  },

  /**
   * Parse les horaires depuis le format texte "09h00 - 17h00" vers des objets Date
   * Gère la rétrocompatibilité avec les anciennes données
   * @param {Object} formationContent - Contenu de la formation
   * @param {Object} projectForm - Formulaire projet
   */
  horaires: (formationContent, projectForm) => {
    // Si les horaires sont déjà au format Date, les utiliser directement
    if (formationContent.horaires_debut instanceof Date && formationContent.horaires_fin instanceof Date) {
      projectForm.horaires_debut = formationContent.horaires_debut;
      projectForm.horaires_fin = formationContent.horaires_fin;
      projectForm.horaires_convoc_debut = formationContent.horaires_debut;
      projectForm.horaires_convoc_fin = formationContent.horaires_fin;
      return;
    }

    // Sinon, parser depuis le format texte si disponible
    const horaireStr = formationContent.horaires;
    if (horaireStr && typeof horaireStr === 'string') {
      const match = horaireStr.match(/(\d{2})h(\d{2})\s*-\s*(\d{2})h(\d{2})/);
      if (match) {
        const today = new Date();
        const debut = new Date(today);
        debut.setHours(parseInt(match[1]), parseInt(match[2]), 0);
        const fin = new Date(today);
        fin.setHours(parseInt(match[3]), parseInt(match[4]), 0);

        projectForm.horaires_debut = debut;
        projectForm.horaires_fin = fin;
        projectForm.horaires_convoc_debut = debut;
        projectForm.horaires_convoc_fin = fin;
      }
    }
  }
};

/**
 * Pré-remplit un formulaire projet à partir d'une formation du catalogue
 *
 * @param {Object} formationContent - Objet content de la formation
 * @param {Object} projectForm - Objet form du projet (sera modifié)
 * @returns {Object} - Formulaire projet mis à jour
 *
 * @example
 * const formation = { content: { titre: 'Formation Vue.js', duree: '2j', ... } };
 * const form = { formation: '', duree_conv: '', ... };
 * prefillProjectFromFormation(formation.content, form);
 * // form.formation === 'Formation Vue.js'
 * // form.duree_conv === '2j'
 */
export const prefillProjectFromFormation = (formationContent, projectForm) => {
  if (!formationContent || !projectForm) {
    console.warn('[FormationFieldMapper] Invalid input');
    return projectForm;
  }

  // Appliquer les mappings simples
  Object.entries(FIELD_MAPPINGS).forEach(([projectField, formationField]) => {
    if (formationContent[formationField]) {
      projectForm[projectField] = formationContent[formationField];
    }
  });

  // Appliquer les transformations spéciales
  Object.entries(FIELD_TRANSFORMERS).forEach(([formationField, transformer]) => {
    if (formationContent[formationField]) {
      transformer(formationContent, projectForm);
    }
  });

  return projectForm;
};

/**
 * Obtient les champs de formation qui seront mappés
 * Utile pour la validation et le debug
 *
 * @returns {Array<string>} - Liste des champs de formation utilisés
 */
export const getRequiredFormationFields = () => {
  const fields = new Set(Object.values(FIELD_MAPPINGS));
  Object.keys(FIELD_TRANSFORMERS).forEach(field => fields.add(field));
  return Array.from(fields);
};

/**
 * Obtient les champs projet qui seront remplis
 *
 * @returns {Array<string>} - Liste des champs projet remplis
 */
export const getMappedProjectFields = () => {
  return Object.keys(FIELD_MAPPINGS);
};

/**
 * Valide qu'une formation contient les champs minimum requis
 *
 * @param {Object} formationContent - Contenu de la formation
 * @returns {Object} - { valid: boolean, missingFields: Array<string> }
 */
export const validateFormationContent = (formationContent) => {
  if (!formationContent) {
    return { valid: false, missingFields: ['content object is null'] };
  }

  // Champs critiques (au minimum un titre)
  const criticalFields = ['titre'];
  const missingCritical = criticalFields.filter(field => !formationContent[field]);

  return {
    valid: missingCritical.length === 0,
    missingFields: missingCritical
  };
};

/**
 * Génère un rapport de mapping pour debug
 *
 * @param {Object} formationContent - Contenu de la formation
 * @returns {Object} - Rapport détaillé du mapping
 */
export const generateMappingReport = (formationContent) => {
  const report = {
    availableFields: [],
    mappedFields: [],
    unmappedFields: [],
    missingFields: []
  };

  if (!formationContent) return report;

  const requiredFields = getRequiredFormationFields();

  // Champs disponibles dans la formation
  report.availableFields = Object.keys(formationContent).filter(key =>
    formationContent[key] !== null && formationContent[key] !== undefined
  );

  // Champs qui seront mappés
  report.mappedFields = requiredFields.filter(field =>
    formationContent[field]
  );

  // Champs de la formation non utilisés
  report.unmappedFields = report.availableFields.filter(field =>
    !requiredFields.includes(field)
  );

  // Champs requis manquants
  report.missingFields = requiredFields.filter(field =>
    !formationContent[field]
  );

  return report;
};

export default {
  prefillProjectFromFormation,
  getRequiredFormationFields,
  getMappedProjectFields,
  validateFormationContent,
  generateMappingReport,
  FIELD_MAPPINGS
};
