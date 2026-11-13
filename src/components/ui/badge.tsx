'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface BadgeProps extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'> {
  /** Visible text inside the badge. */
  title: string;
  /**
   * Any CSS color string (e.g. `'#3B82F6'`, `'rgb(...)'`, `'hsl(...)'`).
   * Used to auto-derive a soft tinted background and a readable foreground color.
   */
  color?: string;
  /** When true, renders a small dot before the title in the same color as the title text. */
  showDot?: boolean;
}

/**
 * Parse a CSS color string into `{ r, g, b }` in the 0-255 range.
 * Supports `#RGB`, `#RRGGBB`, and `rgb(...)` syntax. Returns `null` for unsupported inputs.
 */
function parseColor(input: string): { r: number; g: number; b: number } | null {
  const hex = input.trim();
  if (hex.startsWith('#')) {
    const raw = hex.slice(1);
    if (raw.length === 3) {
      const r = Number.parseInt(raw[0] + raw[0], 16);
      const g = Number.parseInt(raw[1] + raw[1], 16);
      const b = Number.parseInt(raw[2] + raw[2], 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return { r, g, b };
    }
    if (raw.length === 6) {
      const r = Number.parseInt(raw.slice(0, 2), 16);
      const g = Number.parseInt(raw.slice(2, 4), 16);
      const b = Number.parseInt(raw.slice(4, 6), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return { r, g, b };
    }
    return null;
  }

  const rgbMatch = input.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
    };
  }

  return null;
}

/**
 * Compute WCAG relative luminance for an `{ r, g, b }` (0-255) input.
 * Values are sRGB-linearized first per the WCAG 2.x formula.
 */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

const FALLBACK_COLOR = '#3B82F6';

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ title, color = FALLBACK_COLOR, showDot = false, className, style, ...props }, ref) => {
    const derived = React.useMemo(() => {
      const rgb = parseColor(color);
      const safeRgb = rgb ?? parseColor(FALLBACK_COLOR)!;
      const isBright = relativeLuminance(safeRgb) > 0.6;
      return {
        backgroundColor: `rgba(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b}, 0.12)`,
        color: isBright
          ? `rgba(${Math.round(safeRgb.r * 0.4)}, ${Math.round(safeRgb.g * 0.4)}, ${Math.round(safeRgb.b * 0.4)}, 1)`
          : `rgba(${safeRgb.r}, ${safeRgb.g}, ${safeRgb.b}, 1)`,
      };
    }, [color]);

    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
          className,
        )}
        style={{ ...derived, ...style }}
        {...props}
      >
        {showDot && (
          <span
            aria-hidden="true"
            data-slot="badge-dot"
            className="inline-block size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: derived.color }}
          />
        )}
        {title}
      </span>
    );
  },
);
Badge.displayName = 'Badge';

export type { BadgeProps };
export { Badge };
