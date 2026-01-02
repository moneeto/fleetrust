import { cn } from '@/lib/utils';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-6 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[380px]',
            className,
        )}
        {...props}
    />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
    'group relative pointer-events-auto flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-4 shadow-2xl transition-all backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full data-[state=closed]:slide-out-to-right-full',
    {
        variants: {
            variant: {
                default: 'bg-white/90 border-slate-200 text-slate-900',
                destructive: 'bg-red-50/90 border-red-200 text-red-900',
                success: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

const Toast = React.forwardRef(({ className, variant, children, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className)}
            {...props}
        >
            <div className="flex gap-3">
                {variant === 'destructive' && <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />}
                {variant === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                <div className="grid gap-1">
                    {children}
                </div>
            </div>
            <ToastClose />
        </ToastPrimitives.Root>
    );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            'absolute right-2 top-2 rounded-full p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-900 focus:opacity-100 group-hover:opacity-100',
            className,
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn('text-sm font-bold tracking-tight', className)}
        {...props}
    />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn('text-xs leading-relaxed opacity-80', className)}
        {...props}
    />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
};