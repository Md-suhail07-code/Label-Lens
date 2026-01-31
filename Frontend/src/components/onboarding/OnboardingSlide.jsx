import React from "react";
import { motion } from "framer-motion";

/**
 * Simple classNames helper (like `cn`) 
 * Accepts strings and filters falsy values
 */
const cn = (...classes) => classes.filter(Boolean).join(" ");

const OnboardingSlide = ({ icon, title, description, isActive }) => {
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center px-8 text-center",
        "min-h-[65vh]"
      )}
    >
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotateY: -30 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
          type: "spring",
          stiffness: 200,
        }}
        className="relative mb-10"
      >
        {/* Multi-layer glow effect */}
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/30 blur-3xl scale-150"
          animate={{
            scale: [1.5, 1.8, 1.5],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl scale-125"
          animate={{
            scale: [1.25, 1.4, 1.25],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />

        {/* Icon container with floating animation */}
        <motion.div
          className="relative flex h-36 w-36 items-center justify-center rounded-3xl gradient-primary shadow-xl"
          animate={{
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-2xl bg-white/10 backdrop-blur-sm" />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            {icon}
          </motion.div>

          {/* Orbiting dots */}
          {[0, 120, 240].map((rotation, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary-foreground/60"
              style={{
                top: "50%",
                left: "50%",
              }}
              animate={{
                rotate: [rotation, rotation + 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-primary-foreground/60"
                style={{
                  transform: "translateX(32px) translateY(-50%)",
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Title with gradient effect */}
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-2xl md:text-3xl font-bold text-foreground mb-4 leading-tight"
      >
        {title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="text-muted-foreground max-w-sm leading-relaxed text-base"
      >
        {description}
      </motion.p>
    </motion.div>
  );
};

export default OnboardingSlide;
