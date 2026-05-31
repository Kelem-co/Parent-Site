import { apiClient } from '@/lib/apiClient';
import type { SectionTeacherAssignment } from '@/types/api';

export async function getSectionTeacherAssignments(
  sectionId: string
): Promise<SectionTeacherAssignment[]> {
  const res = await apiClient.get<SectionTeacherAssignment[]>(
    '/api/teacher-assignments/by-section/',
    {
      params: {
        section: sectionId,
      },
    }
  );

  return res.data;
}
