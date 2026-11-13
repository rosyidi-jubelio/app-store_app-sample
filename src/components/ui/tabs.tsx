'use client';

import { createContext, forwardRef, type ReactNode, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs.Root');
  }
  return context;
};

interface TabsProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
}

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onValueChange, defaultValue = '', className, children }, ref) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleValueChange = (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div ref={ref} data-slot="tabs" className={cn('w-full', className)}>
          <style>{`
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateX(10px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);

interface TabsListProps {
  className?: string;
  children: ReactNode;
}

const TabsList = forwardRef<HTMLDivElement, TabsListProps>(({ className, children }, ref) => {
  return (
    <div ref={ref} data-slot="tabs-list" className={cn('relative inline-flex gap-2', className)}>
      {children}
    </div>
  );
});

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}

const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, className, children, disabled = false }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isSelected = selectedValue === value;

    return (
      <button
        type="button"
        ref={ref}
        data-slot="tabs-trigger"
        data-state={isSelected ? 'active' : 'inactive'}
        className={cn(
          'relative px-4 py-2.5 text-sm font-normal text-neutral-600 dark:text-neutral-400 transition-all outline-none select-none cursor-pointer border rounded-3xl border-placeholder',
          'focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-neutral-950 dark:focus-visible:outline-white',
          !isSelected && 'hover:text-tab-hover hover:border-tab-hover',
          isSelected && 'text-primary font-bold hover:text-primary border-primary border-2',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        onClick={() => !disabled && onValueChange(value)}
        disabled={disabled}
      >
        {children}
        {/* {isSelected && (
          <div className="absolute rounded-[20px] -bottom-px left-0 right-0 h-0.5 bg-primary dark:bg-blue-400 transition-all duration-300" />
        )} */}
      </button>
    );
  },
);

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isSelected = selectedValue === value;

    if (!isSelected) {
      return null;
    }

    return (
      <div
        ref={ref}
        data-slot="tabs-content"
        className={cn('outline-none animate-[slideIn_300ms_ease-out]', className)}
      >
        {children}
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
