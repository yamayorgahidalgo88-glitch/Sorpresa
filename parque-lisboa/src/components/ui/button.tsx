import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Oura · button-primary (verde de la clínica, solo para la acción principal)
        default: "rounded-full bg-primary font-semibold text-primary-foreground hover:bg-[#276b2b]",
        // Oura · button-secondary (stone)
        secondary: "rounded-full bg-stone font-semibold text-white hover:bg-[#3b3934]",
        // Oura · button-outline-stone
        outline: "rounded-full border-stone bg-transparent font-semibold text-stone hover:bg-stone hover:text-white",
        // Oura · button-on-dark (crema sobre fondo oscuro)
        onDark: "rounded-full bg-canvas font-semibold text-stone hover:bg-white",
        // Oura · button-outline (sobre foto/oscuro)
        outlineLight: "rounded-full border-white/80 bg-transparent font-semibold text-white hover:bg-white hover:text-ink",
        // Oura · button-icon-circular
        icon: "rounded-full border-hairline bg-surface text-stone hover:border-stone",
        ghost: "rounded-full hover:bg-muted hover:text-foreground",
        destructive: "rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5 text-[0.95rem]",
        sm: "h-9 gap-1.5 px-4 text-sm [&_svg:not([class*='size-'])]:size-3.5",
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
