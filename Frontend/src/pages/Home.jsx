import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Barcode, PenLine, Sparkles, ChevronRight } from 'lucide-react';
import { useUserProfile } from '@/context/UserProfileContext';
import { useScanHistory } from '@/context/ScanHistoryContext';
import QuickActionCard from '@/components/home/QuickActionCard';
import RecentScanCard from '@/components/home/RecentScanCard';
import BottomNav from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';

const healthTips = [
  "💡 Did you know? 'Natural flavors' can include up to 100 different chemicals!",
  "🔍 Check for 'partially hydrogenated' oils - they contain trans fats even if the label says 0g.",
  "⚠️ 'Sugar-free' doesn't mean healthy - artificial sweeteners have their own risks.",
  "🌿 Ingredients are listed by weight - the first few ingredients matter most.",
  "🚫 Beware of 'made with whole grains' - check if whole grain is actually the first ingredient.",
];

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { history, setCurrentScan } = useScanHistory();

  // Safe slice
  const recentScans = history ? history.slice(0, 5) : [];
  const randomTip = healthTips[Math.floor(Math.random() * healthTips.length)];

  const handleScanClick = (scan) => {
    // 1. Set Context
    setCurrentScan(scan);
    // 2. Navigate with correct key 'result' matching ResultsPage
    navigate('/results', { state: { result: scan } });
  };

  const username = profile.user?.username || 'User';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hello {username}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to decode some labels?
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow cursor-pointer"
            onClick={() => navigate('/scanner')}
          >
            <Camera className="h-6 w-6 text-primary-foreground" />
          </motion.div>
        </div>
      </motion.div>

      {/* Health tip banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-6 mb-6"
      >
        <div className="rounded-2xl bg-gradient-to-r from-primary from-opacity-10 to-accent to-opacity-10 border border-primary border-opacity-20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary bg-opacity-20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                Daily Health Tip
              </p>
              <p className="text-sm text-foreground">{randomTip}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Scan</h2>
        <div className="space-y-3">
          <QuickActionCard
            icon={Camera}
            title="Camera Scan"
            description="Take a photo of the ingredient label"
            onClick={() => navigate('/scanner', { state: { mode: 'camera' } })}
            gradient="gradient-primary"
            delay={0.1}
          />
          <QuickActionCard
            icon={Barcode}
            title="Barcode Scan"
            description="Scan product barcode for instant lookup"
            onClick={() => navigate('/scanner', { state: { mode: 'barcode' } })}
            gradient="gradient-caution"
            delay={0.2}
          />
          <QuickActionCard
            icon={PenLine}
            title="Manual Entry"
            description="Type product name or paste ingredients"
            onClick={() => navigate('/manual-entry')}
            gradient="gradient-safe"
            delay={0.3}
          />
        </div>
      </div>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Scans</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-muted-foreground"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {recentScans.map((scan, index) => (
              <RecentScanCard key={scan.id || index} scan={scan} index={index} onClick={() => handleScanClick(scan)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {recentScans.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-6 rounded-2xl border border-dashed border-border p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground mb-2">No scans yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by scanning your first product to see personalized health insights!
          </p>
          <Button onClick={() => navigate('/scanner')} className="rounded-xl gradient-primary text-primary-foreground">
            <Camera className="h-4 w-4 mr-2" />
            Scan Now
          </Button>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
};

export default Home;