import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

// Paper bg, warm beige border, ember ring on focus — matches `.search input`
// in the mockup but scaled for form usage.
const BASE =
  'block w-full rounded-xl bg-paper px-3.5 py-3 text-sm text-ink ' +
  'border border-line placeholder:text-ink-mute ' +
  'transition-shadow focus:outline-none focus:border-ember-500 focus:shadow-[0_0_0_4px_rgba(232,84,42,0.1)] ' +
  'disabled:bg-cream disabled:text-ink-mute disabled:border-line';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(BASE, className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(BASE, 'min-h-[88px] resize-y leading-relaxed', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(BASE, 'pr-9 appearance-none bg-no-repeat', className)}
        style={{
          backgroundImage:
            'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%234B5066%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.6%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E")',
          backgroundPosition: 'right 0.7rem center',
          backgroundSize: '1.1rem',
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-mute"
      >
        {label}
        {required && <span className="text-rose ml-0.5">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-rose">{error}</p>}
    </div>
  );
}
