import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:text-primary-foreground placeholder:text-sm flex h-[46px] w-full min-w-0 px-4 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed bg-white/50 dark:border-none dark:bg-accent disabled:opacity-50 md:text-md",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
