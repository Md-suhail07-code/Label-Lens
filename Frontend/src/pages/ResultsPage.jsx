import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Share2, 
  ChevronLeft, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Skull, 
  Ban, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { useScanHistory } from '@/context/ScanHistoryContext';

// --- UTILITY COMPONENT: SCORE RING ---
function ScoreRing({ score, max = 100, theme = 'unsafe' }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    // animate on load
    const percentage = (score / max) * 100;
    const newOffset = circumference - (percentage / 100) * circumference;
    setTimeout(() => setOffset(newOffset), 100);
  }, [score, max, circumference]);

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="transform -rotate-90 w-full h-full drop-shadow-md">
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#FFFFFF"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-[1500ms] ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center text-white">
        <span className="text-2xl font-black tracking-tighter leading-none">{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">Risk</span>
      </div>
    </div>
  );
}

// --- COMPONENT: HEADER ---
function ProductHeader({ status, productName, productImage, riskScore, onBack, onShare }) {
  // Determine gradient based on status
  const bgGradient = status === 'safe' 
    ? 'linear-gradient(180deg, #34C759 0%, #30D158 100%)' // Green for Safe
    : status === 'moderate'
    ? 'linear-gradient(180deg, #FF9500 0%, #FFAB00 100%)' // Orange for Moderate
    : 'linear-gradient(180deg, #FF3B30 0%, #FF5F45 100%)'; // Red for Unsafe

  const statusText = status === 'safe' ? 'SAFE.' : status === 'moderate' ? 'CAUTION.' : 'AVOID.';
  
  return (
    <div className="relative w-full">
      <div 
        className="absolute top-0 left-0 w-full h-[340px] rounded-b-[40px] shadow-sm overflow-hidden z-0 transition-colors duration-500"
        style={{ background: bgGradient }}
      >
        <div 
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Nav Buttons */}
      <div className="relative z-20 px-6 pt-12 flex justify-between items-start">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
        >
          <ChevronLeft className="text-white w-6 h-6" />
        </button>
        <button 
          onClick={onShare}
          className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
        >
          <Share2 className="text-white w-5 h-5" />
        </button>
      </div>

      {/* Main Stats */}
      <div className="relative z-10 mt-2 flex flex-col items-center w-full">
        <div className="flex flex-col items-center">
           <ScoreRing score={riskScore} />
           <h1 className="text-5xl font-black text-white mt-3 tracking-tighter drop-shadow-sm leading-none uppercase">
             {statusText}
           </h1>
           <div className="mt-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
             <p className="text-white font-semibold text-xs tracking-wide uppercase">
               {status === 'safe' ? 'Clean Ingredients' : 'Contains Toxicity'}
             </p>
           </div>
        </div>

        {/* Product Image Card */}
        <div className="mt-8 relative z-20">
          <div className="w-[180px] bg-white rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] p-4 flex flex-col items-center border border-gray-100">
             <div className="w-full aspect-[4/5] flex items-center justify-center overflow-hidden rounded-lg mb-3 bg-gray-50">
               {productImage ? (
                 <img 
                   src={productImage} 
                   alt={productName}
                   className="w-full h-full object-contain mix-blend-multiply"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300">
                   <AlertTriangle className="w-8 h-8" />
                 </div>
               )}
             </div>
             <span className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg text-center leading-tight line-clamp-1 max-w-full">
               {productName || "Unknown Product"}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: AI INSIGHT ---
function AIInsight({ analysis }) {
  const text = analysis || "No analysis available.";
  return (
    <div className="px-6 w-full">
      <div className="bg-white/80 backdrop-blur-xl border border-purple-100 rounded-[24px] p-5 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-full blur-[40px] opacity-40" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 text-lg">✦</span>
            <h3 className="font-bold text-gray-900 text-base">AI Assessment</h3>
          </div>
          
          <div className="text-gray-600 text-sm leading-relaxed">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: RISK ACCORDION ---
function RiskAccordion({ title, icon, items, theme }) {
  const [isOpen, setIsOpen] = useState(true); // Default open for better UX

  const themes = {
    red: {
      header: 'bg-[#FFF5F5] text-[#E02D3C]',
      border: 'border-[#FFD6D9]',
      iconBg: 'bg-[#FFE4E6]',
      indicator: 'text-[#E02D3C]'
    },
    orange: {
      header: 'bg-[#FFFAF0] text-[#D97706]',
      border: 'border-[#FDE68A]',
      iconBg: 'bg-[#FEF3C7]',
      indicator: 'text-[#D97706]'
    },
    black: {
      header: 'bg-[#F3F4F6] text-[#1F2937]',
      border: 'border-[#E5E7EB]',
      iconBg: 'bg-[#E5E7EB]',
      indicator: 'text-[#4B5563]'
    },
    green: {
      header: 'bg-[#F0FDF4] text-[#16A34A]',
      border: 'border-[#BBF7D0]',
      iconBg: 'bg-[#DCFCE7]',
      indicator: 'text-[#16A34A]'
    }
  };

  const currentTheme = themes[theme] || themes.black;

  if (!items || items.length === 0) return null;

  return (
    <div className={`mb-3 overflow-hidden rounded-[20px] border ${currentTheme.border} transition-all duration-300 w-full`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 flex items-center justify-between ${currentTheme.header} transition-colors active:opacity-90 cursor-pointer`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${currentTheme.iconBg}`}>
            {icon}
          </div>
          <span className="font-bold text-xs tracking-wider uppercase">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className={`w-5 h-5 ${currentTheme.indicator}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${currentTheme.indicator}`} />
        )}
      </button>

      <div 
        className={`bg-white transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 py-2">
          {items.map((item, index) => (
            <div key={index} className={`py-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  theme === 'red' ? 'bg-red-400' : theme === 'orange' ? 'bg-orange-400' : 'bg-gray-400'
                }`} />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{item.name || item.ingredientName}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    {item.reason}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: BETTER ALTERNATIVES ---
function BetterAlternatives({ alternatives, loading }) {
  if (loading) {
    return (
      <div className="w-full pt-4 pb-12 bg-white px-6">
        <div className="flex items-center gap-2 mb-4">
            <Loader2 className="animate-spin w-4 h-4 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Finding Swaps...</h2>
        </div>
      </div>
    );
  }

  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="w-full pt-4 pb-12 bg-white">
      <div className="px-6 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Healthy Swaps</h2>
      </div>
      
      <div className="grid grid-cols-3 gap-3 px-6">
        {alternatives.map((alt, index) => (
          <div 
            key={index} 
            className="bg-white rounded-[16px] border border-gray-100 p-2 flex flex-col shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-square mb-2 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
               {alt.image ? (
                  <img 
                    src={alt.image} 
                    alt={alt.name}
                    className="w-full h-full object-contain"
                  />
               ) : (
                 <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-300">No Img</span>
                 </div>
               )}
               {alt.nutriscore && (
                 <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                   {alt.nutriscore}
                 </div>
               )}
            </div>
            <p className="font-bold text-gray-900 text-[10px] mb-1 truncate leading-tight">{alt.name}</p>
            <p className="text-[9px] text-gray-400 truncate mb-2">{alt.brand}</p>
            
            <button className="w-full py-1.5 rounded-lg bg-gray-900 text-white text-[9px] font-bold mt-auto transition-transform active:scale-95 cursor-pointer">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get Data from Context (as backup)
  const { currentScan } = useScanHistory();
  
  // 2. Get Data from Navigation State (Primary)
  const { result: stateResult } = location.state || {};

  // 3. Determine Final Result Data
  const result = stateResult || currentScan;

  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(true);

  useEffect(() => {
    if (!result) {
      navigate('/scanner');
      return;
    }
    const alts = result.alternatives || [];
    if (alts.length > 0) {
      const altNames = alts.map(a => typeof a === 'string' ? { productName: a } : a);
      fetchAlternativesImages(altNames);
    } else {
      setLoadingAlts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const fetchAlternativesImages = async (altObjects) => {
    // If images already exist, skip fetch
    if (altObjects[0]?.image) {
      setAlternatives(altObjects);
      setLoadingAlts(false);
      return;
    }

    const enrichedAlts = await Promise.all(
      altObjects.map(async (alt) => {
        try {
          const searchTerm = alt.productName || alt.name || alt;
          const res = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
            params: {
              search_terms: searchTerm,
              search_simple: 1,
              action: 'process',
              json: 1,
              fields: 'product_name,image_front_url,image_url,brands,nutriscore_grade'
            }
          });

          const product = res.data.products?.[0];
          return {
            name: searchTerm,
            image: product ? (product.image_front_url || product.image_url) : null,
            brand: product ? product.brands : "Generic",
            nutriscore: product ? product.nutriscore_grade?.toUpperCase() : null
          };
        } catch (e) {
          return { name: alt.productName || alt, image: null, brand: "Generic", nutriscore: null };
        }
      })
    );
    
    setAlternatives(enrichedAlts);
    setLoadingAlts(false);
  };

  // Safe check before render
  if (!result) return null;

  // Real data from Open Food Facts: NAME, IMAGE URL, INGREDIENTS
  const productName = result.productName || "Scanned Product";
  const productImage = result.image || null;
  const ingredients = result.ingredients || result.analysisSummary || "Ingredients not available.";
  // Placeholders for the rest
  const analysisSummary = result.analysisSummary || "Product info from Open Food Facts. Detailed analysis coming soon.";
  const flaggedIngredients = result.flaggedIngredients || [];

  const isSafe = (result.verdict || "").toLowerCase() === "safe";
  const isModerate = (result.verdict || "").toLowerCase() === "caution" || (result.verdict || "").toLowerCase() === "moderate";
  const status = isSafe ? "safe" : isModerate ? "moderate" : "unsafe";
  const riskScore = typeof result.score === "number" ? result.score : (typeof result.riskScore === "number" ? result.riskScore : (isSafe ? 10 : 90));

  const statusLabel = status === "safe" ? "SAFE" : status === "moderate" ? "CAUTION" : "AVOID";

  const handleShare = async () => {
    const shareText = `${productName} – ${statusLabel} (Label Lens)\n\nScanned with Label Lens. Risk score: ${riskScore}/100`;
    const shareData = {
      title: productName,
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          try {
            await navigator.clipboard.writeText(shareText);
            alert("Copied to clipboard!");
          } catch {
            alert("Sharing failed. Try copying manually.");
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert("Copied to clipboard!");
      } catch {
        alert("Sharing not supported. Try copying manually.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header: name and image from OFF (or placeholder) */}
        <ProductHeader 
          status={status}
          productName={productName}
          productImage={productImage}
          riskScore={riskScore}
          onBack={() => navigate(-1)}
          onShare={handleShare}
        />

        <div className="flex flex-col gap-6 mt-6 pb-4 relative z-10 w-full px-6">
           
           {/* Ingredients from Open Food Facts */}
           <div className="-mx-6">
             <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[24px] p-5 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-gray-100 rounded-full blur-[40px] opacity-40" />
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <h3 className="font-bold text-gray-900 text-base">Ingredients</h3>
                 </div>
                 <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-h-[4.5rem] overflow-y-auto">
                   {ingredients}
                 </div>
               </div>
             </div>
           </div>

           {/* AI Insight Card (placeholder) */}
           <div className="-mx-6">
             <AIInsight analysis={analysisSummary} />
           </div>
           
           <div className="flex flex-col gap-1 -mt-2">
             {flaggedIngredients.length > 0 ? (
                <>
                  <RiskAccordion 
                    title="Harmful Ingredients" 
                    theme="red"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    items={flaggedIngredients}
                  />
                  {/* If you have categorized data in 'result', you can add more accordions here.
                      For now, we assume all flagged items go into the main red accordion. 
                   */}
                </>
             ) : (
               /* Safe State Card if no ingredients flagged */
               <div className="bg-green-50 border border-green-100 rounded-[20px] p-5 flex items-center gap-4">
                 <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-900 text-sm">Clean Label</h4>
                    <p className="text-xs text-gray-600">No harmful additives detected.</p>
                 </div>
               </div>
             )}
           </div>

           <div className="h-px bg-gray-100 mx-2" /> 

           {/* Better Alternatives Section */}
           <div className="-mx-6">
              <BetterAlternatives 
                alternatives={alternatives}
                loading={loadingAlts}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
