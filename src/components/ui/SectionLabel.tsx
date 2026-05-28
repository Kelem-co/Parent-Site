import React from 'react';

export interface SectionLabelProps {
  children: React.ReactNode;
}

export const SectionLabel = ({ children }: SectionLabelProps) => (
  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
    {children}
  </h3>
);
