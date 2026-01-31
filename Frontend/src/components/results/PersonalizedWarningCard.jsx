import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, XOctagon } from "lucide-react";
import { getConditionById, getAllergyById } from "@/data/healthData";

/** Simple classNames helper (like cn) */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const PersonalizedWarningCard = ({ warning, index = 0 }) => {
  const isDanger = warning.severity === "danger";

  // Get the icon from condition or allergy data
  const conditionData = getConditionById(warning.condition);
  const allergyData = getAllergyById(warning.condition);
  const emoji = conditionData?.icon || allergyData?.icon || "⚠️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-xl p-4",
        "border-2",
        isDanger
          ? "bg-verdict-danger/10 border-verdict-danger/30"
          : "bg-verdict-caution/10 border-verdict-caution/30"
      )}
    >
      {/* Animated background pulse for danger */}
      {isDanger && (
        <motion.div
          className="absolute inset-0 bg-verdict-danger/5"
          animate={{ opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl",
            isDanger ? "bg-verdict-danger/20" : "bg-verdict-caution/20"
          )}
        >
          {emoji}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isDanger ? (
              <XOctagon className="h-4 w-4 text-verdict-danger" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-verdict-caution" />
            )}
            <span
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                isDanger ? "text-verdict-danger" : "text-verdict-caution"
              )}
            >
              {conditionData?.name || allergyData?.name || "Warning"}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground font-medium">
            {warning.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalizedWarningCard;
