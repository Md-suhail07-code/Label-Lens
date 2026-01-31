import React, { forwardRef } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

// Tailwind v4 safe variant classes
const labelBaseClasses = "text-sm font-medium leading-none disabled:cursor-not-allowed disabled:opacity-70";

const Label = forwardRef(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelBaseClasses, className)}
      {...props}
    />
  );
});

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
