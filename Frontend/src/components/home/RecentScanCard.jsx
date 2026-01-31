import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
        "relative flex-shrink-0 w-44 rounded-2xl p-4 text-left overflow-hidden",
        "bg-white/90 backdrop-blur-sm border border-white/60",
        "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)]",
        "transition-all duration-200 hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]",
        "hover:border-primary/20"
      )}
    >
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", styles?.bg)} />

      {/* Score + time row */}
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl text-base font-bold shadow-sm",
            styles?.bg,
            styles?.text,
            styles?.border,
            "border"
          )}
        >
          {scan.score ?? 0}
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">
          {scan.timestamp
            ? formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })
            : "—"}
        </span>
      </div>

      {/* Product info */}
      <h4 className="line-clamp-2 text-sm font-semibold text-foreground leading-tight min-h-[2.5rem]">
        {scan.productName ?? "Unknown Product"}
      </h4>

      {scan.brand && (
        <p className="mt-1 text-xs text-muted-foreground truncate">{scan.brand}</p>
      )}

      {/* Verdict pill */}
      <div
        className={cn(
          "mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
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
