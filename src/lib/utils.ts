// Backward-compatibility shim — re-exports from canonical utility files.
// All new code should import directly from '@/lib/gradeUtils' or '@/lib/subjectUtils'.
export * from './gradeUtils';
export * from './subjectUtils';

/**
 * Returns a human-readable label for an attendance day status.
 * Used by AttendanceView for tooltip/detail display.
 */
export const getDayStatusLabel = (dayNum: number | null, type: string): string => {
  if (!dayNum) return '';
  switch (type) {
    case 'present': return 'Present — Standard check-in recorded';
    case 'absent': return 'Absent — Unexcused absence. Apply for excuse notes.';
    case 'late': return 'Late — Arrived at 08:32 AM (High traffic queue)';
    case 'no-school': return 'Weekend — AIA Academy Closed';
    default: return 'Day scheduled';
  }
};
