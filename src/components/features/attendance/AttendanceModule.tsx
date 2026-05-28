import React from 'react';
import { Child } from '@/types';
import { AttendanceView } from './AttendanceView';

export interface AttendanceModuleProps {
  child: Child;
}

export const AttendanceModule = ({ child }: AttendanceModuleProps) => {
  const student = {
    id: child.id,
    name: child.name,
    grade: child.grade,
    section: child.section,
    attendance_log: child.attendance_log,
  };
  return <AttendanceView student={student} />;
};
