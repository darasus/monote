import {Button, ButtonProps} from "@/components/ui/button"
import {cn} from "../../../../../utils"
import {forwardRef} from "react"

interface Props extends ButtonProps {
  children: React.ReactNode
  isActive: boolean
}

// eslint-disable-next-line react/display-name
export const MenuItemButton = forwardRef<HTMLButtonElement, Props>(
  ({children, isActive, className, ...props}, ref) => {
    return (
      <Button
        ref={ref}
        {...props}
        size="sm"
        variant={"ghost"}
        className={cn(
          "p-1 h-[30px] min-w-[30px]",
          {
            "bg-muted": isActive,
          },
          className
        )}
      >
        {children}
      </Button>
    )
  }
)
