import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  id: string | number;
  label: string;
  description?: string;
}

interface ProfessionalDropdownProps {
  label?: string;
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const ProfessionalDropdown: React.FC<ProfessionalDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = id || `dropdown-${Math.random().toString(36).substr(2, 9)}`;

  // Loose matching to support both ID and exact label string matches
  const selectedOption = options.find(o => o.id === value || o.label === value); 

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label id={`${dropdownId}-label`} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <motion.button
        id={dropdownId}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={label ? `${dropdownId}-label` : undefined}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 rounded-md border text-left transition-all duration-200 flex items-center justify-between
          ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-300 hover:border-indigo-400'}
          bg-white text-sm
        `}
        type="button"
      >
        <span className={`block truncate ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden max-h-60 overflow-y-auto"
            role="listbox"
            aria-labelledby={label ? `${dropdownId}-label` : undefined}
          >
            {options.map((option) => (
              <button
                key={option.id}
                role="option"
                aria-selected={value === option.id || value === option.label}
                onClick={() => {
                  // If the parent expects the label (e.g., Enum string), pass label if id matches label, else id
                  onChange(option.id); 
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-indigo-50 transition-colors
                   ${(value === option.id || value === option.label) ? 'bg-indigo-50/50 text-indigo-700' : 'text-slate-700'}
                `}
                type="button"
              >
                 <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    {option.description && <span className="text-[10px] text-slate-400">{option.description}</span>}
                 </div>
                 {(value === option.id || value === option.label) && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-4 h-4 text-indigo-600" />
                    </motion.div>
                 )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};