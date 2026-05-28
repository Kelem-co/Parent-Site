import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "red" | "blue" | "slate";
}

export const Badge = ({
  children,
  variant = "blue",
}: BadgeProps) => {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-800",
    blue: "bg-blue-50 text-blue-800",
    slate: "bg-slate-100 text-slate-600",
  };
  
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
