import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  ChevronLeft, 
  Phone, 
  MoreVertical, 
  CheckCheck, 
  Send, 
  X, 
  Mail, 
  Clock, 
  User 
} from 'lucide-react';

import { Child } from '@/types';
import { useMessageThreads } from '@/hooks';

export interface MessagesModuleProps {
  child: Child;
  activeThread: number;
  setActiveThread: (i: number) => void;
}

export const MessagesModule = ({
  child,
  activeThread,
  setActiveThread,
}: MessagesModuleProps) => {
  const { threads, selectedIdx, setSelectedIdx, replyText, setReplyText, handleSend, filteredThreads, searchTerm, setSearchTerm } = useMessageThreads();
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [showRightSidebar, setShowRightSidebar] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1280 : false,
  );

  const currentMsg = threads[selectedIdx];

  return (
    <div className="flex h-full w-full bg-white overflow-hidden">
      {/* Thread List Sidebar / Pane */}
      <div
        className={`w-full md:w-[280px] lg:w-[320px] shrink-0 border-r border-slate-100 flex flex-col bg-white ${mobileView === "list" ? "flex" : "hidden md:flex"}`}
      >
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-sans text-slate-900 tracking-tight">
              Messages
            </h2>
            <span className="bg-[#3949AB] text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
              2 new
            </span>
          </div>
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-55 hover:bg-slate-100/50 focus:bg-white border border-slate-100/85 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:outline-none focus:ring-1 focus:ring-[#3949ab] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 select-none">
          {filteredThreads.map((msg, i) => {
            const actualIndex = threads.findIndex((t) => t.id === msg.id);
            const isActive = selectedIdx === actualIndex;
            return (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedIdx(actualIndex);
                  setActiveThread(actualIndex);
                  setMobileView("thread");
                }}
                className={`py-4.5 px-5 cursor-pointer hover:bg-slate-50 transition-all flex items-start gap-3.5 relative ${isActive ? "bg-[#f4f6fc]/55 border-l-[3.5px] border-[#3949ab]" : "bg-white"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-11 h-11 rounded-full ${msg.avatarBg} text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0 tracking-wide`}
                >
                  {msg.teacherInitials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5 gap-1.5">
                    <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">
                      {msg.teacherName}
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {msg.time}
                    </span>
                  </div>

                  {/* Student upper pill string */}
                  <p className="text-[10px] font-black tracking-wider text-indigo-600/90 gap-1 flex items-center uppercase mb-0.5">
                    <User size={10} className="stroke-[3]" /> {msg.studentName}
                  </p>

                  <p className="text-xs text-slate-550 font-medium truncate tracking-tight">
                    {msg.preview}
                  </p>
                </div>

                {/* Right status icon */}
                <div className="shrink-0 self-center pl-1.5">
                  {msg.unread ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#3949ab] shadow-xs" />
                  ) : (
                    <CheckCheck
                      size={14}
                      className="text-emerald-500 stroke-[2.5]"
                    />
                  )}
                </div>
              </div>
            );
          })}

          {filteredThreads.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No matching conversations found
            </div>
          )}
        </div>
      </div>

      {/* Middle Chat Panel */}
      <div
        className={`flex-1 flex flex-col bg-[#FAF9F6]/40 h-full relative ${mobileView === "thread" ? "flex" : "hidden md:flex"}`}
      >
        <div className="p-4.5 sm:p-5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden p-2 -ml-2 text-[#3949ab] hover:bg-slate-100 rounded-xl mr-0.5 border-none bg-transparent"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <div
              className={`w-11 h-11 rounded-full ${currentMsg?.avatarBg || "bg-blue-100"} text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0`}
            >
              {currentMsg?.teacherInitials}
            </div>
            <div 
              onClick={() => setShowRightSidebar(!showRightSidebar)} 
              className="min-w-0 cursor-pointer select-none hover:opacity-80 transition-opacity"
            >
              <h4 className="text-base font-bold text-slate-900 truncate leading-tight">
                {currentMsg?.teacherName}
              </h4>

              {/* Subject capsule & detail class */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="bg-indigo-50/70 text-[#3949ab] text-[10px] text-xs font-black tracking-wide px-2 py-0.5 rounded-md border border-indigo-100/30">
                  {currentMsg?.subject}
                </span>
                <span className="text-[11px] font-bold text-slate-405">·</span>
                <span className="text-[11px] font-bold text-slate-505">
                  {currentMsg?.gradeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border border-slate-205 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-transparent border-none">
              <Phone size={15} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setShowRightSidebar(!showRightSidebar)}
              className="w-10 h-10 rounded-full border border-slate-205 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-808 transition-all cursor-pointer bg-transparent border-none"
            >
              <MoreVertical size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Chat Threads Box */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 relative bg-slate-50/15">
          {currentMsg?.thread.map((block, blockIdx) => (
            <div key={blockIdx} className="space-y-5">
              {/* Centered Date Separator */}
              <div className="flex items-center justify-center">
                <span className="bg-slate-100/75 border border-slate-200/20 text-[#3949ab]/90 text-[10px] sm:text-[11px] font-black tracking-widest uppercase px-3.5 py-1 rounded-full">
                  {block.dateGroup}
                </span>
              </div>

              {/* Messages Inside block group */}
              {block.messages.map((chat, chatIdx) => {
                const isTeacher = chat.sender === "teacher";
                return (
                  <div
                    key={chatIdx}
                    className={`flex ${isTeacher ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`flex items-end gap-2.5 max-w-[85%] ${isTeacher ? "flex-row" : "flex-row-reverse"}`}
                    >
                      {/* Small Teacher Avatar indicator beside bubble */}
                      {isTeacher && (
                        <div
                          className={`w-7 h-7 rounded-full ${currentMsg.avatarBg} text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-xs mb-1.5`}
                        >
                          {currentMsg.teacherInitials}
                        </div>
                      )}

                      <div
                        className={`space-y-1 ${isTeacher ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`px-4.5 py-3 rounded-2xl text-sm leading-relaxed font-semibold transition-all shadow-2xs ${
                            isTeacher
                              ? "bg-slate-100/75 text-slate-800 rounded-bl-none border border-slate-200/30"
                              : "bg-[#3949ab] text-white rounded-br-none"
                          }`}
                        >
                          {chat.text}
                        </div>

                        {/* Bubble Footer status info */}
                        <div className="flex items-center gap-1.5 px-1.5">
                          <span className="text-[10px] text-slate-400 font-bold">
                            {chat.time}
                          </span>
                          {!isTeacher && (
                            <span className="flex items-center text-emerald-500">
                              <CheckCheck size={11} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Message Input reply section */}
        <form
          onSubmit={handleSend}
          className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
        >
          <div className="flex-1 flex items-center gap-2 bg-[#FAF9F6] border border-slate-200/50 hover:border-slate-305 px-4 py-2.5 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#3949ab]/15 transition-all">
            <textarea
              placeholder={`Reply to ${currentMsg?.teacherName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm font-semibold resize-none h-6 outline-none"
            />
            <button
              type="submit"
              className="bg-[#3949ab] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xs border-none cursor-pointer flex items-center justify-center shrink-0"
            >
              <Send size={14} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>

      {/* Right Profiles / Info Pane backdrop for mobile */}
      {showRightSidebar && (
        <div
          onClick={() => setShowRightSidebar(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden animate-fade-in"
        />
      )}

      {/* Right Profiles / Info Pane */}
      <div
        className={`
        w-[300px] border-l border-slate-100 p-6 pb-20 md:pb-6 overflow-y-auto flex-col bg-white shrink-0 transition-all duration-300
        fixed top-0 bottom-16 md:bottom-0 right-0 z-50 shadow-2xl xl:shadow-none xl:static xl:flex
        ${showRightSidebar ? "flex translate-x-0" : "hidden xl:flex"}
      `}
      >
        <div className="flex flex-col items-center text-center w-full">
          {/* Header with Title and Close button */}
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Teacher
            </span>
            <button
              onClick={() => setShowRightSidebar(false)}
              className="xl:hidden p-1.5 -mr-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer max-h-8 max-w-8 flex items-center justify-center border-none bg-transparent"
              type="button"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div
            className={`w-16 h-16 rounded-full ${currentMsg?.avatarBg} text-white flex items-center justify-center text-xl font-bold mb-3 shadow-md border-4 border-slate-50`}
          >
            {currentMsg?.teacherInitials}
          </div>

          <h3 className="text-base font-bold text-slate-900 leading-tight">
            {currentMsg?.teacherName}
          </h3>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            {currentMsg?.subject} Teacher
          </p>

          {/* Grade Badge */}
          <span className="inline-block mt-2.5 text-[11px] font-black text-[#3949ab]/90 bg-indigo-50/70 px-3 py-1 rounded-full uppercase tracking-wide border border-indigo-100/30">
            {currentMsg?.gradeLabel}
          </span>

          <div className="w-full h-px bg-slate-100 my-5" />

          {/* Contacts list */}
          <div className="w-full space-y-3.5 text-left border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
              <Phone
                size={14}
                className="text-slate-400 shrink-0"
                strokeWidth={2}
              />
              <span>{currentMsg?.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold min-w-0">
              <Mail
                size={14}
                className="text-slate-400 shrink-0"
                strokeWidth={2}
              />
              <span className="truncate">{currentMsg?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-705 font-bold">
              <Clock
                size={14}
                className="text-slate-400 shrink-0"
                strokeWidth={2}
              />
              <span className="text-slate-550 font-bold">
                {currentMsg?.focusStudent
                  ? currentMsg.hours
                  : "Available 9AM - 4PM"}
              </span>
            </div>
          </div>

          {/* Focus Child detailed breakdown panel */}
          {currentMsg?.focusStudent && (
            <div className="w-full text-left pt-5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4.5">
                Focus Student
              </span>

              <div className="flex items-center gap-3 p-3 bg-slate-50/60 border border-slate-100/70 rounded-2xl">
                <div
                  className={`w-11 h-11 rounded-full ${currentMsg.focusStudent.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ring-2 ring-white`}
                >
                  {currentMsg.focusStudent.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentMsg.focusStudent.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {currentMsg.focusStudent.id}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-extrabold text-[#3949ab] bg-indigo-50/70 border border-indigo-100/10 px-2 py-0.5 rounded-md uppercase">
                    {currentMsg.focusStudent.grade}
                  </span>
                </div>
              </div>

              {/* Academic Snapshot progress display */}
              <div className="my-5 space-y-3.5 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 bg-white text-left">
                  Academic Snapshot
                </span>

                {/* Overall Avg */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 font-bold tracking-tight uppercase">
                      Overall Avg
                    </span>
                    <span className="text-amber-600 font-bold">
                      {currentMsg.focusStudent.avg}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${currentMsg.focusStudent.avgVal}%` }}
                    />
                  </div>
                </div>

                {/* Tasks Done */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 font-bold tracking-tight uppercase">
                      Tasks Done
                    </span>
                    <span className="text-[#3949ab] font-black">
                      {currentMsg.focusStudent.tasks}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#3949ab] rounded-full transition-all duration-500"
                      style={{ width: `${currentMsg.focusStudent.tasksVal}%` }}
                    />
                  </div>
                </div>

                {/* Engagement */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 font-bold tracking-tight uppercase">
                      Engagement
                    </span>
                    <span className="text-emerald-600 font-black">
                      {currentMsg.focusStudent.engagement}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${currentMsg.focusStudent.engagementVal}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Homework scores panel */}
              <div className="pt-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
                  Recent Homework
                </span>
                <div className="space-y-2">
                  {currentMsg.focusStudent.homework.map((hw, hwIdx) => (
                    <div
                      key={hwIdx}
                      className="flex items-center justify-between py-1 border-b border-dashed border-slate-100/50 text-xs"
                    >
                      <span className="text-slate-550 font-semibold truncate max-w-[150px]">
                        {hw.title}
                      </span>
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-md ${hw.color}`}
                      >
                        {hw.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
