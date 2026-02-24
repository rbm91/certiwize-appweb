import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const DEFAULT_DOC_TYPES = [
  { code: 'PROGRAMME_FORMATION', nameKey: 'analysis.types.training_program', customName: null },
  { code: 'CONVENTION_FORMATION', nameKey: 'analysis.types.training_convention', customName: null },
  { code: 'CV_FORMATEUR', nameKey: 'analysis.types.trainer_cv', customName: null },
  { code: 'JUSTIFICATIF_COMPETENCES', nameKey: 'analysis.types.skills_proof', customName: null },
  { code: 'REGLEMENT_INTERIEUR', nameKey: 'analysis.types.internal_rules', customName: null },
  { code: 'ANALYSE_DU_BESOIN', nameKey: 'analysis.types.needs_analysis', customName: null },
  { code: 'SCENARIO_PEDAGOGIQUE', nameKey: 'analysis.types.pedagogical_scenario', customName: null },
  { code: 'SUPPORT_FORMATION', nameKey: 'analysis.types.training_material', customName: null },
  { code: 'QUIZ_POSITIONNEMENT', nameKey: 'analysis.types.positioning_quiz', customName: null },
  { code: 'QUIZ_VALIDATION', nameKey: 'analysis.types.validation_quiz', customName: null },
  { code: 'PROCEDURE', nameKey: 'analysis.types.procedure', customName: null },
  { code: 'ORGANIGRAMME', nameKey: 'analysis.types.org_chart', customName: null },
  { code: 'CONTRAT_SOUSTRAITANCE', nameKey: 'analysis.types.subcontracting_contract', customName: null },
  { code: 'CHARTE_QUALITE', nameKey: 'analysis.types.quality_charter', customName: null },
  { code: 'CERTIFICAT_FORMATION', nameKey: 'analysis.types.certificate_formation', customName: null },
  { code: 'QUESTIONNAIRE_SATISFACTION', nameKey: 'analysis.types.satisfaction_survey', customName: null },
];

export const useDocTypesStore = defineStore('docTypes', () => {
  const types = ref(structuredClone(DEFAULT_DOC_TYPES));

  const getDisplayName = (type, t) => {
    if (type.customName) return type.customName;
    return t(type.nameKey);
  };

  const getTypesForDropdown = (t) => {
    return types.value.map(type => ({
      name: getDisplayName(type, t),
      code: type.code,
    }));
  };

  const addType = (name, code) => {
    types.value.push({ code, nameKey: null, customName: name });
  };

  const removeType = (code) => {
    types.value = types.value.filter(t => t.code !== code);
  };

  const updateType = (code, newName) => {
    const type = types.value.find(t => t.code === code);
    if (type) {
      type.customName = newName;
    }
  };

  const resetToDefaults = () => {
    types.value = structuredClone(DEFAULT_DOC_TYPES);
  };

  return {
    types,
    getDisplayName,
    getTypesForDropdown,
    addType,
    removeType,
    updateType,
    resetToDefaults,
  };
}, {
  persist: {
    key: 'certiwize-doc-types',
  }
});
