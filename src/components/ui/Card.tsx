import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card = ({
  children,
  className = "",
  style,
}: CardProps) => (
  <div
    className={`bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 sm:p-4 ${className}`}
    style={style}
  >
    {children}
  </div>
);
