import React from 'react';
import { cn } from '@learning-os/ui/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly hoverable?: boolean;
}

export function Card({ children, className, hoverable = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card shadow-neobrutalism rounded-2xl border-2 p-6 transition-all',
        hoverable &&
          'hover:shadow-neobrutalism-lg active:shadow-neobrutalism-sm hover:translate-x-[-2px] hover:translate-y-[-2px] active:translate-x-[1px] active:translate-y-[1px]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
