import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ScanLine, Heart, ShieldCheck, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnboardingSlide from '@/components/onboarding/OnboardingSlide';

const slides = [
  {
    icon: <ScanLine className="h-14 w-14 text-primary-foreground" />,
    title: 'Scan Any Label',
    description: 'Use your camera to scan ingredient labels, barcodes, or manually enter product names. Our AI reads and analyzes instantly.',
    color: 'from-primary to-primary/80',
  },
  {
    icon: <Heart className="h-14 w-14 text-primary-foreground" />,
    title: 'Personalized Health Insights',
    description: 'Set your health conditions and allergies. Get warnings tailored specifically to your body and dietary needs.',
    color: 'from-accent to-accent/80',
  },
  {
    icon: <ShieldCheck className="h-14 w-14 text-primary-foreground" />,
    title: 'Make Informed Choices',
    description: 'See traffic-light verdicts, understand hidden toxins, and discover healthier alternatives for your family.',
    color: 'from-[hsl(var(--verdict-safe))] to-[hsl(145,60%,35%)]',
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const dragX = useMotionValue(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else {
      navigate('/signup');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    navigate('/signup');
  };

  const handleDragEnd = (_, info) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentSlide < slides.length - 1) {
      handleNext();
    } else if (info.offset.x > threshold && currentSlide > 0) {
      handlePrev();
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.9,
    }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
        <motion.div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl" animate={{ scale: [1, 1.3, 1], x: [0, 40, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" animate={{ scale: [1.2, 1, 1.2], y: [0, -40, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
      </motion.div>

      {/* Skip button */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="absolute top-6 right-6 z-20">
        <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full px-4">
          Skip
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </motion.div>

      {/* Slides Container */}
      <div className="flex-1 relative overflow-hidden touch-pan-y">
        
        {/* LEFT ARROW (Visible only after slide 0) */}
        <AnimatePresence>
          {currentSlide > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden md:block"
            >
              <Button variant="outline" size="icon" onClick={handlePrev} className="rounded-full bg-background/50 backdrop-blur-md">
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RIGHT ARROW (Visible only before last slide) */}
        <AnimatePresence>
          {currentSlide < slides.length - 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden md:block"
            >
              <Button variant="outline" size="icon" onClick={handleNext} className="rounded-full bg-background/50 backdrop-blur-md">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <OnboardingSlide
              icon={slides[currentSlide].icon}
              title={slides[currentSlide].title}
              description={slides[currentSlide].description}
              isActive={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation (The existing buttons at the bottom) */}
      <div className="px-6 pb-8 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-3">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setDirection(index > currentSlide ? 1 : -1);
                setCurrentSlide(index);
              }}
              className="relative h-2 rounded-full bg-muted overflow-hidden"
              animate={{ width: currentSlide === index ? 32 : 8 }}
            >
              {currentSlide === index && (
                <motion.div layoutId="activeDot" className="absolute inset-0 bg-primary" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Bottom Action Row */}
        <div className="flex gap-3 max-w-md mx-auto">
          <AnimatePresence>
            {currentSlide > 0 && (
              <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                <Button variant="outline" size="lg" onClick={handlePrev} className="rounded-2xl h-14 w-14">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            size="lg"
            onClick={handleNext}
            className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-lg"
          >
            {currentSlide < slides.length - 1 ? (
              <span className="flex items-center gap-2">Next <ChevronRight className="h-5 w-5" /></span>
            ) : (
              <span className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Get Started</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;