import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use the dark navy hero variant — for the headline KPI tile. */
  hero?: boolean;
}

export function Card({ className, hero, ...props }: CardProps) {
  if (hero) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-grad-navy text-white border border-navy transition-shadow',
          // The two radial blobs are pulled from the mockup's `.stat-hero::before/after`.
          'before:absolute before:-top-2/5 before:-right-1/5 before:w-80 before:h-80 before:pointer-events-none',
          "before:content-[''] before:bg-[radial-gradient(circle,rgba(232,84,42,0.5),transparent_70%)]",
          'after:absolute after:-bottom-1/2 after:-left-[10%] after:w-60 after:h-60 after:pointer-events-none',
          "after:content-[''] after:bg-[radial-gradient(circle,rgba(255,139,92,0.2),transparent_70%)]",
          className,
        )}
        {...props}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-2xl bg-paper border border-line transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-elevated',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 px-7 pt-7 pb-5',
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-2xl font-medium tracking-tight leading-tight text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-7 pb-7', className)} {...props} />;
}
