import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Baby, FlaskConical, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useUserProfile } from '@/context/UserProfileContext';
import { healthConditions, allergies as allergiesData } from '@/data/healthData';
import ConditionTag from '@/components/profile/ConditionTag';
import { toast } from 'sonner';
import axios from 'axios';

const HealthProfile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, completeOnboarding } = useUserProfile();
  const [step, setStep] = useState('conditions');
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper to update local context state before final API call
  const toggleItem = (listName, itemId) => {
    const currentList = profile.user?.[listName] || [];
    const newList = currentList.includes(itemId)
      ? currentList.filter(id => id !== itemId)
      : [...currentList, itemId];
    
    updateProfile({ user: { ...profile.user, [listName]: newList } });
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    const token = localStorage.getItem('accessToken');

    try {
      const res = await axios.put(
        `https://label-lens-backend.onrender.com/api/users/update-user/`,
        {
          healthCondition: profile.user.healthCondition || [],
          allergies: profile.user.allergies || []
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data.success) {
        completeOnboarding();
        toast.success("Profile updated successfully!");
        navigate('/home', { replace: true });
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error(error.response?.data?.message || "Failed to sync profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'conditions':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Do you have any health conditions?</h2>
              <p className="text-muted-foreground mt-1 text-sm">Select all that apply for personalized warnings.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {healthConditions.map((condition) => (
                <ConditionTag
                  key={condition.id}
                  id={condition.id}
                  type="condition"
                  isSelected={profile.user?.healthCondition?.includes(condition.id)}
                  onToggle={() => toggleItem('healthCondition', condition.id)}
                />
              ))}
            </div>
            <Button size="lg" onClick={() => setStep('allergies')} className="w-full rounded-xl gradient-primary text-primary-foreground">
              Continue <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </motion.div>
        );

      case 'allergies':
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Any food allergies?</h2>
              <p className="text-muted-foreground mt-1 text-sm">We'll flag these allergens immediately when detected.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {allergiesData.map((allergy) => (
                <ConditionTag
                  key={allergy.id}
                  id={allergy.id}
                  type="allergy"
                  isSelected={profile.user?.allergies?.includes(allergy.id)}
                  onToggle={() => toggleItem('allergies', allergy.id)}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep('conditions')} className="rounded-xl">Back</Button>
              <Button 
                size="lg" 
                disabled={isUpdating}
                onClick={handleComplete} 
                className="flex-1 rounded-xl gradient-primary text-primary-foreground"
              >
                {isUpdating ? <Loader2 className="animate-spin h-5 w-5" /> : "Start Scanning"}
                {!isUpdating && <ChevronRight className="h-5 w-5 ml-1" />}
              </Button>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  const steps = ['conditions', 'allergies'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="flex gap-2">
            {steps.map((s, index) => (
              <div key={s} className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full gradient-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: index <= currentStepIndex ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default HealthProfile;