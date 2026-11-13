'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardSelectProps {
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  recommended?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CardSelect({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
  recommended = false,
  disabled = false,
  className,
}: CardSelectProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={cn(
        'relative flex min-h-48 w-full flex-col items-start rounded-2xl border p-6 text-left transition-all cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',

        selected
          ? 'border-primary bg-primary/2 border-[1.5px]'
          : 'border-border bg-background hover:border-primary',

        className,
      )}
    >
      {/* Recommendation */}
      {recommended && (
        <span
          className={cn(
            'absolute right-5 top-5',
            'rounded-full bg-primary/10',
            'pr-4 pl-3 py-1.5',
            'text-xs font-medium text-primary',
          )}
        >
          <span className="mr-2 inline-block size-2 rounded-full bg-primary" />
          Rekomendasi
        </span>
      )}

      {/* Icon */}
      {icon && <div className="mb-4.5 flex size-16 items-center justify-center">{icon}</div>}

      {/* Content */}
      <div className="text-sm flex flex-col gap-2">
        <h3 className="font-bold">{title}</h3>

        {description && <p>{description}</p>}
      </div>
    </button>
  );
}
