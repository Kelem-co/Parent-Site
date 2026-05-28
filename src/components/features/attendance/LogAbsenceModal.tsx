import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Upload, FileText } from 'lucide-react';

export interface LogAbsenceModalProps {
  studentName: string;
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    fromTime?: string;
    toTime?: string;
    reason: string;
    notes: string;
    notifyTeacher: boolean;
    fileName?: string;
  }) => void;
}

export const LogAbsenceModal: React.FC<LogAbsenceModalProps> = ({ studentName, onClose, onSubmit }) => {
  const [type, setType] = useState<'Full Day' | 'Partial Day' | 'Multi-Day'>('Full Day');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [notifyTeacher, setNotifyTeacher] = useState(true);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (type === 'Multi-Day') {
      if (!startDate) {
        newErrors.startDate = 'Start date is required';
      } else {
        const sDate = new Date(startDate);
        if (sDate < today) {
          newErrors.startDate = 'Start date cannot be in the past';
        }
      }

      if (!endDate) {
        newErrors.endDate = 'End date is required';
      } else if (startDate && new Date(endDate) <= new Date(startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    } else {
      if (!date) {
        newErrors.date = 'Date is required';
      } else {
        const selectedDate = new Date(date);
        if (selectedDate < today) {
          newErrors.date = 'Date cannot be in the past';
        }
      }

      if (type === 'Partial Day') {
        if (!fromTime) newErrors.fromTime = 'Start time is required';
        if (!toTime) newErrors.toTime = 'End time is required';
      }
    }

    if (!reason) {
      newErrors.reason = 'Reason category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        type,
        date: type !== 'Multi-Day' ? date : undefined,
        startDate: type === 'Multi-Day' ? startDate : undefined,
        endDate: type === 'Multi-Day' ? endDate : undefined,
        fromTime: type === 'Partial Day' ? fromTime : undefined,
        toTime: type === 'Partial Day' ? toTime : undefined,
        reason,
        notes,
        notifyTeacher,
        fileName: fileName || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
      />

      {/* Modal Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-[480px] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] text-slate-800 z-10 flex flex-col scrollbar-thin"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Log Future Absence</h2>
              <p className="text-xs text-slate-400 mt-1">
                Schedule an upcoming absence for {studentName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer border-none"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Absence Type Radio Group */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Absence Type
              </label>
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1.5">
                {(['Full Day', 'Partial Day', 'Multi-Day'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setErrors({});
                    }}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border-none ${
                      type === t
                        ? 'bg-[#3949AB] text-white shadow-md shadow-blue-900/10'
                        : 'text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Picker Fields */}
            {type === 'Multi-Day' ? (
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: '' }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                  />
                  {errors.startDate && (
                    <p className="text-[10px] font-medium text-rose-500 mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: '' }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                  />
                  {errors.endDate && (
                    <p className="text-[10px] font-medium text-rose-500 mt-1">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                  }}
                  className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                />
                {errors.date && (
                  <p className="text-[10px] font-medium text-rose-500 mt-1">
                    {errors.date}
                  </p>
                )}
              </div>
            )}

            {/* Time Pickers for Partial Day */}
            {type === 'Partial Day' && (
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    From Time
                  </label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={(e) => {
                      setFromTime(e.target.value);
                      if (errors.fromTime) setErrors((prev) => ({ ...prev, fromTime: '' }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                  />
                  {errors.fromTime && (
                    <p className="text-[10px] font-medium text-rose-500 mt-1">
                      {errors.fromTime}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    To Time
                  </label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={(e) => {
                      setToTime(e.target.value);
                      if (errors.toTime) setErrors((prev) => ({ ...prev, toTime: '' }));
                    }}
                    className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                  />
                  {errors.toTime && (
                    <p className="text-[10px] font-medium text-rose-500 mt-1">
                      {errors.toTime}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reason Category Select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Reason Category
              </label>
              <select
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
                }}
                className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
              >
                <option value="">Select a reason category...</option>
                <option value="Medical / Health">Medical / Health</option>
                <option value="Family Emergency">Family Emergency</option>
                <option value="Religious Observance">Religious Observance</option>
                <option value="Travel">Travel</option>
                <option value="Other">Other</option>
              </select>
              {errors.reason && (
                <p className="text-[10px] font-medium text-rose-500 mt-1">
                  {errors.reason}
                </p>
              )}
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Notes / Details
              </label>
              <textarea
                rows={3}
                placeholder="Optional details for the school..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Notify Teacher Toggle Switch */}
            <div className="flex items-center justify-between py-1.5 px-0.5">
              <span className="text-xs font-semibold text-slate-650">
                Notify class teacher automatically
              </span>
              <button
                type="button"
                onClick={() => setNotifyTeacher(!notifyTeacher)}
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 cursor-pointer border-none ${
                  notifyTeacher ? 'bg-[#3949AB]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    notifyTeacher ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Supporting Document File Upload */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Supporting Document
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
              />
              {!fileName ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/50 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50"
                >
                  <Upload size={18} className="text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-600">Attach a document (optional)</span>
                  <span className="text-[10px] text-slate-400 mt-1">Accepts: PDF, JPG, PNG</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-blue-600 shrink-0" />
                    <span className="text-xs text-slate-700 truncate font-semibold">{fileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFileName('')}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer border-none"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 bg-transparent hover:bg-slate-50 cursor-pointer transition-all border-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3949AB] hover:bg-blue-900 text-white cursor-pointer shadow-lg shadow-blue-900/10 hover:scale-[1.01] active:scale-[0.99] transition-all border-none"
              >
                Submit Absence
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
