export const EXERCISE_TYPES = [
  'Coding',
  'OutputPrediction',
  'MultipleChoice',
  'CodeAnalysis',
  'Refactoring',
  'Debugging',
  'Ordering',
  'FillBlank',
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const VALIDATION_MODES = ['Manual', 'ExactMatch', 'Regex', 'AST', 'UnitTests'] as const;
export type ValidationModeValue = (typeof VALIDATION_MODES)[number];

export const DIFFICULTIES = ['Basic', 'Intermediate', 'Advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type ExerciseSetStatus = 'draft' | 'published';

export const EXERCISE_SET_SIZE = 30;
export const MAXIMUM_MULTIPLE_CHOICE_EXERCISES = 4;
