import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Share2, ChevronLeft, ChevronDown, ChevronUp, 
  AlertTriangle, CheckCircle, FileText
} from 'lucide-react';
import { useScanHistory } from '@/context/ScanHistoryContext';

// --- UTILITY COMPONENT: SCORE RING ---
function ScoreRing({ score, max = 100 }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const percentage = (score / max) * 100;
    const newOffset = circumference - (percentage / 100) * circumference;
    setTimeout(() => setOffset(newOffset), 100);
  }, [score, max, circumference]);

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="transform -rotate-90 w-full h-full drop-shadow-md">
        <circle cx="50%" cy="50%" r={radius} stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="transparent" />
        <circle cx="50%" cy="50%" r={radius} stroke="#FFFFFF" strokeWidth="6" fill="transparent" 
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" 
                className="transition-all duration-[1500ms] ease-out" />
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
  const bgGradient = status === 'safe' 
    ? 'linear-gradient(180deg, #34C759 0%, #30D158 100%)' 
    : status === 'moderate'
    ? 'linear-gradient(180deg, #FF9500 0%, #FFAB00 100%)' 
    : 'linear-gradient(180deg, #FF3B30 0%, #FF5F45 100%)';

  const statusText = status === 'safe' ? 'SAFE.' : status === 'moderate' ? 'CAUTION.' : 'AVOID.';
  
  return (
    <div className="relative w-full">
      <div className="absolute top-0 left-0 w-full h-[340px] rounded-b-[40px] shadow-sm overflow-hidden z-0 transition-colors duration-500"
           style={{ background: bgGradient }}>
         {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
             style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="relative z-20 px-6 pt-12 flex justify-between items-start">
        <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
          <ChevronLeft className="text-white w-6 h-6" />
        </button>
        <button onClick={onShare} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
          <Share2 className="text-white w-5 h-5" />
        </button>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center w-full">
        <div className="flex flex-col items-center">
           <ScoreRing score={riskScore} />
           <h1 className="text-5xl font-black text-white mt-3 tracking-tighter drop-shadow-sm leading-none uppercase">{statusText}</h1>
           <div className="mt-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
             <p className="text-white font-semibold text-xs tracking-wide uppercase">
               {status === 'safe' ? 'Clean Ingredients' : 'Contains Toxicity'}
             </p>
           </div>
        </div>
        <div className="mt-8 relative z-20">
          <div className="w-[180px] bg-white rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] p-4 flex flex-col items-center border border-gray-100">
             <div className="w-full aspect-[4/5] flex items-center justify-center overflow-hidden rounded-lg mb-3 bg-gray-50">
               {productImage ? (
                 <img src={productImage} alt={productName} className="w-full h-full object-contain mix-blend-multiply" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-300"><AlertTriangle className="w-8 h-8" /></div>
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

// --- COMPONENT: RISK ACCORDION ---
function RiskAccordion({ title, icon, items, theme }) {
  const [isOpen, setIsOpen] = useState(true);
  const themes = {
    red: { header: 'bg-[#FFF5F5] text-[#E02D3C]', indicator: 'text-[#E02D3C]' },
    green: { header: 'bg-[#F0FDF4] text-[#16A34A]', indicator: 'text-[#16A34A]' }
  };
  const currentTheme = themes[theme] || themes.red;

  if (!items || items.length === 0) return null;

  return (
    <div className={`mb-3 overflow-hidden rounded-[20px] border border-gray-100 transition-all duration-300 w-full`}>
      <button onClick={() => setIsOpen(!isOpen)} className={`w-full px-5 py-4 flex items-center justify-between ${currentTheme.header} transition-colors cursor-pointer`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/50">{icon}</div>
          <span className="font-bold text-xs tracking-wider uppercase">{title}</span>
        </div>
        {isOpen ? <ChevronUp className={`w-5 h-5 ${currentTheme.indicator}`} /> : <ChevronDown className={`w-5 h-5 ${currentTheme.indicator}`} />}
      </button>
      <div className={`bg-white transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 py-2">
          {items.map((item, index) => (
            <div key={index} className={`py-4 ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{item.name}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.reason}</p>
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
function BetterAlternatives({ alternatives }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="w-full pt-4 pb-12 bg-white">
      <div className="px-6 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Healthy Swaps</h2>
      </div>
      <div className="grid grid-cols-3 gap-3 px-6">
        {alternatives.map((alt, index) => (
          <div key={index} className="bg-white rounded-[16px] border border-gray-100 p-2 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="relative aspect-square mb-2 rounded-xl overflow-hidden bg-gray-50 border border-gray-50">
               {alt.image ? (
                  <img src={alt.image} alt={alt.name} className="w-full h-full object-contain" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center"><span className="text-xs text-gray-300">No Img</span></div>
               )}
            </div>
            <p className="font-bold text-gray-900 text-[10px] mb-1 truncate leading-tight">{alt.name}</p>
            <p className="text-[9px] text-gray-400 truncate mb-2">{alt.brand || "Suggested"}</p>
            <button className="w-full py-1.5 rounded-lg bg-gray-900 text-white text-[9px] font-bold mt-auto active:scale-95 cursor-pointer">
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
  const { currentScan } = useScanHistory();
  
  // Combine state from nav or context. 
  // NOTE: The backend now provides full data, so we don't need client-side fetching.
  const result = location.state?.result || currentScan;

  useEffect(() => {
    if (!result) navigate('/scanner');
  }, [result, navigate]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `LabelLens Check`,
          text: `I scanned ${result?.productName}. Risk Score: ${result?.riskScore}/100.`,
          url: window.location.href,
        });
      } catch (error) { console.log('Error sharing:', error); }
    } else { alert("Share not supported"); }
  };

  if (!result) return null;

  // Destructure Data
  const { productName, image, ingredients, flaggedIngredients = [], alternatives = [], riskScore, verdict, analysisSummary } = result;

  const isSafe = (verdict || "").toLowerCase() === "safe";
  const isModerate = (verdict || "").toLowerCase() === "moderate";
  const status = isSafe ? "safe" : isModerate ? "moderate" : "unsafe";

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
        <div className="w-full max-w-md bg-white min-h-screen shadow-2xl overflow-hidden flex flex-col">
        
        <ProductHeader 
          status={status}
          productName={productName}
          productImage={image}
          riskScore={riskScore || 0}
          onBack={() => navigate(-1)}
          onShare={handleShare}
        />

           <div className="px-6 -mt-4 relative z-20 flex flex-col gap-3">
             {/* Ingredients / Summary Card */}
             <div className="w-full bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-full bg-blue-50">
                    <FileText className="w-4 h-4 text-blue-600" />
                 </div>
                 <span className="font-bold text-xs tracking-wider uppercase text-gray-500">Analysis</span>
               </div>
               <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                 {analysisSummary || ingredients}
               </p>
             </div>

             {/* Risks */}
             <div className="flex flex-col gap-1">
               {flaggedIngredients.length > 0 ? (
                  <RiskAccordion 
                    title="Harmful Ingredients" 
                    theme="red"
                    icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
                    items={flaggedIngredients}
                  />
               ) : (
                 <div className="bg-green-50 border border-green-100 rounded-[20px] p-5 flex items-center gap-4">
                   <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                   <div><h4 className="font-bold text-gray-900 text-sm">Clean Label</h4><p className="text-xs text-gray-600">No harmful additives detected.</p></div>
                 </div>
               )}
             </div>

             <div className="h-px bg-gray-100 mx-2 my-2" /> 

             {/* Alternatives - No loading state needed as backend provides them */}
             <div className="-mx-6">
                <BetterAlternatives alternatives={alternatives} />
             </div>
           </div>
        </div>
    </div>
  );
};

export default ResultsPage;