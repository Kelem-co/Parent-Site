/**
 * Grade utility functions for computing color classes, background classes,
 * letter grades, and progress bar colors from numeric scores.
 */

/**
 * Returns a Tailwind text-color class for a numeric score.
 * Tiers: ≥75 → emerald, ≥50 → amber, <50 → red
 */
export function getGradeColor(score: number): string {
  if (score >= 75) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

/**
 * Returns Tailwind bg+text+border classes for a numeric score.
 * Tiers match getGradeColor exactly.
 */
export function getGradeBg(score: number): string {
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-red-50 text-red-700 border-red-100";
}

/**
 * Returns a letter grade for a numeric score.
 * ≥90→A, ≥80→B, ≥70→C, ≥60→D, <60→F
 */
export function getGradeLetter(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/**
 * Returns Tailwind text+bg+border classes using a finer 4-tier scale.
 * Used by AnalyticsModule for its grade color display.
 * ≥85→emerald, ≥70→indigo, ≥55→amber, <55→rose
 */
export function getGradeColorClass(score: number): string {
  if (score >= 85) return "text-emerald-600 bg-emerald-50 border-emerald-100";
  if (score >= 70) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  if (score >= 55) return "text-amber-600 bg-amber-50 border-amber-100";
  return "text-rose-600 bg-rose-50 border-rose-100";
}

/**
 * Returns a Tailwind bg class for progress bars.
 * ≥85→emerald-500, ≥70→indigo-500, ≥55→amber-500, <55→rose-500
 */
export function getProgressBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-indigo-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-rose-500";
}
