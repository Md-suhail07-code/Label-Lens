import React from "react";
import { motion } from "framer-motion";
import { Camera, Barcode, PenLine } from "lucide-react";

const modes = [
  { id: "camera", icon: Camera, label: "Photo" },
  { id: "barcode", icon: Barcode, label: "Barcode" },
  { id: "manual", icon: PenLine, label: "Manual" },
];

const ScanModeToggle = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center gap-1 rounded-full bg-black/50 p-1 backdrop-blur-md border border-white/10">
      {modes.map((m) => {
        const isActive = mode === m.id;
        const Icon = m.icon;

        return (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            className="relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 outline-none"
          >
            {/* Active Background Pill */}
            {isActive && (
              <motion.div
                layoutId="activeScanMode"
                className="absolute inset-0 rounded-full bg-white"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            
            {/* Icon & Label */}
            <div className={`relative z-10 flex items-center gap-2 ${isActive ? "text-black" : "text-gray-300"}`}>
                <Icon size={16} />
                <span>{m.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ScanModeToggle;