import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-transparent bg-ansha/20 text-ansha",
        secondary: "border-transparent bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
        outline: "text-white/40 border border-white/10",
        success: "bg-emerald-500/20 text-emerald-500",
        destructive: "bg-red-500/20 text-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TagProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagVariants> {}

function Tag({ className, variant, ...props }: TagProps) {
  return <div className={cn(tagVariants({ variant }), className)} {...props} />
}

export { Tag, tagVariants }
