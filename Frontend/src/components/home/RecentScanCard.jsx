import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from 'date-fns';
/**
 * Expected scan object shape:
 * {
 *   verdict: "safe" | "caution" | "danger",
 *   score: number,
 *   timestamp: string | number | Date,
 *   productName: string,
 *   brand?: string
 * }
 */

const verdictStyles = {
  safe: {
    bg: "bg-verdict-safe/10",
    text: "text-verdict-safe",
    border: "border-verdict-safe/30",
  },
  caution: {
    bg: "bg-verdict-caution/10",
    text: "text-verdict-caution",
    border: "border-verdict-caution/30",
  },
  danger: {
    bg: "bg-verdict-danger/10",
    text: "text-verdict-danger",
    border: "border-verdict-danger/30",
  },
};

const verdictLabels = {
  safe: "✓ Safe",
  caution: "⚠ Caution",
  danger: "✗ Avoid",
};

const RecentScanCard = ({ scan, onClick, index = 0 }) => {
  if (!scan) return null; // safe-guard against undefined scan

  const verdict = scan.verdict || "safe"; // default to safe if missing
  const styles = verdictStyles[verdict];

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex-shrink-0 w-40 rounded-xl p-3 text-left",
        "bg-card border border-border/50 shadow-soft",
        "transition-all duration-200 hover:shadow-soft-lg"
      )}
    >
      {/* Score badge */}
      <div className="mb-2 flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
            styles?.bg,
            styles?.text
          )}
        >
          {scan.score ?? 0}
        </div>

        <span className="text-xs text-muted-foreground">
          {scan.timestamp
            ? formatDistanceToNowStrict(new Date(scan.timestamp), { addSuffix: true })
            : "unknown"}
        </span>
      </div>

      {/* Product info */}
      <h4 className="line-clamp-1 text-sm font-medium text-foreground">
        {scan.productName ?? "Unknown Product"}
      </h4>

      {scan.brand && (
        <p className="mt-0.5 text-xs text-muted-foreground">{scan.brand}</p>
      )}

      {/* Verdict pill */}
      <div
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          styles?.bg,
          styles?.text,
          "border",
          styles?.border
        )}
      >
        {verdictLabels[verdict]}
      </div>
    </motion.button>
  );
};

export default RecentScanCard;
