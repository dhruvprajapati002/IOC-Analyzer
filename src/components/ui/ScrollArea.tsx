"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

type ScrollDirection = "vertical" | "horizontal" | "both"
type ScrollVariant = "default" | "thin" | "hidden"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: ScrollDirection
  variant?: ScrollVariant
  maxHeight?: number | string
  asChild?: boolean
}

const directionClassMap: Record<ScrollDirection, string> = {
  vertical: "overflow-y-auto overflow-x-hidden",
  horizontal: "overflow-x-auto overflow-y-hidden",
  both: "overflow-auto",
}

const variantClassMap: Record<ScrollVariant, string> = {
  default: "scrollbar-themed",
  thin: "scrollbar-themed scrollbar-thin",
  hidden: "scrollbar-hidden",
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  (
    {
      className,
      direction = "vertical",
      variant = "default",
      maxHeight,
      asChild = false,
      style,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"

    const maxHeightStyle =
      maxHeight === undefined
        ? style
        : {
            ...style,
            maxHeight:
              typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          }

    return (
      <Comp
        ref={ref}
        style={maxHeightStyle}
        className={cn(
          directionClassMap[direction],
          variantClassMap[variant],
          className
        )}
        {...props}
      />
    )
  }
)

ScrollArea.displayName = "ScrollArea"

type ScrollAreaHorizontalProps = Omit<ScrollAreaProps, "direction">

const ScrollAreaHorizontal = React.forwardRef<
  HTMLDivElement,
  ScrollAreaHorizontalProps
>((props, ref) => <ScrollArea ref={ref} direction="horizontal" {...props} />)

ScrollAreaHorizontal.displayName = "ScrollAreaHorizontal"

export { ScrollArea, ScrollAreaHorizontal }
