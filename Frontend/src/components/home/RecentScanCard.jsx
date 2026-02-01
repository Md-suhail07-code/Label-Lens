import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";

/* 🔍 Verdict from score */
const getVerdictFromScore = (score = 0) => {
  if (score < 30) return "safe";
  if (score <= 70) return "caution";
  return "danger";
};

const verdictStyles = {
  safe: {
    cardBg: "bg-green-400/20",
    badgeBg: "bg-green-400",
    border: "border-green-400",
  },
  caution: {
    cardBg: "bg-amber-400/20",
    badgeBg: "bg-amber-300",
    border: "border-amber-400",
  },
  danger: {
    cardBg: "bg-red-400/20",
    badgeBg: "bg-red-400",
    border: "border-red-400",
  },
};

const verdictLabels = {
  safe: "✓ Safe",
  caution: "⚠ Caution",
  danger: "✗ Avoid",
};

/* 🎞️ Verdict-based animation */
const verdictAnimation = {
  safe: {
    y: [0, -2, 0],
    transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
  },
  caution: {
    boxShadow: [
      "0 0 0px rgba(251,191,36,0.0)",
      "0 0 16px rgba(251,191,36,0.4)",
      "0 0 0px rgba(251,191,36,0.0)",
    ],
    transition: { repeat: Infinity, duration: 2.5 },
  },
  danger: {
    scale: [1, 1.03, 1],
    boxShadow: [
      "0 0 0px rgba(239,68,68,0.0)",
      "0 0 20px rgba(239,68,68,0.6)",
      "0 0 0px rgba(239,68,68,0.0)",
    ],
    transition: { repeat: Infinity, duration: 1.5 },
  },
};

const RecentScanCard = ({ scan, onClick, index = 0 }) => {
  if (!scan) return null;

  const score = Number(scan.score ?? 0);
  const verdict = getVerdictFromScore(score);
  const styles = verdictStyles[verdict];

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative flex-shrink-0 w-40 rounded-xl p-3 text-left border mt-6 mb-6",
        styles.cardBg,
        styles.border
      )}
    >
      {/* Animated verdict layer */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={verdictAnimation[verdict]}
      />

      {/* Score badge */}
      <div className="mb-2 flex items-center justify-between relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white",
            styles.badgeBg
          )}
        >
          {score}
        </motion.div>

        <span className="text-xs opacity-80">
          {scan.timestamp
            ? formatDistanceToNowStrict(new Date(scan.timestamp), {
                addSuffix: true,
              })
            : "unknown"}
        </span>
      </div>

      {/* Product info */}
      <h4 className="line-clamp-1 text-sm font-semibold relative z-10">
        {scan.productName || "Unknown Product"}
      </h4>

      {scan.brand && (
        <p className="mt-0.5 text-xs opacity-80 relative z-10">
          {scan.brand}
        </p>
      )}

      {/* Verdict pill */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold text-white relative z-10",
          styles.badgeBg
        )}
      >
        {verdictLabels[verdict]}
      </motion.div>
    </motion.button>
  );
};

export default RecentScanCard;
