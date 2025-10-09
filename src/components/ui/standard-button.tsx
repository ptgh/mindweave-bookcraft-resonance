
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const standardButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        standard: "bg-transparent border border-[rgba(255,255,255,0.15)] text-[#cdd6f4] hover:border-[#89b4fa] hover:text-[#89b4fa] hover:shadow-[0_0_10px_rgba(137,180,250,0.3)]",
        primary: "bg-blue-600 hover:bg-blue-700 text-white touch-manipulation active:scale-95",
        ghost: "text-[#cdd6f4] hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "py-1.5 px-3",
        sm: "py-1 px-2",
        xs: "py-0.5 px-1.5 text-[11px] [&_svg]:size-3",
        lg: "py-2 px-4",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "standard",
      size: "default",
    },
  }
)

export interface StandardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof standardButtonVariants> {
  asChild?: boolean
}

const StandardButton = React.forwardRef<HTMLButtonElement, StandardButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(standardButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
StandardButton.displayName = "StandardButton"

export { StandardButton, standardButtonVariants }
