import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, ScanLine, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

const EmailVerify = () => {
    const [status, setStatus] = useState('Verifying your email address...');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            setStatus("Missing verification token.");
            setIsError(true);
            return;
        }

        const verifyEmail = async () => {
            try {
                // Adjust this URL to your actual backend endpoint
                const res = await axios.post(`https://label-lens-backend.onrender.com/api/users/verify-email`, {}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (res.data.success) {
                    setStatus("Email Verified Successfully!");
                    setIsSuccess(true);
                    toast.success("Identity confirmed! Welcome to Label-Lens.");
                } else {
                    setStatus("Invalid or Expired Token.");
                    setIsError(true);
                }
            } catch (error) {
                console.error("Verification Error:", error);
                const errorMessage = error.response?.data?.message || 'Verification failed. Link may be expired.';
                setStatus(errorMessage);
                setIsError(true);
            }
        };

        verifyEmail();
    }, [token]);

    const IconComponent = isSuccess ? CheckCircle : (isError ? XCircle : Loader2);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-6">
            {/* Ambient Label-Lens Background */}
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

            {/* Logo Header */}
            <motion.div 
                className="flex flex-col items-center mb-10 z-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="relative mb-3">
                    <div className="absolute inset-0 rounded-2xl bg-primary/30 blur-xl scale-150" />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-lg">
                        <ScanLine className="h-6 w-6 text-primary-foreground" />
                    </div>
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                    <span className="text-gradient-primary">Label</span>
                    <span className="text-foreground">-Lens</span>
                </h1>
            </motion.div>

            {/* Glassmorphism Verification Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass rounded-3xl p-8 sm:p-12 shadow-xl w-full max-w-md border border-white/20 text-center z-10"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isSuccess ? 'success' : isError ? 'error' : 'loading'}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex flex-col items-center"
                    >
                        {/* Dynamic Status Icon */}
                        <div className="relative mb-8">
                            {isSuccess && (
                                <motion.div 
                                    className="absolute inset-0 bg-green-500/20 blur-2xl scale-150 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                            )}
                            <IconComponent 
                                className={`h-20 w-20 relative z-10 ${
                                    isSuccess ? 'text-green-500' : 
                                    isError ? 'text-destructive' : 
                                    'text-primary animate-spin'
                                }`} 
                            />
                        </div>

                        <h2 className="text-3xl font-bold text-foreground mb-4 font-display">
                            {isSuccess ? 'Verified!' : isError ? 'Oops!' : 'Verifying...'}
                        </h2>
                        
                        <p className={`text-base leading-relaxed mb-10 ${
                            isError ? 'text-destructive font-medium' : 'text-muted-foreground'
                        }`}>
                            {status}
                        </p>

                        {/* Action Buttons */}
                        <div className="w-full space-y-4">
                            {isSuccess ? (
                                <Link to="/login" className="block w-full">
                                    <Button size="lg" className="w-full h-12 rounded-xl gradient-primary shadow-lg group">
                                        Sign In
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            ) : isError ? (
                                <div className="space-y-3">
                                    <Link to="/signup" className="block w-full">
                                        <Button size="lg" className="w-full h-12 rounded-xl gradient-primary">
                                            Back to Signup
                                        </Button>
                                    </Link>
                                    <Link to="/login" className="block w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
                                        Already verified? Log in
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-xs uppercase tracking-widest text-primary/60 font-bold animate-pulse">
                                    Establishing Secure Connection
                                </p>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </motion.div>

            {/* Decorative Background Icon */}
            <motion.div 
                className="absolute bottom-10 opacity-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <Sparkles className="h-24 w-24 text-primary" />
            </motion.div>
        </div>
    );
}

export default EmailVerify;