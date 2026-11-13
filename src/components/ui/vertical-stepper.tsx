'use client';

import { Check } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface Step {
  id: number;
  title: string;
  description?: string;
}

interface VerticalStepperProps {
  steps: Step[];
  currentStep: number;
  onStepComplete?: (stepId: number) => void;
  className?: string;
  incompleteSteps?: number[];
}

const VerticalStepper = forwardRef<HTMLDivElement, VerticalStepperProps>(
  ({ steps, currentStep, onStepComplete, className, incompleteSteps }, ref) => {
    return (
      <div ref={ref} data-slot="vertical-stepper" className={cn('flex flex-col gap-0', className)}>
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isIncomplete = incompleteSteps?.includes(step.id) ?? false;

          const handleActivate = () => {
            if (isCompleted) onStepComplete?.(step.id);
          };

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isCompleted}
              className="relative flex gap-4 text-left bg-transparent border-0 p-0 cursor-pointer disabled:cursor-default"
              onClick={handleActivate}
            >
              {/* Vertical line connector */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute left-6 top-12 bottom-0 w-px transition-colors',
                    isCompleted && !isIncomplete ? 'bg-primary' : 'bg-placeholder',
                    isCompleted && isIncomplete && 'bg-destructive',
                  )}
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all border bg-transparent border-placeholder',
                  isActive && !isIncomplete && 'border-primary',
                  isCompleted && 'bg-white border-primary',
                  isIncomplete && 'border-destructive',
                )}
              >
                {isCompleted && !isIncomplete ? (
                  <Check className="size-7 text-primary font-bold" />
                ) : (
                  <span
                    className={cn(
                      'text-[28px] transition-colors',
                      isActive ? 'text-primary' : 'text-placeholder',
                      isIncomplete ? 'text-destructive' : '',
                    )}
                  >
                    {step.id}
                  </span>
                )}
              </div>

              {/* Step content */}
              <div className="flex flex-col pb-18 pt-1">
                <div className={cn('flex items-center gap-2', !step.description && 'mt-2.5')}>
                  <h3
                    className={cn(
                      'text-sm font-bold transition-colors whitespace-nowrap',
                      isIncomplete ? 'text-destructive' : '',
                    )}
                  >
                    {step.title}
                  </h3>
                </div>
                {step.description && (
                  <p
                    className={cn(
                      'text-xs transition-colors',
                      isCompleted || isActive
                        ? 'text-neutral-600 dark:text-neutral-400'
                        : isIncomplete
                          ? 'text-destructive'
                          : 'text-neutral-500 dark:text-neutral-500',
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  },
);

VerticalStepper.displayName = 'VerticalStepper';

export { VerticalStepper };
