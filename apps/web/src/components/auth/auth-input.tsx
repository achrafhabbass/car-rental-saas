'use client';

import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  hint?: ReactNode;
  error?: string;
  togglePassword?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput(
  { label, icon: Icon, hint, error, type = 'text', togglePassword, id, className, required, ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputType = togglePassword ? (show ? 'text' : 'password') : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
      >
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <div
        className={cn(
          'group relative flex items-center rounded-xl bg-white ring-1 transition-all duration-200',
          error
            ? 'ring-red-300 focus-within:ring-2 focus-within:ring-red-400'
            : 'ring-slate-200 hover:ring-slate-300 focus-within:ring-2 focus-within:ring-primary-500/60 focus-within:shadow-[0_0_0_4px_rgba(27,58,107,0.08)]',
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              'absolute left-3.5 h-4 w-4 transition-colors',
              error ? 'text-red-400' : 'text-slate-400 group-focus-within:text-primary-500',
            )}
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={id}
          type={inputType}
          required={required}
          className={cn(
            'w-full bg-transparent py-3 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none',
            Icon ? 'pl-10' : 'pl-3.5',
            togglePassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {togglePassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            className="absolute right-3 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
});
