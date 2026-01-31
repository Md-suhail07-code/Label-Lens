import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserProfile } from '@/context/UserProfileContext';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const [showContent, setShowContent] = useState(false);
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 200);
    const taglineTimer = setTimeout(() => setShowTagline(true), 800);

    const navTimer = setTimeout(() => {
      if (profile.onboardingComplete) {
        navigate('/home', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }, 2800);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(taglineTimer);
      clearTimeout(navTimer);
    };
  }, [navigate, profile.onboardingComplete]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background gradients */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-200 opacity-30 filter blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-200 opacity-30 filter blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-blue-100 opacity-20 filter blur-3xl"
          animate={{ 
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-300 opacity-30"
          style={{
            width: 4 + (i % 3) * 2,
            height: 4 + (i % 3) * 2,
            left: `${8 + i * 8}%`,
            top: `${10 + (i % 4) * 22}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="relative z-10 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.8 }}
            >
              {/* Multi-layer glow effect */}
              <motion.div 
                className="absolute inset-0 rounded-3xl bg-blue-200 opacity-40 filter blur-3xl scale-200"
                animate={{ scale: [2, 2.5, 2], opacity: [0.4, 0.6, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-3xl bg-blue-300 opacity-30 filter blur-2xl scale-150"
                animate={{ scale: [1.5, 1.8, 1.5], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
              
              <motion.div
                className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white/90 shadow-2xl overflow-hidden"
                animate={{ y: [0, -5, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/Logo.png"
                  alt="Label Lens"
                  className="h-20 w-20 object-contain relative z-10"
                />
              </motion.div>
            </motion.div>

            {/* App name */}
            <motion.h1
              className="text-5xl font-bold tracking-tight text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.span 
                className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Label
              </motion.span>
              <span className="text-gray-900">-Lens</span>
            </motion.h1>

            {/* Tagline */}
            <AnimatePresence>
              {showTagline && (
                <motion.div
                  className="mt-4 overflow-hidden"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.p
                    className="text-gray-500 text-center max-w-xs text-base"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Decode food labels. Discover hidden toxins.
                    <br />
                    <span className="text-blue-500 font-medium">Make informed choices.</span>
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading dots */}
            <motion.div
              className="mt-10 flex gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplashScreen;
