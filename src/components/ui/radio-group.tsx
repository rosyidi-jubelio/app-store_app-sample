'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

import { cn } from '@/lib/utils';

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn('grid w-full gap-2', className)}
      {...props}
    />
  );
}

interface RadioGroupItemProps extends RadioPrimitive.Root.Props {
  label?: string;
  description?: string;
}

function RadioGroupItem({ className, label, description, ...props }: RadioGroupItemProps) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        // Base
        'group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-placeholder outline-none',

        // Focus
        'after:absolute after:-inset-x-3 after:-inset-y-2',
        'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',

        // Invalid
        'aria-invalid:border-destructive',
        'aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        'aria-invalid:aria-checked:border-primary',
        'dark:aria-invalid:border-destructive/50',
        'dark:aria-invalid:ring-destructive/40',

        // Checked
        'data-checked:border-primary data-checked:bg-primary data-checked:text-foreground',
        'dark:data-checked:bg-primary',

        // Hover
        'hover:border-primary',
        'hover:data-checked:bg-primary/10',
        'dark:hover:data-checked:bg-primary/80',
        'group-hover/row:border-primary',
        'group-hover/row:data-checked:bg-primary/10',
        'dark:group-hover/row:data-checked:bg-primary/80',
        'group-hover/row:data-disabled:border-placeholder',
        'group-hover/row:data-disabled:data-checked:bg-placeholder',

        // Disabled
        'data-disabled:cursor-not-allowed',
        'data-disabled:border-placeholder',
        'data-disabled:hover:border-placeholder',
        'data-disabled:data-checked:border-placeholder',
        'data-disabled:data-checked:bg-placeholder',
        'data-disabled:hover:data-checked:bg-placeholder',

        // Dark disabled
        'dark:data-disabled:border-placeholder',
        'dark:data-disabled:data-checked:border-placeholder',
        'dark:data-disabled:data-checked:bg-placeholder',

        className,
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />
        <span className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary group-data-disabled/radio-group-item:bg-placeholder" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
