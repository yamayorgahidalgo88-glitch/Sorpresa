import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Miro · botón principal (píldora oscura) en el azul marino de Tips
        default: "rounded-full bg-navy font-semibold text-white shadow-[0_6px_0_0_#0c1f33] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#0c1f33] active:translate-y-1 active:shadow-[0_2px_0_0_#0c1f33]",
        outline: "rounded-full border-[#c7cad5] bg-white font-semibold text-ink hover:border-ink",
        sky: "rounded-full bg-sky font-semibold text-ink-deep hover:bg-[#5bbae9]",
        chalk: "rounded-full border-2 border-chalk/80 bg-transparent font-semibold text-chalk hover:bg-chalk hover:text-board",
        ghost: "rounded-full hover:bg-surface",
        icon: "rounded-full border-hairline bg-white text-ink hover:border-ink",
        destructive: "rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-sky-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5 text-[0.95rem]",
        sm: "h-9 gap-1.5 px-4 text-sm",
        lg: "h-12 gap-2 px-6 text-base",
        xl: "h-14 gap-2.5 px-8 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
