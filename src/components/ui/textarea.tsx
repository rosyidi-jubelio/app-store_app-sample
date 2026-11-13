'use client';

import { TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { useEffect, useLayoutEffect } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.ComponentProps<'textarea'> {
  label?: React.ReactNode;
  requiredMark?: boolean;
  invalid?: boolean;
  autoGrow?: boolean;
  helper?: React.ReactNode;
  errorMessage?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      requiredMark,
      invalid,
      autoGrow = true,
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
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const valueOnFocusRef = React.useRef<string | undefined>(undefined);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

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

    const valueProps =
      typeof value !== 'undefined'
        ? { value }
        : typeof defaultValue !== 'undefined'
          ? { defaultValue }
          : {};

    const ariaInvalidProp = (props as React.AriaAttributes)['aria-invalid'];
    const isInvalid =
      typeof invalid === 'boolean'
        ? invalid
        : ariaInvalidProp === true || ariaInvalidProp === 'true';

    const reflowHeight = React.useCallback(
      (el: HTMLTextAreaElement | null) => {
        if (!autoGrow || !el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
      },
      [autoGrow],
    );

    const shouldFloat = focused || hasValue;

    useLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      const v = el.value;
      setHasValue(v.length > 0);
      setCharCount(v.length);
    });

    useEffect(() => {
      if (typeof value !== 'undefined') {
        setHasValue(Boolean(value));
        setCharCount(value ? String(value).length : 0);
      }
    }, [value]);

    useEffect(() => {
      reflowHeight(innerRef.current);
    }, [charCount, reflowHeight]);

    return (
      <div className="w-full">
        <div
          className={cn(
            'relative',
            !className?.includes('w-') && 'w-full',
            !className?.includes('h-') && 'h-full',
          )}
          data-invalid={isInvalid ? 'true' : 'false'}
        >
          <textarea
            ref={innerRef}
            data-slot="textarea"
            placeholder={label ? undefined : placeholder}
            className={cn(
              'border-muted-foreground placeholder:text-muted-foreground dark:bg-input/30 flex min-h-16 w-full h-full rounded-md border bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none md:text-sm',
              // Hover state
              'hover:border-primary',
              // Focus state
              'focus-visible:border-primary',
              // Selection state
              'selection:bg-primary selection:text-primary-foreground',
              // Aria invalid state
              'aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive',
              errorMessage && 'border-destructive',
              // Disabled state
              'disabled:bg-disabled disabled:text-disabled-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:border disabled:opacity-50',
              label && 'pt-3 pb-2',
              autoGrow ? 'field-sizing-content resize-none overflow-hidden' : 'resize-y',
              className,
            )}
            {...valueProps}
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

              if (currentValue === valueOnFocus) {
                return;
              }
              onBlur?.(e);
            }}
            onChange={(e) => {
              if (autoGrow) reflowHeight(e.currentTarget);
              const len = e.currentTarget.value.length;
              setCharCount(len);
              setHasValue(len > 0);
              onChange?.(e);
            }}
            {...props}
          />

          {label && (
            <span
              className={cn(
                'pointer-events-none absolute left-3 z-10 px-1 text-sm transition-all',
                'text-muted-foreground top-2',
                'bg-background dark:bg-background/60 px-1',
                shouldFloat && 'text-foreground -top-2 translate-y-0 text-xs',
                disabled && 'text-muted-foreground cursor-not-allowed bg-inherit',
                isInvalid && 'text-destructive',
              )}
            >
              {label}
              {requiredMark && <span className="text-red-500"> *</span>}
            </span>
          )}
        </div>

        {!!(helper || maxLength) && (
          <div className="mt-1 flex items-center justify-between text-xs">
            {helper && <span className="text-placeholder">{helper}</span>}
            {maxLength && (
              <span className={cn('text-right text-placeholder', !helper && 'ml-auto')}>
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}

        {!!errorMessage && (
          <p
            className={cn('text-destructive mt-1 inline-flex items-center gap-1 text-xs')}
            role="alert"
            data-testid="input-error-message"
          >
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
  },
);

Textarea.displayName = 'Textarea';
