import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle, XCircle, Search, X, Star, TrendingUp, Shield, Award } from 'lucide-react';
import { useScanHistory } from '@/context/ScanHistoryContext'; // Import Context

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
  const [activeTab, setActiveTab] = useState('ingredients');

  useEffect(() => {
    // If no data exists in State OR Context, redirect to scanner
    if (!result) {
      navigate('/scanner');
      return;
    }

    if (result.alternatives && result.alternatives.length > 0) {
      const altNames = result.alternatives.map(a => typeof a === 'string' ? { productName: a } : a);
      fetchAlternativesImages(altNames);
    } else {
      setLoadingAlts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const fetchAlternativesImages = async (altObjects) => {
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

  const getVerdictColor = (verdict) => {
    const v = (verdict || '').toLowerCase();
    if (v === 'safe') return 'from-emerald-500 to-teal-600';
    if (v === 'moderate' || v === 'caution') return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-600';
  };

  const getVerdictIcon = (verdict) => {
    const v = (verdict || '').toLowerCase();
    if (v === 'safe') return <Shield className="h-10 w-10 text-white" />;
    if (v === 'moderate' || v === 'caution') return <TrendingUp className="h-10 w-10 text-white" />;
    return <XCircle className="h-10 w-10 text-white" />;
  };

  const getNutriScoreColor = (grade) => {
    switch(grade) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-lime-500 text-white';
      case 'C': return 'bg-yellow-500 text-gray-900';
      case 'D': return 'bg-orange-500 text-white';
      case 'E': return 'bg-red-500 text-white';
      default: return 'bg-gray-300 text-gray-800';
    }
  };

  // Safe check before render
  if (!result) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pb-20">
      
      {/* Header with Gradient Background */}
      <div className="relative">
        <div className="h-80 w-full overflow-hidden relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${getVerdictColor(result.verdict)} opacity-20`} />
          <img 
            src={result.image} 
            className="w-full h-full object-cover blur-md scale-110" 
            alt="Scan context" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          <button 
            onClick={() => navigate('/history')}
            className="absolute top-6 left-6 text-white bg-white/20 backdrop-blur-md p-3 rounded-full z-10 hover:bg-white/30 transition-all duration-300 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Floating Verdict Card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className={`bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 transform transition-all duration-500 hover:scale-[1.02]`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold capitalize text-gray-800">
                  {result.verdict === 'caution' ? 'Moderate Risk' : result.verdict}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-700">Risk Score</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-800">{result.score || result.riskScore}/100</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                {getVerdictIcon(result.verdict)}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-gray-700 font-medium leading-relaxed">
                {result.analysisSummary}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-24" />

      {/* Tab Navigation */}
      <div className="px-6 mb-6">
        <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 py-3 px-4 rounded-xl text-center font-medium transition-all duration-300 ${
              activeTab === 'ingredients'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Ingredients
          </button>
          <button
            onClick={() => setActiveTab('alternatives')}
            className={`flex-1 py-3 px-4 rounded-xl text-center font-medium transition-all duration-300 ${
              activeTab === 'alternatives'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Alternatives
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 space-y-6">
          
          {/* Tab Content */}
          {activeTab === 'ingredients' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-orange-400 to-red-500 p-3 rounded-xl">
                  <XCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-xl">Ingredient Analysis</h3>
              </div>
              
              {result.flaggedIngredients && result.flaggedIngredients.length > 0 ? (
                  <div className="space-y-4">
                    {result.flaggedIngredients.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                        >
                          <div className="flex items-start gap-4">
                            <div className="bg-red-100 p-3 rounded-xl mt-1">
                              <XCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-bold text-gray-800 text-lg">{item.name || item.ingredientName}</h4>
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                  Risk Factor
                                </span>
                              </div>
                              <p className="text-gray-600 leading-relaxed">{item.reason}</p>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
              ) : (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800 text-lg">Clean Ingredients</h4>
                    <p className="text-green-700">No harmful ingredients detected in this product!</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'alternatives' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-3 rounded-xl">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-xl">Better Alternatives</h3>
              </div>
              
              {loadingAlts ? (
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <p className="text-gray-600 font-medium">Scouting for healthier options...</p>
                  </div>
              ) : (
                  alternatives.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {alternatives.map((alt, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                          >
                            <div className="relative h-48 bg-gray-50 overflow-hidden">
                              {alt.image ? (
                                  <img src={alt.image} alt={alt.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-100 to-gray-200">
                                    <Search className="h-12 w-12 text-gray-400" />
                                  </div>
                              )}
                              {alt.nutriscore && (
                                <div className={`absolute top-3 right-3 ${getNutriScoreColor(alt.nutriscore)} px-3 py-1 rounded-full font-bold text-sm`}>
                                  {alt.nutriscore}
                                </div>
                              )}
                              <div className="absolute bottom-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                HEALTHY CHOICE
                              </div>
                            </div>
                            
                            <div className="p-4">
                              <h4 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 leading-tight">{alt.name}</h4>
                              <p className="text-gray-500 text-sm mb-3 truncate">{alt.brand}</p>
                              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105">
                                View Details
                              </button>
                            </div>
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200 text-center">
                      <Award className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                      <h4 className="font-bold text-amber-800 text-lg mb-2">No Alternatives Found</h4>
                      <p className="text-amber-700">Try scanning other products for better alternatives</p>
                    </div>
                  )
              )}
            </div>
          )}
      </div>
    </div>
  );
};

export default ResultsPage;