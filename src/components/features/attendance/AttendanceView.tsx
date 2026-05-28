import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';

import { Student } from '@/types';
import { getDayStatusLabel } from '@/lib/utils';
import { useLogAbsence } from '@/hooks';
import { LogAbsenceModal } from './LogAbsenceModal';

export interface AttendanceViewProps {
  student: Student;
  // Prop to trigger open of Log Absence Modal from parent if needed, or internal state
  showLogAbsenceModal?: boolean;
  onCloseLogAbsenceModal?: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ student }) => {
  const [activePolicyTab, setActivePolicyTab] = useState<'ytd' | 'term2'>('ytd');
  const [calendarMonth, setCalendarMonth] = useState<string>('May 2025');
  const [selectedDayObj, setSelectedDayObj] = useState<{ d: number | null; type: string } | null>(null);
  
  const [showLogAbsenceModal, setShowLogAbsenceModal] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  const logAbsenceMutation = useLogAbsence(student.id ?? '');

  // Student details normalized
  const name = student?.name || "Amir Tesfaye";

  // Hardcoded list of days matching high fidelity HTML calendar
  const calendarDays = [
    { d: null, type: 'empty' }, { d: null, type: 'empty' }, { d: null, type: 'empty' },
    { d: 1,  type: 'present' }, { d: 2,  type: 'present' },
    { d: 3,  type: 'no-school' }, { d: 4,  type: 'no-school' },
    { d: 5,  type: 'present' }, { d: 6,  type: 'present' }, { d: 7,  type: 'present' },
    { d: 8,  type: 'present' }, { d: 9,  type: 'present' },
    { d: 10, type: 'no-school' }, { d: 11, type: 'no-school' },
    { d: 12, type: 'present' }, { d: 13, type: 'present' }, { d: 14, type: 'present' },
    { d: 15, type: 'late' }, { d: 16, type: 'present' },
    { d: 17, type: 'no-school' }, { d: 18, type: 'no-school' },
    { d: 19, type: 'present' }, { d: 20, type: 'present' }, { d: 21, type: 'present' },
    { d: 22, type: 'present' }, { d: 23, type: 'present' },
    { d: 24, type: 'no-school' }, { d: 25, type: 'no-school' },
    { d: 26, type: 'present' }, { d: 27, type: 'present' }, { d: 28, type: 'present' },
    { d: 29, type: 'absent' }, { d: 30, type: 'absent' },
    { d: 31, type: 'no-school' }
  ];

  const currentTermAttendance = student?.termAttendance ?? 97;
  const currentDaysPresent = student?.daysPresent ?? 68;
  const currentTotalDays = student?.totalDays ?? 70;

  return (
    <div className="attendance-module-container">
      {/* Button to open Log Absence modal is triggered by the parent's button if clicked, but let's expose it here as well via local action if needed or state */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowLogAbsenceModal(true)}
          className="px-4 py-2 bg-[#3949AB] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-900/10 cursor-pointer border-none"
        >
          Log Future Absence
        </button>
      </div>

      {/* 3. Stats Grid Row */}
      <div className="attendance-stats-grid">
        <div className="attendance-stat-card blue">
          <div className="attendance-stat-label">Term Attendance</div>
          <div className="attendance-stat-value blue">{currentTermAttendance}%</div>
          <div className="attendance-stat-foot">
            <span className="attendance-delta-up">↑ +1.2%</span> vs last term
          </div>
        </div>
        
        <div className="attendance-stat-card navy">
          <div className="attendance-stat-label">Days Present</div>
          <div className="attendance-stat-value">{currentDaysPresent}</div>
          <div className="attendance-stat-foot">of {currentTotalDays} school days</div>
        </div>

        <div className="attendance-stat-card amber">
          <div className="attendance-stat-label">Absences / Lates</div>
          <div className="attendance-stat-value amber">
            {student?.absences ?? 1} <span className="text-slate-400 font-normal text-sm">/</span> {student?.lates ?? 2}
          </div>
          <div className="attendance-stat-foot flex gap-1.5 mt-0.5">
            <span className="attendance-pill attendance-pill-excused px-1.5 py-0.5 text-[10px] rounded-full">1 Excused</span>
            <span className="attendance-pill attendance-pill-pending px-1.5 py-0.5 text-[10px] rounded-full">1 Pending</span>
          </div>
        </div>

        <div className="attendance-stat-card green">
          <div className="attendance-stat-label">Policy Standing</div>
          <div className="attendance-stat-value green text-lg mt-1 font-bold">On Track</div>
          <div className="attendance-stat-foot text-emerald-600 font-medium">● Active Compliance</div>
        </div>
      </div>

      {/* 4. Two-Column Row (Policy Analytics and YTD Breakdown) */}
      <div className="attendance-two-col">
        {/* Policy Analytics Box */}
        <div className="attendance-card">
          <div className="attendance-card-header">
            <div>
              <div className="attendance-card-title">Policy Analytics</div>
              <div className="attendance-card-subtitle">District standing trackers</div>
            </div>
            
            {/* Interactive Policy Tabs */}
            <div className="attendance-tabs">
              <button 
                onClick={() => setActivePolicyTab('ytd')}
                className={`attendance-tab-btn ${activePolicyTab === 'ytd' ? 'active' : ''}`}
              >
                YTD
              </button>
              <button 
                onClick={() => setActivePolicyTab('term2')}
                className={`attendance-tab-btn ${activePolicyTab === 'term2' ? 'active' : ''}`}
              >
                Term 2
              </button>
            </div>
          </div>
          
          <div className="attendance-card-body">
            {/* Limit Progress Bar 1 */}
            <div className="attendance-progress-item">
              <div className="attendance-progress-header">
                <span className="attendance-progress-label">Unexcused absence limit</span>
                <span className={`attendance-progress-count ${activePolicyTab === 'ytd' ? 'warn' : 'safe'}`}>
                  {activePolicyTab === 'ytd' ? "1 / 5 used" : "1 / 3 used"}
                </span>
              </div>
              <div className="attendance-progress-track">
                <div 
                  className="attendance-progress-fill orange" 
                  style={{ width: activePolicyTab === 'ytd' ? '20%' : '33%' }}
                />
              </div>
              <div className="attendance-progress-note">
                {activePolicyTab === 'ytd' 
                  ? "4 more before mandatory review" 
                  : "2 more before counselor notice"}
              </div>
            </div>

            {/* Limit Progress Bar 2 */}
            <div className="attendance-progress-item mt-4">
              <div className="attendance-progress-header">
                <span className="attendance-progress-label">Total absence threshold</span>
                <span className="attendance-progress-count safe">
                  {activePolicyTab === 'ytd' ? "1 / 10 used" : "1 / 6 used"}
                </span>
              </div>
              <div className="attendance-progress-track">
                <div 
                  className="attendance-progress-fill blue" 
                  style={{ width: activePolicyTab === 'ytd' ? '10%' : '16%' }}
                />
              </div>
              <div className="attendance-progress-note">Well within annual policy limits</div>
            </div>
          </div>
        </div>

        {/* YTD Breakdown Box */}
        <div className="attendance-card">
          <div className="attendance-card-header">
            <div>
              <div className="attendance-card-title font-bold text-slate-800">YTD Breakdown</div>
              <div className="attendance-card-subtitle font-bold text-slate-400">Summary statistics</div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <Clock size={12} className="text-slate-400" />
              <span>Updated June 2025</span>
            </div>
          </div>

          <div className="attendance-card-body">
            {/* Stats matrix grid */}
            <div className="attendance-ytd-grid">
              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Present</div>
                <div className="attendance-ytd-item-value text-slate-800">68</div>
                <div className="attendance-ytd-item-sub green">Active</div>
              </div>
              
              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Absent</div>
                <div className="attendance-ytd-item-value text-red-600">1</div>
                <div className="attendance-ytd-item-sub red">Unexcused</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Days Late</div>
                <div className="attendance-ytd-item-value text-amber-600">2</div>
                <div className="attendance-ytd-item-sub amber">Tardy class</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Early Dismissals</div>
                <div className="attendance-ytd-item-value text-slate-400">0</div>
                <div className="attendance-ytd-item-sub muted">Standard</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Excused Absences</div>
                <div className="attendance-ytd-item-value text-emerald-600">1</div>
                <div className="attendance-ytd-item-sub green">Exempt</div>
              </div>

              <div className="attendance-ytd-item transition-transform hover:scale-[1.02]">
                <div className="attendance-ytd-item-label">Unexcused Pending</div>
                <div className="attendance-ytd-item-value text-rose-500">1</div>
                <div className="attendance-ytd-item-sub red">Req. note</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Calendar Section mapping */}
      <div className="attendance-card attendance-cal-card">
        <div className="attendance-cal-nav">
          <div>
            <div className="attendance-card-title">Calendar — {calendarMonth}</div>
            <div className="attendance-card-subtitle">Programmatic view</div>
          </div>
          <div className="flex gap-1.5">
            <button 
              onClick={() => setCalendarMonth(calendarMonth === 'May 2025' ? 'April 2025' : 'May 2025')}
              className="attendance-cal-nav-btn border-none"
            >
              <ChevronLeft size={14} />
            </button>
            <button 
              onClick={() => setCalendarMonth(calendarMonth === 'May 2025' ? 'June 2025' : 'May 2025')}
              className="attendance-cal-nav-btn border-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="attendance-cal-grid">
          {/* Weekday indicator labels */}
          <div className="attendance-cal-weekdays">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
              <div key={i} className="attendance-cal-wday">{w}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="attendance-cal-days">
            {calendarDays.map((day, idx) => {
              const isSelected = selectedDayObj && selectedDayObj.d === day.d && selectedDayObj.type === day.type;
              
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (day.d !== null) {
                      setSelectedDayObj(isSelected ? null : day);
                    }
                  }}
                  className={`attendance-cal-day ${day.type} cursor-pointer hover:shadow-xs transition-transform ${
                    isSelected ? 'ring-2 ring-blue-900 border-none' : ''
                  }`}
                >
                  <span className="attendance-cal-day-num">{day.d !== null ? day.d : ''}</span>
                  {day.d !== null && day.type !== 'empty' && day.type !== 'no-school' && (
                    <div className="attendance-status-dot" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details Container */}
        <AnimatePresence>
          {selectedDayObj && selectedDayObj.d !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mx-4 mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 relative flex justify-between items-start"
            >
              <div>
                <p className="font-bold text-slate-800">Day {selectedDayObj.d} Details</p>
                <p className="mt-0.5">{getDayStatusLabel(selectedDayObj.d, selectedDayObj.type)}</p>
              </div>
              <button 
                onClick={() => setSelectedDayObj(null)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer font-bold text-sm ml-2.5"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="attendance-cal-legend">
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch present" />
            <span>Present</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch absent" />
            <span>Absent</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch late" />
            <span>Late</span>
          </div>
          <div className="attendance-legend-item">
            <div className="attendance-legend-swatch no-school border border-slate-200" />
            <span>No school</span>
          </div>
        </div>
      </div>

      {/* Modal overlays for Logging absence */}
      <AnimatePresence>
        {showLogAbsenceModal && (
          <LogAbsenceModal
            studentName={name}
            onClose={() => setShowLogAbsenceModal(false)}
            onSubmit={(data) => {
              const displayDate = data.type === 'Multi-Day'
                ? `${data.startDate} to ${data.endDate}`
                : (data.date || 'upcoming date');
              setToast({ show: true, message: `Absence note requested for ${displayDate}` });
              setShowLogAbsenceModal(false);
              setTimeout(() => {
                setToast(null);
              }, 4000);
              logAbsenceMutation.mutate({
                date: data.date ?? data.startDate ?? new Date().toISOString().split('T')[0],
                reason: data.reason,
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* Toast Notification element */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 pointer-events-none"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Check size={14} strokeWidth={2.5} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-white">Action Completed</p>
              <p className="text-[10px] text-slate-400">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceView;
