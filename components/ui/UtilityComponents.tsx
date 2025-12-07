
import React from 'react';

export const Card: React.FC<React.ComponentProps<'div'>> = ({ children, className = '', ...props }) => (
  <div className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 ${className}`} {...props}>
    {children}
  </div>
);

export const SectionHeader: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
    <div>
      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const Badge: React.FC<{ children?: React.ReactNode; type?: 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'purple' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10',
    error: 'bg-red-50 text-red-700 border-red-200 ring-red-500/10',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-500/10',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-500/10',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-500/10',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ring-1 ${styles[type]}`}>
      {children}
    </span>
  );
};

export const Input = ({ label, ...props }: React.ComponentProps<'input'> & { label?: string }) => (
  <div className="mb-4">
    {label && <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 ml-1">{label}</label>}
    <input
      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 transition-all shadow-sm"
      {...props}
    />
  </div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: React.ComponentProps<'button'> & { 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  size?: 'sm' | 'md' | 'lg'
}) => {
  const base = "rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// New Switch Component
export const Switch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; label?: string }> = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between cursor-pointer" onClick={() => onChange(!checked)}>
        {label && <span className="text-sm font-medium text-slate-600 select-none">{label}</span>}
        <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${checked ? 'translate-x-5' : ''}`}></div>
        </div>
    </div>
);
