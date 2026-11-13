'use client';

import { Input as InputPrimitive } from '@base-ui/react/input';
import { TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  isWrapper?: boolean;
  emptyNumber?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClickRightIcon?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  rightIconAriaLabel?: string;
  helper?: React.ReactNode;
  errorMessage?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      isWrapper = true,
      type,
      label,
      required = false,
      emptyNumber = true,
      leftIcon,
      rightIcon,
      onClickRightIcon,
      rightIconAriaLabel,
      helper,
      errorMessage,
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      placeholder,
      disabled,
      maxLength,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const valueOnFocusRef = React.useRef<string | undefined>(undefined);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const [focused, setFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState<boolean>(() => {
      if (typeof value !== 'undefined') return Boolean(value);
      if (typeof defaultValue !== 'undefined') return Boolean(defaultValue);
      return false;
    });
    const [charCount, setCharCount] = React.useState(() => {
      const initial = typeof value !== 'undefined' ? value : defaultValue;
      return initial ? String(initial).length : 0;
    });

    // Sync from DOM whenever form.reset() or parent re-render updates the input.
    // Runs after paint, after react-hook-form has set the DOM value.
    React.useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const v = el.value;
      setHasValue(v.length > 0);
      setCharCount(v.length);
    });

    // Sync when value prop changes (handles controlled inputs)
    React.useEffect(() => {
      if (typeof value !== 'undefined') {
        setHasValue(Boolean(value));
        setCharCount(value ? String(value).length : 0);
      }
    }, [value]);

    const ariaInvalidProp = (props as React.AriaAttributes)['aria-invalid'];
    const isInvalid = ariaInvalidProp === true || ariaInvalidProp === 'true';

    const inputValueProps =
      typeof value !== 'undefined'
        ? { value }
        : typeof defaultValue !== 'undefined'
          ? { defaultValue }
          : {};

    const shouldFloat = focused || hasValue;
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn(isWrapper && 'w-full')}>
        <div
          className={cn('relative', !className?.includes('w-') && 'w-full')}
          data-invalid={isInvalid ? 'true' : 'false'}
        >
          {!disabled && label && (
            <span
              className={cn(
                'bg-background dark:bg-background/60 pointer-events-none absolute z-10 px-1 text-sm transition-all',
                'top-1/2 -translate-y-1/2',
                'text-muted-foreground',
                shouldFloat && 'text-helper -top-2 left-3 translate-y-0 text-xs',
                hasLeftIcon && !shouldFloat ? 'left-10' : 'left-3',
                disabled && 'text-muted-foreground',
                props.readOnly && 'text-muted-foreground',
                isInvalid && 'text-destructive',
              )}
            >
              {label}
              {required && <span className="text-destructive"> *</span>}
            </span>
          )}

          {hasLeftIcon && (
            <span
              aria-hidden
              className={cn(
                'text-muted-foreground pointer-events-none absolute inset-y-0 left-3 z-10 inline-flex items-center justify-center',
              )}
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">{leftIcon}</span>
            </span>
          )}

          {hasRightIcon &&
            (onClickRightIcon ? (
              <button
                type="button"
                aria-label={rightIconAriaLabel ?? 'End icon'}
                disabled={disabled}
                onClick={onClickRightIcon}
                className={cn(
                  'absolute inset-y-0 right-3 z-10 flex items-center justify-center',
                  'text-muted-foreground',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">{rightIcon}</span>
              </button>
            ) : (
              <span
                aria-hidden
                className={cn(
                  'text-muted-foreground pointer-events-none absolute inset-y-0 right-3 z-10 inline-flex items-center justify-center',
                )}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">{rightIcon}</span>
              </span>
            ))}

          <InputPrimitive
            ref={innerRef}
            type={type}
            data-slot="input"
            placeholder={label ? undefined : placeholder}
            className={cn(
              'file:text-foreground border-muted-foreground flex h-10 w-full min-w-0 rounded-md border bg-transparent px-4 py-2.5 text-sm transition-all duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium dark:bg-transparent',
              // Hover and focus state
              'hover:border-primary focus-visible:border-primary',
              // Dark mode
              'dark:border-muted-foreground dark:hover:border-foreground dark:focus-visible:border-primary dark:focus-visible:ring-primary',
              // Placeholder state
              'placeholder:text-muted-foreground placeholder:text-sm',
              // Selection state
              'selection:bg-primary selection:text-primary-foreground',
              // Aria invalid state
              'aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive',
              errorMessage &&
                'border-destructive focus-visible:border-destructive hover:border-destructive',
              // Disabled and read-only state
              'disabled:border-disabled-foreground disabled:bg-disabled disabled:text-disabled-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:border',
              // Read-only state
              'read-only:focus:border-muted-foreground read-only:bg-muted/10 read-only:text-muted-foreground read-only:cursor-not-allowed read-only:border',
              label && 'pt-2 pb-1.5',
              hasLeftIcon && 'pl-10',
              hasRightIcon && 'pr-10',
              className,
            )}
            {...inputValueProps}
            maxLength={maxLength}
            disabled={disabled}
            onFocus={(e) => {
              setFocused(true);
              valueOnFocusRef.current = e.currentTarget.value;
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);

              const currentValue = e.currentTarget.value;
              const valueOnFocus = valueOnFocusRef.current;

              if (emptyNumber && type === 'number' && currentValue === '') {
                if (typeof value !== 'undefined') {
                  const target = e.currentTarget;
                  const newEvent = Object.create(e);
                  newEvent.target = newEvent.currentTarget = {
                    ...target,
                    value: '0',
                  };
                  onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>);
                } else {
                  e.currentTarget.value = '0';
                  setHasValue(true);
                  setCharCount(1);
                }
              } else if (currentValue === valueOnFocus) {
                return;
              }

              onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(e.currentTarget.value !== '');
              setCharCount(e.currentTarget.value.length);
              onChange?.(e);
            }}
            {...(type === 'number' ? { inputMode: 'decimal' } : {})}
            {...props}
          />
        </div>
        {!!(helper || maxLength || errorMessage) && (
          <div className="mt-2 flex items-start justify-between gap-2 text-xs">
            {!!(helper || errorMessage) && (
              <div className="flex flex-col gap-1">
                {helper && <span className="text-placeholder">{helper}</span>}
                {!!errorMessage && (
                  <p
                    className="text-destructive inline-flex items-center gap-1"
                    role="alert"
                    data-testid="input-error-message"
                  >
                    <TriangleAlert
                      className={cn(
                        'text-background size-4 shrink-0',
                        '[&>path:nth-of-type(1)]:fill-red-500',
                        '[&>line]:stroke-white',
                      )}
                      aria-label="Error"
                    />
                    {errorMessage}
                  </p>
                )}
              </div>
            )}
            {!!maxLength && (
              <span aria-live="polite" className="ml-auto shrink-0 text-right text-placeholder">
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
