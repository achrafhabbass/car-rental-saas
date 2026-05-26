import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

// Primary = navy rest → ember hover. Mirrors the mockup's `.btn-primary`.
// The ember shadow on hover is the signature visual lift.
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-navy text-white shadow-warm hover:bg-ember-500 hover:-translate-y-0.5 hover:shadow-ember active:translate-y-0',
  secondary:
    'bg-paper text-ink ring-1 ring-line hover:ring-ink hover:-translate-y-0.5 transition-transform',
  ghost: 'bg-transparent text-ink hover:bg-cream-deep',
  // Ember-first when you want the orange to lead (CTAs on the landing).
  accent: 'bg-ember-500 text-white shadow-warm hover:bg-ember-600 hover:shadow-ember',
  danger: 'bg-rose text-white shadow-warm hover:bg-rose/90',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ember-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
      )}
      {children}
    </button>
  );
});
