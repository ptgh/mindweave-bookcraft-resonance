
import { useEnhancedToast } from "@/hooks/use-enhanced-toast"
import {
  EnhancedToast,
  EnhancedToastClose,
  EnhancedToastDescription,
  EnhancedToastProvider,
  EnhancedToastTitle,
  EnhancedToastViewport,
  SuccessToast,
} from "@/components/ui/enhanced-toast"

export function EnhancedToaster() {
  const { toasts } = useEnhancedToast()

  return (
    <EnhancedToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <EnhancedToast key={id} variant={variant} {...props}>
            {variant === "success" && title && description ? (
              <SuccessToast 
                title={title.toString()} 
                description={description.toString()} 
              />
            ) : (
              <div className="grid gap-1">
                {title && <EnhancedToastTitle>{title}</EnhancedToastTitle>}
                {description && (
                  <EnhancedToastDescription>{description}</EnhancedToastDescription>
                )}
              </div>
            )}
            {action}
            <EnhancedToastClose />
          </EnhancedToast>
        )
      })}
      <EnhancedToastViewport />
    </EnhancedToastProvider>
  )
}
