import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { gsap } from "gsap"

const EnhancedToastProvider = ToastPrimitive.Provider

const enhancedToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border-2 px-4 py-3 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-800 text-slate-200",
        success: "border-green-500/30 bg-green-900/20 text-green-200 shadow-green-500/20",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const EnhancedToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> &
    VariantProps<typeof enhancedToastVariants>
>(({ className, variant, ...props }, ref) => {
  const toastRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (toastRef.current && props.open) {
      // GSAP entrance animation
      gsap.fromTo(toastRef.current, 
        { 
          opacity: 0, 
          scale: 0.9, 
          y: -20 
        },
        { 
          opacity: 1, 
          scale: 1, 
          y: 0, 
          duration: 0.4, 
          ease: "power2.out" 
        }
      )
    }
  }, [props.open])

  return (
    <ToastPrimitive.Root
      ref={toastRef}
      className={cn(enhancedToastVariants({ variant }), className)}
      {...props}
    />
  )
})
EnhancedToast.displayName = ToastPrimitive.Root.displayName

const EnhancedToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
EnhancedToastViewport.displayName = ToastPrimitive.Viewport.displayName

const EnhancedToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-slate-400 opacity-0 transition-opacity hover:text-slate-200 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitive.Close>
))
EnhancedToastClose.displayName = ToastPrimitive.Close.displayName

const EnhancedToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn("text-sm font-semibold text-slate-200", className)}
    {...props}
  />
))
EnhancedToastTitle.displayName = ToastPrimitive.Title.displayName

const EnhancedToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn("text-sm opacity-90 text-slate-300", className)}
    {...props}
  />
))
EnhancedToastDescription.displayName = ToastPrimitive.Description.displayName

// Success Toast Component with Circle Theme
const SuccessToast = ({ title, description }: { title: string; description: string }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 rounded-full border-2 border-green-400 flex items-center justify-center bg-green-500/20">
        <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />
      </div>
      <div className="flex-1">
        <EnhancedToastTitle>{title}</EnhancedToastTitle>
        <EnhancedToastDescription>{description}</EnhancedToastDescription>
      </div>
    </div>
  )
}

export {
  EnhancedToastProvider,
  EnhancedToastViewport,
  EnhancedToast,
  EnhancedToastTitle,
  EnhancedToastDescription,
  EnhancedToastClose,
  SuccessToast,
}
