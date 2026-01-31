import React, { createContext, useContext, useState, useEffect } from 'react';

const ScanHistoryContext = createContext();
const STORAGE_KEY = 'label-lens-history';
const MAX_HISTORY_ITEMS = 50;

export const ScanHistoryProvider = ({ children }) => {
  const [history, setHistory] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map(item => ({
            ...item,
            // Ensure we hydrate strings back into Date objects on load
            timestamp: new Date(item.timestamp),
          }));
        } catch (e) {
          console.error("Failed to parse history", e);
          return [];
        }
      }
    }
    return [];
  });

  const [currentScan, setCurrentScan] = useState(null);

  // ✅ FIX 1: Robust saving logic
  // Checks if timestamp is a Date object before calling toISOString
  useEffect(() => {
    const dataToSave = history.map(item => ({
        ...item,
        timestamp: item.timestamp instanceof Date 
            ? item.timestamp.toISOString() 
            : item.timestamp // If it's already a string, just save it
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [history]);

  // ✅ FIX 2: Ensure consistency when adding
  const addScan = (result) => {
    // Force the incoming item to have a Date object for consistency
    const newItem = {
        ...result,
        timestamp: new Date(result.timestamp || Date.now()) 
    };

    setHistory(prev => {
      const newHistory = [newItem, ...prev];
      return newHistory.slice(0, MAX_HISTORY_ITEMS);
    });
    setCurrentScan(newItem);
  };

  const removeScan = id => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ScanHistoryContext.Provider
      value={{
        history,
        addScan,
        removeScan,
        clearHistory,
        currentScan,
        setCurrentScan,
      }}
    >
      {children}
    </ScanHistoryContext.Provider>
  );
};

export const useScanHistory = () => {
  const context = useContext(ScanHistoryContext);
  if (!context) {
    throw new Error('useScanHistory must be used within a ScanHistoryProvider');
  }
  return context;
};