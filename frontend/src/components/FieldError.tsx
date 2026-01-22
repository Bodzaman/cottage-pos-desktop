import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Reusable field error component for displaying inline validation errors
 * with ARIA compliance and consistent styling.
 */

export interface FieldErrorProps {
  children: React.ReactNode;
  id?: string;
}

export function FieldError({ children, id }: FieldErrorProps) {
  if (!children) return null;
  
  return (
    <div 
      id={id}
      className="flex items-center gap-1.5 mt-1.5" 
      role="alert" 
      aria-live="polite"
    >
      <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />
      <span className="text-sm text-red-500 dark:text-red-400">{children}</span>
    </div>
  );
}

// Also export a version that accepts error object from react-hook-form
export interface RHFFieldErrorProps {
  error?: { message?: string };
  id?: string;
}

export function RHFFieldError({ error, id }: RHFFieldErrorProps) {
  if (!error?.message) return null;
  
  return (
    <FieldError id={id}>
      {error.message}
    </FieldError>
  );
}
