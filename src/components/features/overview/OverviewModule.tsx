import React from 'react';
import { 
  Check, 
  Star, 
  ClipboardList, 
  MessageCircle, 
  Clock, 
  CalendarX, 
  Info, 
  FileSpreadsheet, 
  Download, 
  Eye, 
  Calendar 
} from 'lucide-react';

import { Card, Badge, SectionLabel } from '@/components/ui';
import { useHomeworkConfirmation } from '@/hooks';
import { Child } from '@/types';
import { getGradeColor, getGradeLetter } from '@/lib/utils';
import { HOMEWORK_MAP } from '@/lib/mockData';

export interface OverviewModuleProps {
  child: Child;
  setActiveModule: (m: string) => void;
  onOpenPlanner?: (tab: "weekly" | "academic") => void;
}

export const OverviewModule = ({
  child,
  setActiveModule,
  onOpenPlanner,
}: OverviewModuleProps) => {
  // Compute absences count
  const absentCount = child.attendance_log.filter(
    (l) => l.status === "absent",
  ).length;

  const { isConfirmed, handleConfirm, resetConfirmation } = useHomeworkConfirmation(child.id);

  const currentHomework = HOMEWORK_MAP[child.id] || HOMEWORK_MAP["STU-00421"];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Star": return Star;
      case "ClipboardList": return ClipboardList;
      case "MessageCircle": return MessageCircle;
      case "Clock": return Clock;
      case "CalendarX": return CalendarX;
      default: return Info;
    }
  };

  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case "green": return "bg-emerald-50 text-emerald-600";
      case "blue": return "bg-blue-50 text-blue-600";
      case "amber": return "bg-amber-50 text-amber-600";
      case "red": return "bg-red-50 text-red-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Overall Grade
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h2
              className={`text-2xl font-bold ${getGradeColor(child.overallAvg)}`}
            >
              {child.overallAvg}%
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              {getGradeLetter(child.overallAvg)} Grade
            </p>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Attendance
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h2
              className={`text-2xl font-bold ${getGradeColor(child.attendance)}`}
            >
              {child.attendance}%
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              {absentCount} absences this term
            </p>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Assignments Due
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h2 className="text-2xl font-bold text-amber-600">
              {child.assignmentsDue}
            </h2>
            <p className="text-sm text-slate-400 mb-1">this week</p>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Missing Work
          </p>
          <div className="flex items-end gap-2 mt-1">
            <h2
              className={`text-2xl font-bold ${child.missingWork > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {child.missingWork}
            </h2>
            <p className="text-sm text-slate-400 mb-1">
              {child.missingWork === 0 ? "All caught up" : "needs attention"}
            </p>
          </div>
        </Card>
      </div>

      {/* Today's Homework & Messages from Teachers Side-by-Side Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Today's Homework Section */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-none flex flex-col justify-between h-full">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Today's Homework
                </h3>
                <p className="text-[11px] text-slate-400">Please review assigned work and sign off</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50/60 text-indigo-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Tuesday, May 26, 2026
                </span>
                {isConfirmed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wide">
                    Reviewed
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-150 uppercase tracking-wide">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3.5 my-4">
              {currentHomework.map((hw, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/30 transition-colors">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: hw.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 leading-snug">
                      {hw.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700">{hw.subject}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span>{hw.type}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="text-slate-400 font-medium">{hw.dueDate}</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Badge variant={hw.statusVariant}>
                      {hw.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              disabled={isConfirmed}
              onClick={handleConfirm}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer border-none ${
                isConfirmed
                  ? "bg-emerald-600 text-white cursor-default"
                  : "bg-[#3949ab] hover:bg-[#32409a] text-white active:scale-[0.99]"
              }`}
            >
              {isConfirmed ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Confirmed ✓</span>
                </>
              ) : (
                <span>I have reviewed today's homework</span>
              )}
            </button>
            {isConfirmed && (
              <button
                id="reset-homework-conf"
                onClick={() => resetConfirmation()}
                className="text-xs text-slate-400 hover:text-slate-650 underline cursor-pointer mt-1 transition-colors"
              >
                Reset status (for testing)
              </button>
            )}
          </div>
        </div>

        {/* Messages from Teachers */}
        <Card className="h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Messages from Teachers</SectionLabel>
              <button
                onClick={() => setActiveModule("Messages")}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                View all →
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {child.messages.slice(0, 3).map((msg) => (
                <div
                  key={msg.id}
                  className="py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#3949ab] flex items-center justify-center text-xs font-bold shrink-0">
                    {msg.teacherInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-800">
                        {msg.teacherName}
                      </h4>
                      <span className="text-xs text-slate-400">{msg.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {msg.subject}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {msg.preview}
                    </p>
                  </div>
                  {msg.unread && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Recent Notifications</SectionLabel>
            <button
              onClick={() => setActiveModule("Notifications")}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {child.notifications.slice(0, 4).map((notif) => {
              const IconComp = getIconComponent(notif.icon);
              const colorClasses = getColorClasses(notif.color);

              return (
                <div
                  key={notif.id}
                  className="flex items-center gap-3 px-2 py-1"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}
                  >
                    <IconComp size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-405 truncate">
                      {notif.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card className="flex flex-col justify-between h-full bg-white shadow-none">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Schedules & Planners
                </h3>
                <p className="text-[11px] text-slate-400">Access current class and academic calendars</p>
              </div>
              <button
                onClick={() => onOpenPlanner?.("weekly")}
                className="text-xs font-bold text-[#3949ab] hover:underline cursor-pointer"
              >
                Full Schedule →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left Column: Weekly Timetable Grid */}
              <div className="bg-slate-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between hover:border-slate-200/80 hover:bg-slate-50/60 transition-all duration-200">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50/60 border border-indigo-100/40 flex items-center justify-center text-[#3949ab]/85 shrink-0">
                      <FileSpreadsheet size={18} className="stroke-[1.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded-md mb-1">
                        TIMETABLE
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight leading-snug">
                        Class Schedule Rows
                      </h4>
                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                        GRADE {child.grade} • SEC {child.section}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="border-t border-slate-100 pt-3.5 mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenPlanner?.("weekly")}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                  >
                    <Eye size={12} className="stroke-[2]" />
                    <span>View Grid</span>
                  </button>

                  <button
                    onClick={() => onOpenPlanner?.("weekly")}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-transparent transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98] bg-indigo-50 text-[#3949ab] hover:bg-indigo-100/80"
                  >
                    <Download size={12} className="stroke-[2]" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Academic Yearly Calendar */}
              <div className="bg-slate-50/40 rounded-xl border border-slate-100 p-4 flex flex-col justify-between hover:border-slate-200/80 hover:bg-slate-50/60 transition-all duration-200">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50/60 border border-emerald-100/40 flex items-center justify-center text-emerald-600 shrink-0">
                      <Calendar size={18} className="stroke-[1.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 rounded-md mb-1">
                        YEARLY PLAN
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight leading-snug">
                        Academic Calendar
                      </h4>
                      <p className="text-[9px] sm:text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                        12 MASTER LANDMARKS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="border-t border-slate-100 pt-3.5 mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onOpenPlanner?.("academic")}
                    className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                  >
                    <Eye size={12} className="stroke-[2]" />
                    <span>Open Timeline</span>
                  </button>

                  <button
                    onClick={() => onOpenPlanner?.("academic")}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-transparent transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-[0.98] bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80"
                  >
                    <Download size={12} className="stroke-[2]" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
