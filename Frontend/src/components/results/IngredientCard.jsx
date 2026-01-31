import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

/** Simple classNames helper (like cn) */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const safetyConfig = {
  safe: {
    icon: CheckCircle,
    bg: "bg-badge-safe",
    text: "text-badge-safe-text",
    iconColor: "text-verdict-safe",
    border: "border-verdict-safe/20",
  },
  caution: {
    icon: AlertCircle,
    bg: "bg-badge-caution",
    text: "text-badge-caution-text",
    iconColor: "text-verdict-caution",
    border: "border-verdict-caution/20",
  },
  danger: {
    icon: XCircle,
    bg: "bg-badge-danger",
    text: "text-badge-danger-text",
    iconColor: "text-verdict-danger",
    border: "border-verdict-danger/20",
  },
};

const IngredientCard = ({ ingredient, index = 0 }) => {
  const config = safetyConfig[ingredient.safety];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 rounded-xl p-3",
        config.bg,
        "border",
        config.border,
        ingredient.safety === "danger" && "pulse-danger"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-medium text-sm", config.text)}>
            {ingredient.name}
          </span>
          {ingredient.hiddenName && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              aka "{ingredient.hiddenName}"
            </span>
          )}
        </div>
        {ingredient.reason && (
          <p className={cn("text-xs mt-1 opacity-80", config.text)}>
            {ingredient.reason}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default IngredientCard;
