import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black transition-all duration-300 uppercase tracking-[0.2em] border",
  {
    variants: {
      variant: {
        default: "border-ansha/20 bg-ansha/10 text-ansha",
        secondary: "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white",
        outline: "border-white/10 text-muted-foreground bg-transparent",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
        destructive: "border-red-500/20 bg-red-500/10 text-red-500",
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
