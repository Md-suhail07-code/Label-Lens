import React from "react";
import { motion } from "framer-motion";

const ScannerOverlay = ({ isScanning = false, mode = "camera" }) => {
  // Frame size: square for camera, rectangle for barcode
  const frameSize = mode === "camera" 
    ? { width: 300, height: 300 } 
    : { width: 320, height: 160 };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Darkened edges (Gradient) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Scanner frame */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: frameSize.width, height: frameSize.height }}>
          
          {/* Corner brackets */}
          <CornerBracket position="top-left" />
          <CornerBracket position="top-right" />
          <CornerBracket position="bottom-left" />
          <CornerBracket position="bottom-right" />

          {/* Scanning beam (only for barcode) */}
          {isScanning && mode === "barcode" && (
            <motion.div
              className="absolute left-2 right-2 h-1 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              initial={{ top: "0%" }}
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Mode indicator Text */}
          <div className="absolute -bottom-16 left-0 right-0 text-center">
            <span className="text-white font-medium text-shadow-sm bg-black/40 px-3 py-1 rounded-full text-sm">
              {mode === "camera"
                ? "Position label in frame"
                : "Center barcode in frame"}
            </span>
          </div>
        </div>
      </div>

      {/* Scanning indicator Pill */}
      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-32 left-0 right-0 flex justify-center"
        >
          <div className="flex items-center gap-2 rounded-full bg-blue-600/90 px-4 py-2 text-white shadow-lg backdrop-blur-sm">
            <motion.div
              className="h-2 w-2 rounded-full bg-white"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium">Scanning...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const CornerBracket = ({ position }) => {
  const positionClasses = {
    "top-left": "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
    "top-right": "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
    "bottom-left": "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
    "bottom-right": "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
  };

  return (
    <div className={`absolute w-8 h-8 border-white ${positionClasses[position]}`}></div>
  );
};

export default ScannerOverlay;