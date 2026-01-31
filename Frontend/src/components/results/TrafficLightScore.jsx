import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Simple classNames helper (like cn) */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const verdictConfig = {
  safe: {
    gradient: "url(#safeGradient)",
    glow: "glow-safe",
    label: "SAFE TO EAT",
  },
  caution: {
    gradient: "url(#cautionGradient)",
    glow: "glow-caution",
    label: "USE CAUTION",
  },
  danger: {
    gradient: "url(#dangerGradient)",
    glow: "glow-danger",
    label: "AVOID",
  },
};

const sizeConfig = {
  sm: { size: 120, strokeWidth: 8, fontSize: "text-2xl" },
  md: { size: 180, strokeWidth: 10, fontSize: "text-4xl" },
  lg: { size: 240, strokeWidth: 12, fontSize: "text-5xl" },
};

const TrafficLightScore = ({ score, verdict, size = "md", animate = true }) => {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const config = verdictConfig[verdict];
  const sizeConf = sizeConfig[size];

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeOffset = circumference - (displayScore / 100) * circumference;

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();
    const startValue = 0;
    const endValue = score;

    const animateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
      setDisplayScore(currentValue);

      if (progress < 1) requestAnimationFrame(animateCount);
    };

    const timer = setTimeout(() => requestAnimationFrame(animateCount), 300);

    return () => clearTimeout(timer);
  }, [score, animate]);

  return (
    <motion.div
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col items-center"
    >
      {/* SVG Circle */}
      <div className={cn("relative", config.glow)} style={{ width: sizeConf.size, height: sizeConf.size }}>
        <svg className="transform -rotate-90" width={sizeConf.size} height={sizeConf.size} viewBox="0 0 100 100">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="safeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(145, 70%, 45%)" />
              <stop offset="100%" stopColor="hsl(160, 70%, 40%)" />
            </linearGradient>
            <linearGradient id="cautionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 95%, 50%)" />
              <stop offset="100%" stopColor="hsl(35, 90%, 50%)" />
            </linearGradient>
            <linearGradient id="dangerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0, 85%, 55%)" />
              <stop offset="100%" stopColor="hsl(15, 80%, 50%)" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={sizeConf.strokeWidth}
          />

          {/* Animated progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={config.gradient}
            strokeWidth={sizeConf.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayScore}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn("font-bold text-foreground", sizeConf.fontSize)}
            >
              {displayScore}
            </motion.span>
          </AnimatePresence>
          <span className="text-xs text-muted-foreground font-medium mt-1">out of 100</span>
        </div>
      </div>

      {/* Verdict label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.4 }}
        className={cn(
          "mt-4 rounded-full px-4 py-2 font-semibold text-sm tracking-wide",
          verdict === "safe" && "gradient-safe text-white",
          verdict === "caution" && "gradient-caution text-white",
          verdict === "danger" && "gradient-danger text-white"
        )}
      >
        {config.label}
      </motion.div>
    </motion.div>
  );
};

export default TrafficLightScore;
