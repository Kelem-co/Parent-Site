import React, { useState } from 'react';
import { Calendar, BookOpen } from 'lucide-react';

import { Card, Badge } from '@/components/ui';
import { Child } from '@/types';
import { AssignmentEntry } from '@/types/assignment';
import { getGradeBg, getGradeLetter } from '@/lib/utils';

export interface AssignmentsModuleProps {
  child: Child;
}

export function filterAssignments(assignments: AssignmentEntry[], filter: string): AssignmentEntry[] {
  if (filter === "All") return assignments;
  return assignments.filter(a => a.status.toLowerCase() === filter.toLowerCase());
}

export const AssignmentsModule = ({ child }: AssignmentsModuleProps) => {
  const [filter, setFilter] = useState("All");
  const tabs = ["All", "Due", "Submitted", "Graded"];

  const filteredAssignments = filterAssignments(child.assignments, filter);

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 bg-white p-0.5 rounded-lg border border-slate-100 w-full overflow-x-auto no-scrollbar whitespace-nowrap max-w-max">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer border-none ${
              filter === tab
                ? "bg-[#3949ab] text-white shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-700 bg-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filteredAssignments.map((asn) => (
          <div key={asn.id} className="animate-fade-in">
            <Card
              className="p-3 sm:p-3.5 border-l-4 !rounded-l-none"
              style={{ borderLeftColor: asn.subjectColor }}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  <Badge variant="blue">{asn.subject}</Badge>
                  <Badge variant="slate">{asn.type}</Badge>
                </div>
                <Badge
                  variant={
                    asn.status === "graded"
                      ? "emerald"
                      : asn.status === "due"
                        ? "blue"
                        : asn.status === "submitted"
                          ? "amber"
                          : "red"
                  }
                >
                  {asn.status.toUpperCase()}
                </Badge>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 mb-0.5">
                {asn.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-505 mb-2.5 line-clamp-2">
                {asn.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-2.5 border-t border-slate-50">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Calendar size={11} className="text-slate-300" />
                  <span>Due: {asn.dueDate}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <BookOpen size={11} className="text-slate-300" />
                  <span>{asn.subject}</span>
                </div>
                {asn.score !== null && (
                  <div className="flex-1 flex items-center gap-2 sm:gap-3 justify-end">
                    <div className="w-10 sm:w-16 h-1 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-[#3949ab]"
                        style={{
                          width: `${(asn.score / asn.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                      {asn.score} / {asn.maxScore}{" "}
                      <span
                        className={`ml-1 text-[9px] px-1 py-0 rounded ${getGradeBg((asn.score / asn.maxScore) * 100)}`}
                      >
                        {getGradeLetter((asn.score / asn.maxScore) * 100)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
