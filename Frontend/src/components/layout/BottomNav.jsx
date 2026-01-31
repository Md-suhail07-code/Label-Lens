import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, ScanLine, History, Settings } from "lucide-react";

/**
 * Simple cn() helper for JSX (since no TypeScript + shadcn utils)
 */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: ScanLine, label: "Scan", path: "/scanner" },
  { icon: History, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2"
    >
      <div className="mx-auto max-w-md rounded-[28px] bg-white/80 backdrop-blur-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] border border-white/60">
        <div className="flex items-center justify-around gap-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 min-w-[64px] py-2.5 rounded-[20px] transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-[20px] bg-primary/12"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 relative z-10",
                    isActive && "text-primary"
                  )}
                />
                <span className={cn(
                  "text-[11px] font-medium relative z-10",
                  isActive ? "text-primary" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNav;
