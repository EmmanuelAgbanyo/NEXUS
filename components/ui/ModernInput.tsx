import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModernInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const ModernInput: React.FC<ModernInputProps> = ({ label, error, icon, className = '', value, id, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;
  const isActive = isFocused || hasValue;
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`relative mb-5 ${className}`}>
      <div className={`relative rounded-xl border transition-all duration-300 bg-white overflow-hidden
        ${error 
          ? 'border-red-300 ring-2 ring-red-100 bg-red-50/10' 
          : isFocused 
            ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-sm bg-indigo-50/5' 
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
        }
      `}>
        <div className="flex items-center px-4 h-14">
          {icon && (
            <span className={`mr-3 transition-colors duration-300 ${isFocused ? 'text-indigo-500' : 'text-slate-400'}`}>
              {icon}
            </span>
          )}
          <div className="relative flex-1 h-full">
            <motion.label
              htmlFor={inputId}
              initial={false}
              animate={{
                y: isActive ? -6 : 0,
                scale: isActive ? 0.75 : 1,
                originX: 0,
                color: error ? '#ef4444' : isFocused ? '#6366f1' : '#64748b'
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute left-0 top-4 pointer-events-none text-slate-500 font-medium truncate w-full select-none"
            >
              {label}
            </motion.label>
            <input
              id={inputId}
              {...props}
              value={value}
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              className="w-full h-full bg-transparent border-none outline-none text-slate-800 text-sm font-semibold pt-5 pb-1 placeholder-transparent"
              placeholder={label} 
            />
          </div>
        </div>
      </div>
      {error && (
        <motion.p 
          id={errorId}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-5 left-1 text-[11px] text-red-500 font-medium flex items-center gap-1"
          role="alert"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};