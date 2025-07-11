import { forwardRef, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, className, size = "md" }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener("keydown", handleEscape)
        document.body.style.overflow = "hidden"
      }

      return () => {
        document.removeEventListener("keydown", handleEscape)
        document.body.style.overflow = "unset"
      }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const sizeClasses = {
      sm: "max-w-md",
      md: "max-w-lg", 
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-7xl mx-4"
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div 
          ref={ref}
          className={cn(
            "relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-h-[90vh] overflow-hidden",
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          )}
          
          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = "Modal"

export { Modal }