export const TEACHER_ONBOARDING = {
  welcome: 0,
  profile: 1,
  club: 2,
  preferences: 3,
  done: 4,
} as const;

export type TeacherOnboardingStep =
  (typeof TEACHER_ONBOARDING)[keyof typeof TEACHER_ONBOARDING];

export function stepToPath(step: number) {
  if (step <= TEACHER_ONBOARDING.welcome) return "/app/teacher/onboarding/welcome";
  if (step === TEACHER_ONBOARDING.profile) return "/app/teacher/onboarding/profile";
  if (step === TEACHER_ONBOARDING.club) return "/app/teacher/onboarding/club";
  if (step === TEACHER_ONBOARDING.preferences) return "/app/teacher/onboarding/preferences";
  return "/app/teacher/onboarding/done";
}

export function nextStep(current: number) {
  return Math.min(current + 1, TEACHER_ONBOARDING.done);
}
