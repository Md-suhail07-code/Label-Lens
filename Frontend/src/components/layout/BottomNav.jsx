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
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2"
    >
      <div className="mx-auto max-w-md rounded-2xl bg-white/70 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors",
                  isActive
                    ? "core"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl bg-blue-600/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 relative z-10",
                    isActive && "core"
                  )}
                />
                <span className="text-xs font-medium relative z-10">
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
