import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Simple reusable button (replaces shadcn Button)
 */
const IconButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 active:scale-95"
  >
    {children}
  </button>
);

const Header = ({
  title,
  showBack = false,
  showNotification = false,
  transparent = false,
  rightElement,
}) => {
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 ${
        transparent ? "" : "bg-white/70 backdrop-blur-md shadow-sm"
      }`}
    >
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <IconButton onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
          )}

          {title && (
            <h1 className="text-lg font-semibold tracking-tight">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {rightElement}
          {showNotification && (
            <IconButton>
              <Bell className="h-5 w-5" />
            </IconButton>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
