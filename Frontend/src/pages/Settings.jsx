import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, AlertTriangle, ChevronRight, Trash2, LogOut, User, Edit3, Check, X, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { getConditionById, getAllergyById } from '@/data/healthData';
import { toast } from 'sonner';
import axios from 'axios';

const Settings = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, logout } = useUserProfile();
  const { clearHistory, history } = useScanHistory();

  // State for username editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const API_BASE = "https://label-lens-backend.onrender.com/api/users";
  const token = localStorage.getItem("accessToken");

  const handleUpdateUsername = async () => {
    if (!newName.trim() || newName === profile.user.username) {
      setIsEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await axios.put(`${API_BASE}/update-user`,
        { username: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        updateProfile({ user: res.data.user });
        toast.success("Username updated!");
        setIsEditingName(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update name");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call backend logout if necessary (to blacklist token/clear sessions)
      await axios.post(`${API_BASE}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      logout(); // Context function to clear local storage and state
      navigate('/login', { replace: true });
      toast.success("Logged out successfully");
    }
  };

  const handleResetProfile = () => {
    if (window.confirm('Reset everything? This cannot be undone.')) {
      logout(); // Uses same logic as logout to wipe data
      navigate('/signup', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Settings" showBack />

      <div className="pt-24 px-6 space-y-6">
        {/* User Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1 sm:text-sm">
            Account
          </h2>
          <div className="glass rounded-3xl p-4 sm:p-5 border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-8 w-full sm:w-32 bg-background"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-500"
                          onClick={handleUpdateUsername}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500"
                          onClick={() => setIsEditingName(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <p className="font-bold text-lg text-foreground">{profile.user?.username}</p>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{profile.user?.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/10 self-start sm:self-auto flex items-center gap-2 border-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-red-600" />
                <span className="text-red-600 font-bold text-md">Logout</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Health Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
            Health Lens
          </h2>
          <div className="space-y-3">
            {/* Conditions */}
            <div className="glass rounded-3xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Conditions</p>
                    <p className="text-xs text-muted-foreground">{profile.user?.healthCondition?.length || 0} active</p>
                  </div>
                </div>
                <Button variant="core" size="sm" onClick={() => navigate('/health-profile')} className="rounded-full px-4 h-8 text-xs hover:grdient-primary">
                  Edit
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.user?.healthCondition?.map(id => (
                  <span key={id} className="px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                    {getConditionById(id)?.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="glass rounded-3xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Allergies</p>
                    <p className="text-xs text-muted-foreground">{profile.user?.allergies?.length || 0} active</p>
                  </div>
                </div>
                <Button variant="core" size="sm" onClick={() => navigate('/health-profile')} className="rounded-full px-4 h-8 text-xs">
                  Edit
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.user?.allergies?.map(id => (
                  <span key={id} className="px-3 py-1 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                    {getAllergyById(id)?.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Management Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
            Management
          </h2>
          <div className="space-y-2">
            <button onClick={() => { if (confirm("Clear history?")) clearHistory(); }} className="w-full flex items-center justify-between glass p-4 rounded-2xl border border-border hover:bg-muted/50 transition-all">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Clear Scan History</span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">{history.length}</span>
            </button>

            <button onClick={handleResetProfile} className="w-full flex items-center justify-between glass p-4 rounded-2xl border border-destructive/20 hover:bg-destructive/5 transition-all text-destructive">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Reset All Data</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="p-6 rounded-3xl gradient-primary text-white shadow-xl relative overflow-hidden">
          <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-20 rotate-12" />
          <h3 className="font-bold text-xl mb-1">Label-Lens</h3>
          <p className="text-white/80 text-xs leading-relaxed mb-4">
            Decode hidden toxins and inflammatory additives with AI insights.
          </p>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded-lg">VER 1.0.0</span>
            <span className="text-[10px] font-medium opacity-60">BUILDATHON 2K26</span>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Settings;