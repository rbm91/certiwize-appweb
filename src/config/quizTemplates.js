/**
 * Quiz Templates & Question Types Configuration
 * Templates Qualiopi prédéfinis pour les quiz de positionnement et d'évaluation
 */

// Types de questions supportés
export const QUESTION_TYPES = {
  mcq: {
    label: 'Choix multiple',
    icon: 'pi pi-list',
    color: '#3B82F6', // blue-500
    description: 'Question avec plusieurs options, une seule bonne réponse',
    hasOptions: true,
    hasCorrectAnswer: false, // Les options marquent is_correct
    hasPoints: true,
  },
  true_false: {
    label: 'Vrai / Faux',
    icon: 'pi pi-check-circle',
    color: '#10B981', // emerald-500
    description: 'Question avec réponse Vrai ou Faux',
    hasOptions: false,
    hasCorrectAnswer: true,
    hasPoints: true,
  },
  free_text: {
    label: 'Texte libre',
    icon: 'pi pi-pencil',
    color: '#F59E0B', // amber-500
    description: 'Réponse ouverte rédigée par le stagiaire',
    hasOptions: false,
    hasCorrectAnswer: false,
    hasPoints: false,
  },
  scale: {
    label: 'Échelle',
    icon: 'pi pi-sliders-h',
    color: '#8B5CF6', // violet-500
    description: 'Évaluation sur une échelle (ex: 1 à 5)',
    hasOptions: false,
    hasCorrectAnswer: false,
    hasPoints: false,
  },
};

// Helper : générer un ID unique pour une question
const qid = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const oid = () => `opt_${Math.random().toString(36).slice(2, 9)}`;

// Templates de quiz prédéfinis
export const QUIZ_TEMPLATES = {
  positioning_quiz: {
    title: 'Quiz de positionnement',
    description: 'Évaluez le niveau initial des stagiaires avant la formation',
    quiz_type: 'positioning_quiz',
    icon: 'pi pi-compass',
    color: '#3B82F6',
    questions: [
      {
        id: qid(),
        type: 'scale',
        text: 'Comment évaluez-vous votre niveau actuel sur le sujet de cette formation ?',
        required: true,
        order: 1,
        points: 0,
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Débutant', max: 'Expert' },
      },
      {
        id: qid(),
        type: 'mcq',
        text: 'Quelle est votre expérience dans ce domaine ?',
        required: true,
        order: 2,
        points: 0,
        options: [
          { id: oid(), text: 'Aucune expérience', is_correct: false },
          { id: oid(), text: 'Quelques notions théoriques', is_correct: false },
          { id: oid(), text: 'Expérience pratique occasionnelle', is_correct: false },
          { id: oid(), text: 'Expérience régulière', is_correct: false },
        ],
      },
      {
        id: qid(),
        type: 'free_text',
        text: 'Quelles sont vos attentes principales pour cette formation ?',
        required: true,
        order: 3,
        points: 0,
        max_length: 500,
      },
      {
        id: qid(),
        type: 'free_text',
        text: 'Avez-vous des besoins spécifiques ou des contraintes particulières ?',
        required: false,
        order: 4,
        points: 0,
        max_length: 500,
      },
      {
        id: qid(),
        type: 'scale',
        text: 'À quel point cette formation est-elle importante pour votre activité professionnelle ?',
        required: true,
        order: 5,
        points: 0,
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Peu importante', max: 'Essentielle' },
      },
    ],
    settings: {
      show_all_at_once: true,
      passing_score: null,
      shuffle_questions: false,
      time_limit_minutes: null,
    },
  },

  evaluation_quiz: {
    title: "Quiz d'évaluation des acquis",
    description: 'Évaluez les connaissances acquises à la fin de la formation',
    quiz_type: 'evaluation_quiz',
    icon: 'pi pi-check-square',
    color: '#10B981',
    questions: [
      {
        id: qid(),
        type: 'mcq',
        text: 'Question 1 : [À personnaliser selon la formation]',
        required: true,
        order: 1,
        points: 2,
        options: [
          { id: oid(), text: 'Réponse A', is_correct: true },
          { id: oid(), text: 'Réponse B', is_correct: false },
          { id: oid(), text: 'Réponse C', is_correct: false },
          { id: oid(), text: 'Réponse D', is_correct: false },
        ],
      },
      {
        id: qid(),
        type: 'true_false',
        text: 'Question 2 : [Affirmation à personnaliser]',
        required: true,
        order: 2,
        points: 1,
        correct_answer: true,
      },
      {
        id: qid(),
        type: 'mcq',
        text: 'Question 3 : [À personnaliser selon la formation]',
        required: true,
        order: 3,
        points: 2,
        options: [
          { id: oid(), text: 'Réponse A', is_correct: false },
          { id: oid(), text: 'Réponse B', is_correct: true },
          { id: oid(), text: 'Réponse C', is_correct: false },
        ],
      },
      {
        id: qid(),
        type: 'true_false',
        text: 'Question 4 : [Affirmation à personnaliser]',
        required: true,
        order: 4,
        points: 1,
        correct_answer: false,
      },
      {
        id: qid(),
        type: 'mcq',
        text: 'Question 5 : [À personnaliser selon la formation]',
        required: true,
        order: 5,
        points: 2,
        options: [
          { id: oid(), text: 'Réponse A', is_correct: false },
          { id: oid(), text: 'Réponse B', is_correct: false },
          { id: oid(), text: 'Réponse C', is_correct: true },
          { id: oid(), text: 'Réponse D', is_correct: false },
        ],
      },
      {
        id: qid(),
        type: 'mcq',
        text: 'Question 6 : [À personnaliser selon la formation]',
        required: true,
        order: 6,
        points: 2,
        options: [
          { id: oid(), text: 'Réponse A', is_correct: true },
          { id: oid(), text: 'Réponse B', is_correct: false },
          { id: oid(), text: 'Réponse C', is_correct: false },
        ],
      },
      {
        id: qid(),
        type: 'true_false',
        text: 'Question 7 : [Affirmation à personnaliser]',
        required: true,
        order: 7,
        points: 1,
        correct_answer: true,
      },
      {
        id: qid(),
        type: 'free_text',
        text: 'Quels sont les points clés que vous retenez de cette formation ?',
        required: true,
        order: 8,
        points: 0,
        max_length: 1000,
      },
    ],
    settings: {
      show_all_at_once: true,
      passing_score: 70,
      shuffle_questions: false,
      time_limit_minutes: null,
    },
  },
};

