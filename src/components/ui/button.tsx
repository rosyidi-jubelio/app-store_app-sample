'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 px-4 has-data-[icon=inline-start]:pl-3 has-data-[icon=inline-end]:pr-3 whitespace-nowrap rounded-md font-normal transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 disabled:cursor-not-allowed hover:opacity-90 hover:-translate-y-0.5 disabled:hover:translate-y-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          'bg-button-primary text-button-foreground active:bg-button-primary/80 disabled:bg-button-muted disabled:text-button-muted-foreground',
        secondary:
          'bg-button-secondary text-button-secondary-foreground active:bg-button-secondary/70',
        outline:
          'border border-button-muted bg-transparent text-foreground hover:border-button-primary/50 hover:bg-button-primary/20 hover:text-button-primary disabled:border-button-muted disabled:text-button-muted-foreground disabled:hover:bg-transparent',
        ghost:
          'disabled:text-button-muted-foreground text-foreground hover:bg-transparent focus-visible:bg-transparent active:bg-transparent disabled:hover:bg-transparent',
        destructive:
          'bg-button-destructive text-white hover:bg-button-destructive/90 active:bg-button-destructive/80',
        link: 'text-button-primary underline-offset-4 hover:underline active:text-button-primary/80 hover:translate-y-0 p-0!',
        // "link-secondary":
        //   "text-button-muted-foreground underline-offset-4 hover:underline active:text-button-muted-foreground/80",
        custom: '',
      },
      size: {
        default: 'h-10 text-sm',
        sm: 'h-[35px] text-xs',
        lg: 'h-12 text-base',
        icon: 'size-10',
        custom: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Button = forwardRef<
  HTMLButtonElement,
  ButtonPrimitive.Props &
    VariantProps<typeof buttonVariants> & {
      disableRipple?: boolean;
    }
>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      onPointerDown,
      disableRipple = false,
      ...props
    },
    ref,
  ) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const rippleIdRef = useRef(0);

    const rippleSize = useMemo(() => {
      if (size === 'sm') return 35;
      if (size === 'lg') return 48;
      return 40;
    }, [size]);

    const handleAnimationEnd = (rippleId: number) => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!disableRipple) {
        const target = event.currentTarget as HTMLElement | null;
        if (target) {
          const rect = target.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          const newRipple: Ripple = {
            id: rippleIdRef.current++,
            x,
            y,
            size: rippleSize,
          };

          setRipples((prev) => [...prev, newRipple]);
        }
      }

      if (onPointerDown) {
        onPointerDown(
          event as React.PointerEvent<HTMLButtonElement> & {
            preventBaseUIHandler: () => void;
          },
        );
      }
    };

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        className={cn(
          variant !== 'custom' ? buttonVariants({ variant, size, className }) : className,
          'relative',
        )}
        onPointerDown={handlePointerDown}
        {...props}
      >
        {ripples.length > 0 && (
          <span className="pointer-events-none absolute inset-0">
            {ripples.map((ripple: Ripple) => (
              <span
                key={ripple.id}
                className="animate-ripple absolute rounded-full bg-white/30"
                style={{
                  left: ripple.x,
                  top: ripple.y,
                  width: ripple.size,
                  height: ripple.size,
                  transform: 'translate(-50%, -50%)',
                }}
                onAnimationEnd={() => handleAnimationEnd(ripple.id)}
              />
            ))}
          </span>
        )}
        {props.children}
      </ButtonPrimitive>
    );
  },
);

export { Button, buttonVariants };
