import * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

// Simple wrapper for Radix AspectRatio
const AspectRatio = ({ children, className, ...props }) => (
  <AspectRatioPrimitive.Root className={className} {...props}>
    {children}
  </AspectRatioPrimitive.Root>
);

export { AspectRatio };
