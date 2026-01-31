import React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

// Root collapsible
const Collapsible = ({ children, open, onOpenChange, ...props }) => {
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
      {children}
    </CollapsiblePrimitive.Root>
  );
};

// Collapsible trigger button
const CollapsibleTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={`cursor-pointer select-none rounded bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className || ""}`}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.Trigger>
));
CollapsibleTrigger.displayName = "CollapsibleTrigger";

// Collapsible content
const CollapsibleContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={`overflow-hidden transition-all duration-300 ${className || ""}`}
    {...props}
  >
    <div className="pt-2">{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleContent.displayName = "CollapsibleContent";

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
