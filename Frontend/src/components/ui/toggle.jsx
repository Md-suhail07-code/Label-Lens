import React, { forwardRef } from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cn } from "@/lib/utils";

// Tailwind CVA-like variants function
const toggleVariants = ({ variant = "default", size = "default", className = "" }) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-blue-500 data-[state=on]:text-white";

  const variants = {
    variant: {
      default: "bg-transparent",
      outline: "border border-gray-300 bg-transparent hover:bg-blue-500 hover:text-white",
    },
    size: {
      default: "h-10 px-3",
      sm: "h-9 px-2.5",
      lg: "h-11 px-5",
    },
  };

  return cn(base, variants.variant[variant] || "", variants.size[size] || "", className);
};

const Toggle = forwardRef(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={toggleVariants({ variant, size, className })}
    {...props}
  />
));

Toggle.displayName = "Toggle";

export { Toggle, toggleVariants };
