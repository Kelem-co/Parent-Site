import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  X,
  Download,
  FileText,
  Printer,
} from "lucide-react";
import { motion } from "motion/react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useCurrentCalendarDocument } from "@/hooks";

export interface PlannerModuleProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "weekly" | "academic";
  studentName?: string;
  studentGrade?: string;
  studentSec?: string;
  organizationId?: string;
  branchId?: string;
}

export const PlannerModule: React.FC<PlannerModuleProps> = ({
  isOpen,
  onClose,
  initialTab = "weekly",
  studentName = "Sara Bekele",
  studentGrade = "7",
  studentSec = "A",
  organizationId,
  branchId,
}) => {
  const [activeTab, setActiveTab] = useState<"weekly" | "academic">(initialTab);
  const [selectedGrade, setSelectedGrade] = useState(studentGrade);
  const [selectedSec, setSelectedSec] = useState(studentSec);
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [secDropdownOpen, setSecDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const {
    data: currentCalendarDocument,
    isLoading: isCalendarLoading,
    isError: isCalendarError,
    error: calendarError,
  } = useCurrentCalendarDocument({
    organizationId,
    branchId,
    enabled: isOpen && activeTab === "academic",
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setSelectedGrade(studentGrade);
    setSelectedSec(studentSec);
  }, [studentGrade, studentSec]);

  if (!isOpen) return null;

  const timetable = [
    { period: "P1", time: "08:30 AM - 09:15 AM", slots: { MON: { subject: "Mathematics", room: "R-102" }, TUE: { subject: "English", room: "R-102" }, WED: { subject: "Mathematics", room: "R-102" }, THU: { subject: "English", room: "R-102" }, FRI: { subject: "Chemistry", room: "R-102" } } },
    { period: "P2", time: "09:15 AM - 10:00 AM", slots: { MON: { subject: "Physics", room: "R-102" }, TUE: { subject: "Mathematics", room: "R-102" }, WED: { subject: "Biology", room: "R-102" }, THU: { subject: "Physics", room: "R-102" }, FRI: { subject: "English", room: "R-102" } } },
    { period: "P3", time: "10:00 AM - 10:45 AM", slots: { MON: { subject: "Chemistry", room: "Lab-1" }, TUE: { subject: "Physics", room: "R-102" }, WED: { subject: "Civics", room: "R-102" }, THU: { subject: "Mathematics", room: "R-102" }, FRI: { subject: "Biology", room: "R-102" } } },
    { period: "P4", time: "10:45 AM - 11:30 AM", slots: { MON: { subject: "English", room: "R-102" }, TUE: { subject: "ICT", room: "Comp Lab" }, WED: { subject: "English", room: "R-102" }, THU: { subject: "History", room: "R-102" }, FRI: { subject: "Mathematics", room: "R-102" } } },
    { period: "P5", time: "11:45 AM - 12:30 PM", slots: { MON: { subject: "Biology", room: "R-102" }, TUE: { subject: "History", room: "R-152" }, WED: { subject: "Physics", room: "R-102" }, THU: { subject: "Chemistry", room: "R-102" }, FRI: { subject: "Civics", room: "R-102" } } },
    { period: "P6", time: "12:30 PM - 01:15 PM", slots: { MON: { subject: "Civics", room: "R-102" }, TUE: { subject: "Chemistry", room: "Lab-1" }, WED: { subject: "Social Studies", room: "R-102" }, THU: { subject: "Biology", room: "R-102" }, FRI: { subject: "Geography", room: "R-102" } } },
    { period: "P7", time: "02:00 PM - 02:45 PM", slots: { MON: { subject: "Social Studies", room: "R-101" }, TUE: { subject: "Arts", room: "Art Room" }, WED: { subject: "Chemistry", room: "Lab-1" }, THU: { subject: "ICT", room: "Comp Lab" }, FRI: { subject: "Physical Ed", room: "Field" } } },
    { period: "P8", time: "02:45 PM - 03:30 PM", slots: { MON: { subject: "Physical Ed", room: "Field" }, TUE: { subject: "Study Period", room: "Library" }, WED: { subject: "Guidance", room: "R-102" }, THU: { subject: "Club Activity", room: "Campus" }, FRI: { subject: "Review Session", room: "R-102" } } },
  ];

  const triggerDownloadPDF = async () => {
    if (activeTab === "academic") {
      if (currentCalendarDocument?.downloadUrl) {
        window.open(currentCalendarDocument.downloadUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const element = document.getElementById("printable-document-sheet");
    if (!element) return;
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const fileName = activeTab === "weekly"
        ? `WEEKLY_TIMETABLE_MASTER_GRADE_${selectedGrade}_SEC_${selectedSec}.pdf`
        : `ACADEMIC_CALENDAR_MASTER_GRADE_${selectedGrade}_SEC_${selectedSec}.pdf`;

      const resolveColorToRgb = (colorVal: string): string => {
        try {
          if (!colorVal.includes("oklch") && !colorVal.includes("oklab")) return colorVal;
          const canvas = document.createElement("canvas");
          canvas.width = 1; canvas.height = 1;
          const ctx = canvas.getContext("2d");
          if (!ctx) return colorVal;
          ctx.fillStyle = colorVal;
          ctx.fillRect(0, 0, 1, 1);
          const data = ctx.getImageData(0, 0, 1, 1).data;
          return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
        } catch { return colorVal; }
      };

      const convertModernColorsInString = (str: string): string => {
        if (!str || typeof str !== "string") return str;
        if (!str.includes("oklch") && !str.includes("oklab")) return str;
        return str.replace(/okl(?:ch|ab)\([^)]+\)/g, (match) => resolveColorToRgb(match));
      };

      const originalGetComputedStyle = window.getComputedStyle;
      const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
      const cssRuleDescriptor = Object.getOwnPropertyDescriptor(CSSRule.prototype, "cssText");
      const cssStyleDeclDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "cssText");

      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle.call(this, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === "getPropertyValue") {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                return typeof val === "string" ? convertModernColorsInString(val) : val;
              };
            }
            const value = Reflect.get(target, prop);
            if (typeof value === "function") return value.bind(target);
            return typeof value === "string" ? convertModernColorsInString(value) : value;
          }
        }) as any;
      };

      CSSStyleDeclaration.prototype.getPropertyValue = function(this: CSSStyleDeclaration, property: string) {
        const val = originalGetPropertyValue.call(this, property);
        return typeof val === "string" ? convertModernColorsInString(val) : val;
      };

      if (cssRuleDescriptor?.get) {
        Object.defineProperty(CSSRule.prototype, "cssText", {
          get() { const val = cssRuleDescriptor.get!.call(this); return typeof val === "string" ? convertModernColorsInString(val) : val; },
          configurable: true
        });
      }
      if (cssStyleDeclDescriptor?.get) {
        Object.defineProperty(CSSStyleDeclaration.prototype, "cssText", {
          get() { const val = cssStyleDeclDescriptor.get!.call(this); return typeof val === "string" ? convertModernColorsInString(val) : val; },
          configurable: true
        });
      }

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:absolute;left:-9999px;top:0;width:1024px;background:#fafafa;padding:24px;box-sizing:border-box;";
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.cssText = "width:100%;max-width:none;box-shadow:none;border:none;border-radius:0;";
      clone.querySelector(".no-print")?.remove();
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const PROPS = ["color","backgroundColor","borderColor","borderTopColor","borderBottomColor","borderLeftColor","borderRightColor","outlineColor","textDecorationColor","boxShadow","textShadow","background","backgroundImage"];
      const convertTree = (node: Element) => {
        if (node instanceof HTMLElement) {
          const computed = originalGetComputedStyle.call(window, node);
          PROPS.forEach((prop) => {
            const val = computed[prop as any];
            if (val && (val.includes("oklch") || val.includes("oklab"))) node.style[prop as any] = convertModernColorsInString(val);
          });
        }
        for (let i = 0; i < node.children.length; i++) convertTree(node.children[i]);
      };
      convertTree(clone);
      await new Promise((resolve) => setTimeout(resolve, 150));

      let canvas;
      try {
        canvas = await html2canvas(clone, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", width: 1024 });
      } finally {
        wrapper.parentNode?.removeChild(wrapper);
        window.getComputedStyle = originalGetComputedStyle;
        CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
        if (cssRuleDescriptor) Object.defineProperty(CSSRule.prototype, "cssText", cssRuleDescriptor);
        if (cssStyleDeclDescriptor) Object.defineProperty(CSSStyleDeclaration.prototype, "cssText", cssStyleDeclDescriptor);
      }

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / pdfWidth;
      const calculatedHeight = canvas.height / ratio;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, calculatedHeight <= pdfHeight ? calculatedHeight : pdfHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerPrint = () => {
    if (activeTab === "academic") {
      if (currentCalendarDocument?.downloadUrl) {
        window.open(currentCalendarDocument.downloadUrl, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const originalTitle = document.title;
    document.title = activeTab === "weekly"
      ? `WEEKLY_TIMETABLE_MASTER_GRADE_${selectedGrade}_SEC_${selectedSec}`
      : `ACADEMIC_CALENDAR_MASTER_GRADE_${selectedGrade}_SEC_${selectedSec}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  return (
    <div id="planner-modal-backdrop" className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body > * { display: none !important; }
          #planner-modal-backdrop { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: none !important; backdrop-filter: none !important; padding: 0 !important; margin: 0 !important; display: block !important; z-index: auto !important; overflow: visible !important; }
          #planner-modal-content { border: none !important; box-shadow: none !important; background: transparent !important; max-height: none !important; height: auto !important; overflow: visible !important; display: block !important; width: 100% !important; }
          #planner-modal-header { display: none !important; }
          #printable-document-sheet { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; background: white !important; color: black !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
        }
      `}} />

      <div id="planner-modal-content" className="w-full max-w-5xl bg-slate-50 rounded-none sm:rounded-2xl border-0 sm:border border-slate-200/80 shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-screen sm:max-h-[88vh]">
        <div id="planner-modal-header" className="bg-white text-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-col gap-3 border-b border-slate-200/80 shrink-0 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 text-red-600 border border-red-100 font-extrabold shadow-xs">
                <FileText size={18} className="stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-xs font-black uppercase tracking-wider text-slate-800 truncate">
                  {activeTab === "weekly" ? "WEEKLY_TIMETABLE_MASTER.PDF" : "ACADEMIC_CALENDAR_MASTER.PDF"}
                </h2>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold tracking-wide uppercase leading-none mt-1 font-sans">
                  EGA Academic Portal · Grade Planner
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-850 cursor-pointer transition-all shrink-0" aria-label="Close PDF Viewer">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 sm:border-t-0 sm:pt-0">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 w-full sm:w-auto shrink-0 select-none border border-slate-200/40">
              <button onClick={() => setActiveTab("weekly")} className={`flex-1 sm:flex-initial text-[10px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1.5 sm:py-2 rounded-lg transition-all cursor-pointer ${activeTab === "weekly" ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}>Weekly Grid</button>
              <button onClick={() => setActiveTab("academic")} className={`flex-1 sm:flex-initial text-[10px] sm:text-xs font-bold uppercase tracking-wide px-3 py-1.5 sm:py-2 rounded-lg transition-all cursor-pointer ${activeTab === "academic" ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"}`}>Academic Year</button>
            </div>

            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <button onClick={() => { setGradeDropdownOpen(!gradeDropdownOpen); setSecDropdownOpen(false); }} className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] sm:text-xs font-bold text-slate-700 cursor-pointer uppercase transition-all shadow-xs">
                  <span>GRADE {selectedGrade}</span><ChevronDown size={12} className="text-slate-400" />
                </button>
                {gradeDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 z-50 min-w-[110px] bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-slate-800">
                    {["7", "8", "9", "10"].map((g) => (
                      <button key={g} onClick={() => { setSelectedGrade(g); setGradeDropdownOpen(false); }} className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:text-[#3949ab] hover:bg-indigo-50/55 rounded-md cursor-pointer font-medium">GRADE {g}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1 sm:flex-none">
                <button onClick={() => { setSecDropdownOpen(!secDropdownOpen); setGradeDropdownOpen(false); }} className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] sm:text-xs font-bold text-slate-700 cursor-pointer uppercase transition-all shadow-xs">
                  <span>SEC {selectedSec}</span><ChevronDown size={12} className="text-slate-400" />
                </button>
                {secDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 z-50 min-w-[100px] bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-slate-800">
                    {["A", "B", "C"].map((s) => (
                      <button key={s} onClick={() => { setSelectedSec(s); setSecDropdownOpen(false); }} className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:text-[#3949ab] hover:bg-indigo-50/55 rounded-md cursor-pointer font-medium">SEC {s}</button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={triggerPrint} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] sm:text-xs font-bold text-slate-700 hover:text-[#3949ab] cursor-pointer transition-all shadow-xs">
                <Printer size={12} className="stroke-[2.5]" /><span>PRINT</span>
              </button>
              <button onClick={triggerDownloadPDF} disabled={isDownloading} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-lg text-white text-[11px] sm:text-xs font-extrabold cursor-pointer transition-all shadow-md active:scale-[0.98] ${isDownloading ? "bg-slate-400 cursor-not-allowed opacity-80" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                {isDownloading ? (<><div className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin shrink-0" /><span>GENERATING...</span></>) : (<><Download size={12} className="stroke-[2.5]" /><span>DOWNLOAD PDF</span></>)}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-slate-100/50 p-2 sm:p-5 md:p-8 overflow-y-auto flex items-start justify-center">
          <div id="printable-document-sheet" className="bg-white w-full max-w-4xl rounded-xl p-3 sm:p-6 md:p-8 shadow-md relative overflow-hidden border border-slate-200 text-slate-800 min-h-[500px]">
            <div className="absolute inset-0 opacity-[0.012] pointer-events-none select-none flex items-center justify-center z-0">
              <div className="w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] rounded-full border-[12px] sm:border-[18px] border-slate-800 flex items-center justify-center p-4 sm:p-8">
                <div className="w-full h-full rounded-full border-[4px] sm:border-[6px] border-slate-800 border-dashed flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-[9px] sm:text-xs font-black tracking-widest text-[#1e293b]">EGA ACADEMICS</span>
                  <div className="w-12 sm:w-16 h-[1.5px] sm:h-[2px] bg-slate-800 my-2 sm:my-4" />
                  <span className="font-sans text-[7px] sm:text-[9px] font-bold">OFFICIAL DOCUMENT OF THE REPUBLIC</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 border border-slate-200 rounded-xl bg-slate-50/50 mb-4 sm:mb-6 p-3 sm:p-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
              <div className="flex flex-col justify-center">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-slate-400 leading-none">DOCUMENT CLASS</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">{activeTab === "weekly" ? "WEEKLY CLASS TIMETABLE" : "ACADEMIC YEARLY PLANNER"}</span>
              </div>
              <div className="flex flex-col justify-center pt-1.5 sm:pt-0 sm:pl-4">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-slate-400 leading-none">PROFILE SEGMENT</span>
                <span className="text-xs sm:text-sm font-black text-slate-800 mt-1 uppercase tracking-tight">GRADE {selectedGrade} • SEC {selectedSec}</span>
              </div>
              <div className="flex flex-col justify-center pt-1.5 sm:pt-0 sm:pl-4">
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-slate-400 leading-none">SEAL DATE STAMP</span>
                <span className="font-mono text-[9px] sm:text-xs font-black text-[#1e293b] mt-1">MAY 21, 2026 (00:00 UTC)</span>
              </div>
            </div>

            <div className="relative z-10">
              {activeTab === "weekly" ? (
                <div className="space-y-2">
                  <div className="no-print block md:hidden text-center text-[10px] text-slate-500 font-bold mb-2 uppercase tracking-wide">← Swipe horizontally to view full timetable →</div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs bg-white">
                    <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
                      <thead>
                        <tr className="bg-[#1a237e] text-white text-[10px] font-bold uppercase tracking-wider">
                          <th className="p-3 text-center w-[90px] border-r border-[#151c6c]">PERIOD</th>
                          <th className="p-3 w-[150px] border-r border-[#151c6c]">TIME SLOT</th>
                          <th className="p-3 text-center border-r border-[#151c6c]">MON</th>
                          <th className="p-3 text-center border-r border-[#151c6c]">TUE</th>
                          <th className="p-3 text-center border-r border-[#151c6c]">WED</th>
                          <th className="p-3 text-center border-r border-[#151c6c]">THU</th>
                          <th className="p-3 text-center">FRI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium bg-white">
                        {timetable.map((row) => (
                          <tr key={row.period} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-900 border-r border-slate-100 bg-slate-50/40 w-[90px]">{row.period}</td>
                            <td className="p-3 text-[10px] font-bold text-slate-450 font-mono border-r border-slate-100 w-[150px] whitespace-nowrap">{row.time}</td>
                            {["MON", "TUE", "WED", "THU", "FRI"].map((day) => {
                              const slot = row.slots[day as keyof typeof row.slots];
                              return (
                                <td key={day} className="p-3 text-center border-r border-slate-100 last:border-r-0 min-w-[100px]">
                                  {slot ? (<div className="space-y-0.5"><div className="font-extrabold text-[#1a237e] text-[11px] leading-snug sm:text-xs">{slot.subject}</div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">{slot.room}</div></div>) : (<span className="text-slate-300">—</span>)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#1a237e] text-white p-2.5 sm:p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">ACADEMIC LANDMARKS & TEST SCHEDULES</span>
                    <span className="text-[9px] sm:text-[10px] font-mono font-bold rounded-full bg-white/10 px-3 py-0.5 sm:py-1">
                      CURRENT PDF
                    </span>
                  </div>
                  <div className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
                    {isCalendarLoading && (
                      <div className="p-6 text-sm font-medium text-slate-500">
                        Loading current academic calendar...
                      </div>
                    )}
                    {isCalendarError && (
                      <div className="p-6 text-sm font-medium text-red-700 bg-red-50/60">
                        {calendarError?.message ?? "Failed to load the current academic calendar."}
                      </div>
                    )}
                    {!isCalendarLoading && !isCalendarError && !currentCalendarDocument?.downloadUrl && (
                      <div className="p-6 text-sm font-medium text-slate-500">
                        No current academic calendar document is available for this branch.
                      </div>
                    )}
                    {!isCalendarLoading && !isCalendarError && currentCalendarDocument?.downloadUrl && (
                      <div className="space-y-4 p-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Current Document
                          </p>
                          <h3 className="mt-1 text-sm font-bold text-slate-800 break-all">
                            {currentCalendarDocument.fileName ?? "Academic Calendar PDF"}
                          </h3>
                        </div>
                        <iframe
                          title="Academic Calendar PDF"
                          src={currentCalendarDocument.downloadUrl}
                          className="h-[70vh] min-h-[480px] w-full rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-10 border-t border-slate-200 pt-5 mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between text-[8px] sm:text-[9px] text-[#2ebd9b] md:text-slate-400 font-bold uppercase tracking-wider gap-3">
              <div className="text-center sm:text-left">
                <span>VERIFY AUTHENTICITY: EGA PUBLISHING PORTAL</span>
                <span className="block text-[7px] sm:text-[8px] mt-0.5 text-slate-400">HASH KEY: e98af4be15b13aa4d209117cf6d99723a1</span>
              </div>
              <div className="text-center sm:text-right font-mono text-slate-400/90"><span>PAGES: 01 OF 01</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
