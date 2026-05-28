/**
 * Returns a 1–2 character uppercase abbreviation for a subject name.
 * Takes the first two characters of the name and uppercases them.
 * For any non-empty string, returns a string of length 1 or 2.
 */
export function getSubjectInitials(subjectName: string): string {
  const letters = subjectName.replace(/[^A-Za-z]/g, '');
  return letters.slice(0, 2).toUpperCase();
}
