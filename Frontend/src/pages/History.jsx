import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const verdictStyles = {
  safe: { bg: 'bg-green-100', text: 'text-green-600' },
  caution: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
  danger: { bg: 'bg-red-100', text: 'text-red-600' },
};

const History = () => {
  const navigate = useNavigate();
  const { history, removeScan, clearHistory, setCurrentScan } = useScanHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredHistory = history.filter(scan => {
    const matchesSearch =
      (scan.productName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scan.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterVerdict === 'all' || scan.verdict === filterVerdict;
    return matchesSearch && matchesFilter;
  });

  const handleScanClick = (scan) => {
    // 1. Set Context
    setCurrentScan(scan);
    // 2. Navigate with correct key 'result' matching ResultsPage
    navigate('/results', { state: { result: scan } });
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    removeScan(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Scan History" showBack />

      <div className="pt-20 px-6">
        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-xl"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 overflow-hidden"
              >
                {['all', 'safe', 'caution', 'danger'].map((filter) => (
                  <motion.button
                    key={filter}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilterVerdict(filter)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
                      filterVerdict === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* List */}
        {filteredHistory.length > 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {filteredHistory.map((scan, index) => {
              const styles = verdictStyles[scan.verdict] || verdictStyles.caution;
              return (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleScanClick(scan)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className={cn(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-lg',
                    styles.bg,
                    styles.text
                  )}>
                    {scan.score}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{scan.productName}</h3>
                    <p className="text-sm text-gray-500">{scan.brand}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(e, scan.id)}
                    className="shrink-0 h-9 w-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                </div>
            </div>
            <h3 className="text-gray-900 font-medium">No History Found</h3>
            <p className="text-gray-500 text-sm mt-1">Scan products to build your history.</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default History;