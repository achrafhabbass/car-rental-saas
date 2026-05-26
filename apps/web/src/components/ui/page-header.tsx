import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  /**
   * Optional accent word(s) rendered in italic ember at the end of the
   * title — matches the mockup pattern "Bonjour, _Achraf_" / "Flotte
   * _en service_". When set, the title reads `"{title} {emphasis}"`.
   */
  emphasis?: string;
  description?: string;
  /** Eyebrow / kicker shown above the title (uppercase, ember). */
  kicker?: string;
  actions?: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
}

export function PageHeader({
  title,
  emphasis,
  description,
  kicker,
  actions,
  className,
  size = 'md',
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        {kicker && <p className="eyebrow mb-3">{kicker}</p>}
        <h1
          className={cn(
            'font-display font-medium tracking-tight leading-[0.95] text-ink',
            size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {title}{' '}
          {emphasis && <span className="em-ember">{emphasis}</span>}
        </h1>
        {description && (
          <p className="mt-3 text-[15px] text-ink-soft max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  );
}
