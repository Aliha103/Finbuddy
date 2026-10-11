import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[transform,background-color,color,box-shadow] duration-[160ms] ease-standard active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        primary: 'bg-tint text-on-tint hover:bg-[color-mix(in_oklab,var(--tint),var(--label)_18%)]',
        secondary: 'bg-surface text-label ring-1 ring-separator ring-inset hover:bg-surface-alt',
        ghost: 'text-label hover:bg-pressed',
      },
      size: {
        sm: 'h-9 px-4 text-[15px]',
        md: 'h-11 px-5 text-[16px]',
        lg: 'h-12 px-6 text-[17px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...(asChild ? {} : { type: type ?? 'button' })} {...props} />;
}
