import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn('min-w-full divide-y divide-line-soft text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function Thead(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  // Warm cream-deep band — the editorial alternative to a hard grey row.
  return <thead className="bg-cream-deep/50" {...props} />;
}

export function Tbody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className="divide-y divide-line-soft" {...props} />;
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  // Hover tints with a faint ember wash.
  return (
    <tr
      className={cn('hover:bg-ember-50/50 transition-colors', className)}
      {...props}
    />
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-mute',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-5 py-4 text-sm text-ink whitespace-nowrap', className)}
      {...props}
    />
  );
}

type BadgeTone =
  | 'slate'
  | 'green'
  | 'amber'
  | 'red'
  | 'blue'
  | 'indigo'
  | 'cyan'
  | 'violet'
  | 'ember';

export function Badge({
  children,
  tone = 'slate',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  // Pill with tone-paired bg and text — warm by default. The legacy
  // tone names (slate/blue/indigo/cyan/violet) are kept so existing
  // call-sites stay valid; they get sensible warm equivalents.
  const tones: Record<BadgeTone, string> = {
    slate: 'bg-cream-deep text-ink-soft',
    green: 'bg-emerald-soft text-emerald',
    amber: 'bg-amber-soft text-amber',
    red: 'bg-rose-soft text-rose',
    blue: 'bg-sky-soft text-sky',
    indigo: 'bg-sky-soft text-sky',
    cyan: 'bg-sky-soft text-sky',
    violet: 'bg-rose-soft text-rose',
    ember: 'bg-ember-100 text-ember-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
