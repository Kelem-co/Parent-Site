import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, X } from 'lucide-react';

const REASON_OPTIONS = [
  { value: 'SICKNESS', label: 'Sickness' },
  { value: 'TRANSPORTATION', label: 'Transportation Issue' },
  { value: 'FAMILY_ISSUE', label: 'Family Issue' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'RELIGIOUS', label: 'Religious Observance' },
  { value: 'BEREAVEMENT', label: 'Bereavement' },
  { value: 'OTHER', label: 'Other' },
  { value: 'UNKNOWN', label: 'Unknown' },
];

export interface LogAbsenceModalProps {
  studentName: string;
  attendanceDate: string;
  statusLabel: string;
  initialReason?: string;
  initialNote?: string;
  onClose: () => void;
  onSubmit: (data: {
    reason: string;
    note: string;
  }) => void;
}

export const LogAbsenceModal: React.FC<LogAbsenceModalProps> = ({
  studentName,
  attendanceDate,
  statusLabel,
  initialReason = '',
  initialNote = '',
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState(initialReason);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState('');
  const [isReasonMenuOpen, setIsReasonMenuOpen] = useState(false);

  const selectedReasonLabel = REASON_OPTIONS.find(
    (option) => option.value === reason,
  )?.label;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason) {
      setError('Reason category is required');
      return;
    }
    onSubmit({ reason, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="relative z-10 w-full max-w-[480px] bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Confirm Attendance Reason
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Update the attendance note for {studentName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer border-none"
            >
              <X size={16} />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Attendance Record
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-800">{attendanceDate}</p>
            <p className="text-xs text-slate-500 mt-1">{statusLabel}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Reason Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsReasonMenuOpen((current) => !current)}
                  className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs text-left flex items-center justify-between gap-3 focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all cursor-pointer"
                  aria-expanded={isReasonMenuOpen}
                >
                  <span className={selectedReasonLabel ? 'text-slate-800' : 'text-slate-400'}>
                    {selectedReasonLabel ?? 'Select a reason category...'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-slate-400 transition-transform ${
                      isReasonMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isReasonMenuOpen && (
                  <>
                    <button
                      type="button"
                      aria-label="Close reason category menu"
                      onClick={() => setIsReasonMenuOpen(false)}
                      className="fixed inset-0 z-0 cursor-default"
                    />
                    <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setReason('');
                          setIsReasonMenuOpen(false);
                        }}
                        className="w-full px-3 py-3 text-left text-xs text-slate-500 hover:bg-slate-50 transition-colors border-none bg-transparent cursor-pointer"
                      >
                        Select a reason category...
                      </button>
                      {REASON_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setReason(option.value);
                            setIsReasonMenuOpen(false);
                            if (error) {
                              setError('');
                            }
                          }}
                          className={`w-full px-3 py-3 text-left text-xs transition-colors border-none cursor-pointer ${
                            reason === option.value
                              ? 'bg-indigo-50 text-indigo-700 font-semibold'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {error && (
                <p className="text-[10px] font-medium text-rose-500 mt-1">{error}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Notes / Details
              </label>
              <textarea
                rows={4}
                placeholder="Optional details for the school..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#3949AB]/40 focus:border-[#3949AB] transition-all placeholder:text-slate-400"
              />
            </div>

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
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3949AB] hover:bg-blue-900 text-white cursor-pointer shadow-lg shadow-blue-900/10 transition-all border-none"
              >
                Save Reason
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
