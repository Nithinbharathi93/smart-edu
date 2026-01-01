// src/components/ui/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;