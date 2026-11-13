'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

const Separator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical';
    decorative?: boolean;
  }
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <hr
    ref={ref as React.Ref<HTMLHRElement>}
    role={decorative ? 'none' : undefined}
    className={cn(
      'shrink-0 bg-separator',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-auto w-px self-stretch',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';

export { Separator };
