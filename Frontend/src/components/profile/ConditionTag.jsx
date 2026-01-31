import React from "react";
import { motion } from "framer-motion";
import { getConditionById, getAllergyById } from "@/data/healthData";

/** Simple classNames helper (like cn) */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const ConditionTag = ({ id, type, isSelected, onToggle, size = "md" }) => {
  const data =
    type === "condition" ? getConditionById(id) : getAllergyById(id);

  if (!data) return null;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };

  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative rounded-full font-medium transition-all duration-200",
        "flex items-center gap-2 border-2",
        sizeClasses[size],
        isSelected
          ? "border-primary bg-primary/10 text-primary shadow-glow"
          : "border-border bg-card text-muted-foreground hover:border-primary/50"
      )}
    >
      <span className="text-base">{data.icon}</span>
      <span>{data.name}</span>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};

export default ConditionTag;
