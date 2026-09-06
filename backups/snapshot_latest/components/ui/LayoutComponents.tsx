import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }> = ({ children, className = '', ...props }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-card border border-secondary/50 dark:border-gray-700 p-6 transition-colors duration-200 ${className}`} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost'; size?: 'sm' | 'default' | 'lg' }> = 
  ({ children, className = '', variant = 'primary', size = 'default', ...props }) => {
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      default: "px-4 py-2",
      lg: "px-6 py-3 text-lg"
    };

    const base = "rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-light shadow-md hover:shadow-lg active:scale-95 dark:bg-primary dark:hover:bg-primary-light",
      outline: "border-2 border-primary text-primary hover:bg-primary/5 active:scale-95 dark:border-primary-light dark:text-primary-light dark:hover:bg-primary/20",
      ghost: "text-foreground hover:bg-secondary active:scale-95 dark:text-gray-200 dark:hover:bg-gray-700"
    };
    
    return (
      <button className={`${base} ${sizeClasses[size || 'default']} ${variants[variant]} ${className}`} {...props}>
        {children}
      </button>
    );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => {
  const { value, ...rest } = props;
  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = { ...rest };
  if (value !== undefined) {
    inputProps.value = value === null ? '' : value;
  }
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-foreground/80 dark:text-gray-300">{label}</label>}
      <input 
        className={`w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 ${className}`} 
        {...inputProps} 
      />
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'green' | 'blue' | 'yellow' | 'red' }> = ({ children, color = 'blue' }) => {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  );
};