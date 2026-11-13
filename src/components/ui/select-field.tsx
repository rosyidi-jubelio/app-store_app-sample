'use client';

import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface SelectFieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options: SelectFieldOption[];
  value?: string;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  errorMessage?: string;
  className?: string;
}

/**
 * Dropdown tanpa kolom pencarian — padanan `SelectSearch` untuk daftar pendek.
 * Props sengaja dibikin sama supaya bisa ditukar tanpa ubah call site.
 */
export function SelectField({
  label,
  required = false,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  readOnly,
  loading = false,
  errorMessage,
  className,
}: SelectFieldProps) {
  const hasValue = !!value;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {!disabled && label && (
          <span
            className={cn(
              'bg-background dark:bg-background/60 pointer-events-none absolute z-10 px-1 text-sm transition-all ml-3',
              'top-1/2 -translate-y-1/2',
              'text-muted-foreground',
              hasValue && 'text-helper -top-2 left-0 translate-y-0 text-xs',
              readOnly && 'text-muted-foreground',
            )}
          >
            {label}
            {required && <span className="text-destructive"> *</span>}
          </span>
        )}
        <Select
          // `null` (bukan '') supaya Base UI anggap belum ada pilihan dan placeholder tampil.
          value={value || null}
          onValueChange={(next) => onChange?.((next as string | null) ?? null)}
          items={options}
          disabled={disabled || loading}
          readOnly={readOnly}
        >
          <SelectTrigger
            aria-invalid={!!errorMessage}
            // h-10 di-scope ke data-[size=default] karena class bawaan SelectTrigger pakai
            // selector yang sama — `h-10` polos kalah specificity dan tingginya balik ke 8.
            className={cn(
              'w-full data-[size=default]:h-10 rounded-md border-muted-foreground px-4 py-2.5 text-sm',
              'hover:border-primary focus-visible:border-primary focus-visible:ring-0',
              label && 'pt-2 pb-1.5',
            )}
          >
            <SelectValue placeholder={label ? undefined : placeholder} />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!!errorMessage && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-destructive" role="alert">
          <TriangleAlert
            className={cn(
              'text-background size-4',
              '[&>path:nth-of-type(1)]:fill-red-500',
              '[&>line]:stroke-white',
            )}
            aria-label="Error"
          />
          {errorMessage}
        </p>
      )}
    </div>
  );
}
