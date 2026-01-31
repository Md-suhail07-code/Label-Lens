import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  gradient = "gradient-primary",
  delay = 0,
}) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl p-5 text-left",
        "bg-card shadow-soft transition-shadow hover:shadow-soft-lg",
        "border border-border/50"
      )}
    >
      {/* Background gradient on hover */}
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          gradient
        )}
        whileHover={{ opacity: 0.05 }}
      />

      <div className="relative z-10 flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            gradient,
            "shadow-glow transition-transform duration-300 group-hover:scale-110"
          )}
        >
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="shrink-0 text-muted-foreground"
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </motion.div>
      </div>
    </motion.button>
  );
};

export default QuickActionCard;
