import { reactive } from 'vue';

/**
 * Composable de validation de formulaire.
 * Permet d'afficher une bordure rouge sur les champs obligatoires manquants.
 *
 * Usage :
 *   const { errors, validate, clearError, clearErrors } = useFormValidation()
 *
 *   // Dans le handler submit :
 *   const isValid = validate({ email: email.value, password: password.value })
 *   if (!isValid) return
 *
 *   // Dans le template (prop `invalid` de PrimeVue) :
 *   <InputText :invalid="!!errors.email" @input="clearError('email')" />
 */
export function useFormValidation() {
  const errors = reactive({});

  /**
   * Valide les champs passés en paramètre.
   * @param {Object} rules - Objet { nomChamp: valeur } — valeur falsy = erreur
   * @returns {boolean} true si tous les champs sont valides
   */
  const validate = (rules) => {
    // Réinitialiser les erreurs des champs concernés
    for (const field of Object.keys(rules)) {
      delete errors[field];
    }

    let isValid = true;
    for (const [field, value] of Object.entries(rules)) {
      const valid = typeof value === 'function' ? value() : Boolean(value);
      if (!valid) {
        errors[field] = true;
        isValid = false;
      }
    }
    return isValid;
  };

  /**
   * Efface l'erreur d'un champ spécifique (ex: au moment de la saisie).
   */
  const clearError = (field) => {
    delete errors[field];
  };

  /**
   * Efface toutes les erreurs.
   */
  const clearErrors = () => {
    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
  };

  return { errors, validate, clearError, clearErrors };
}
