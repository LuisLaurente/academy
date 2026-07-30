import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-border bg-background hover:bg-muted',
        ghost: 'hover:bg-muted',
        neobrutalism:
          'bg-primary text-primary-foreground border-2 border-border shadow-neobrutalism hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(253,251,247,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(253,251,247,1)] rounded-xl font-display font-semibold tracking-wide',
        neobrutalismOutline:
          'bg-background text-foreground border-2 border-border shadow-neobrutalism hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(26,26,26,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] dark:active:shadow-[2px_2px_0px_0px_rgba(253,251,247,1)] dark:hover:shadow-[5px_5px_0px_0px_rgba(253,251,247,1)] rounded-xl font-display font-semibold tracking-wide',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
}

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  );
}

export { buttonVariants };
