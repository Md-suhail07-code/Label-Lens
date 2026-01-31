import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ScanLine, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner'; // Switched to sonner as per your 2nd component
import axios from 'axios';

// Verification Screen in Label-Lens Theme
const VerificationSentMessage = ({ email }) => (
  <motion.div 
    className="w-full max-w-md text-center"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="glass rounded-3xl p-8 shadow-xl border border-white/20">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative mx-auto w-20 h-20 mb-6"
      >
        <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-lg">
          <Mail className="h-10 w-10 text-primary-foreground" />
        </div>
      </motion.div>
      
      <h2 className="text-3xl font-bold text-foreground mb-4">Verify Your Email</h2>
      
      <p className="text-muted-foreground mb-6 leading-relaxed">
        We've sent a verification link to <br />
        <span className="font-semibold text-primary break-all">{email}</span>
      </p>
      
      <div className="bg-primary/5 rounded-2xl p-4 mb-8 border border-primary/10">
        <p className="text-sm text-muted-foreground">
          Please check your inbox (and spam folder) to activate your account.
        </p>
      </div>
      
      <Link to="/login" className="block">
        <Button variant="glow" size="lg" className="w-full h-12 rounded-xl gradient-primary shadow-lg group">
          Go to Login
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  </motion.div>
);

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const passwordStrength = () => {
    if (formData.password.length === 0) return { level: 0, text: '', color: '' };
    if (formData.password.length < 6) return { level: 1, text: 'Weak', color: 'bg-red-600' };
    if (formData.password.length < 10) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
    return { level: 3, text: 'Strong', color: 'bg-green-500' };
  };

  const strength = passwordStrength();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    setIsLoading(true);

    try {
      const res = await axios.post('https://label-lens-backend.onrender.com/api/users/signup', formData);
      
      if (res.status === 201 || res.data.success) {
        setVerificationSent(true);
        toast.success("Account created! Please verify your email.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Shared Animated background elements */}
      <motion.div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Shared Floating icons */}
      {[ScanLine, Check, Sparkles].map((Icon, i) => (
        <motion.div
          key={i}
          className="absolute text-primary/20 hidden sm:block"
          style={{ left: `${20 + i * 30}%`, top: `${15 + i * 5}%` }}
          animate={{ y: [-15, 15, -15], rotate: [-10, 10, -10] }}
          transition={{ duration: 4 + i, repeat: Infinity }}
        >
          <Icon className="h-10 w-10" />
        </motion.div>
      ))}

      <motion.div
        className="w-full flex flex-col items-center z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Branding */}
        <motion.div className="flex flex-col items-center mb-8" variants={itemVariants}>
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-150" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <ScanLine className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient-primary">Label</span>
            <span className="text-foreground">-Lens</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {verificationSent ? (
            <VerificationSentMessage email={formData.email} key="verification" />
          ) : (
            <motion.div
              key="form"
              variants={itemVariants}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass rounded-3xl p-6 sm:p-8 shadow-xl w-full max-w-md border border-white/20"
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-foreground">Create account</h2>
                <p className="text-muted-foreground text-sm">Start your healthy journey today</p>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      placeholder="John Doe"
                      className="pl-10 h-11 bg-background/50"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-11 bg-background/50"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-11 bg-background/50"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3].map((l) => (
                          <div key={l} className={`h-1 flex-1 rounded-full ${l <= strength.level ? strength.color : 'bg-muted'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{strength.text}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeTerms}
                    onCheckedChange={setAgreeTerms}
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                    I agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all group"
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-background/50 text-muted-foreground">or</span></div>
              </div>

              <Button variant="outline" className="w-full h-11 rounded-xl bg-background/50" onClick={() => toast.info("Google Signup coming soon!")}>
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>

              <p className="text-center mt-6 text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-semibold hover:opacity-80">Sign in</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Signup;