// Helper pour créer une question vide selon le type
export const createEmptyQuestion = (type, order = 1) => {
  const base = {
    id: qid(),
    type,
    text: '',
    required: true,
    order,
    points: QUESTION_TYPES[type]?.hasPoints ? 1 : 0,
  };

  switch (type) {
    case 'mcq':
      return {
        ...base,
        options: [
          { id: oid(), text: '', is_correct: true },
          { id: oid(), text: '', is_correct: false },
        ],
      };
    case 'true_false':
      return {
        ...base,
        correct_answer: true,
      };
    case 'free_text':
      return {
        ...base,
        max_length: 500,
      };
    case 'scale':
      return {
        ...base,
        scale_min: 1,
        scale_max: 5,
        scale_labels: { min: 'Minimum', max: 'Maximum' },
      };
    default:
      return base;
  }
};

// Helper pour créer une option vide
export const createEmptyOption = () => ({
  id: oid(),
  text: '',
  is_correct: false,
});

// Générer un share token unique (12 caractères alphanumériques)
export const generateShareToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
};

// Calculer le score total possible d'un quiz
export const calculateTotalPoints = (questions) => {
  return questions.reduce((sum, q) => sum + (q.points || 0), 0);
};

// Calculer le score obtenu
export const calculateEarnedPoints = (questions, answers) => {
  let earned = 0;
  for (const question of questions) {
    if (!question.points) continue;
    const answer = answers.find((a) => a.question_id === question.id);
    if (!answer) continue;

    switch (question.type) {
      case 'mcq': {
        const correctOption = question.options?.find((o) => o.is_correct);
        if (correctOption && answer.value === correctOption.id) {
          earned += question.points;
        }
        break;
      }
      case 'true_false':
        if (answer.value === question.correct_answer) {
          earned += question.points;
        }
        break;
      // free_text et scale n'ont pas de scoring automatique
    }
  }
  return earned;
};
