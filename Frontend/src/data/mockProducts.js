// Dangerous/hidden ingredients database
const dangerousIngredients = [
  { name: 'High Fructose Corn Syrup', safety: 'danger', reason: 'Hidden sugar that spikes blood glucose rapidly', hiddenName: 'HFCS' },
  { name: 'Monosodium Glutamate', safety: 'caution', reason: 'Can trigger headaches and raise blood pressure', hiddenName: 'MSG' },
  { name: 'Sodium Nitrite', safety: 'danger', reason: 'Linked to increased cancer risk when consumed regularly' },
  { name: 'Partially Hydrogenated Oil', safety: 'danger', reason: 'Contains trans fats that damage heart health' },
  { name: 'Tartrazine', safety: 'caution', reason: 'Artificial color linked to hyperactivity', hiddenName: 'Yellow 5' },
  { name: 'Aspartame', safety: 'caution', reason: 'Artificial sweetener with controversial health effects' },
  { name: 'Sodium Benzoate', safety: 'caution', reason: 'Preservative that may form carcinogenic benzene' },
  { name: 'BHA/BHT', safety: 'danger', reason: 'Preservatives classified as possible carcinogens' },
  { name: 'Carrageenan', safety: 'caution', reason: 'May cause gut inflammation and digestive issues' },
  { name: 'Potassium Bromate', safety: 'danger', reason: 'Banned in many countries as a possible carcinogen' },
];

const safeIngredients = [
  { name: 'Whole Wheat Flour', safety: 'safe', reason: 'Good source of fiber and nutrients' },
  { name: 'Olive Oil', safety: 'safe', reason: 'Heart-healthy monounsaturated fats' },
  { name: 'Sea Salt', safety: 'safe', reason: 'Natural mineral salt in moderation' },
  { name: 'Cane Sugar', safety: 'caution', reason: 'Natural but still adds calories' },
  { name: 'Cocoa', safety: 'safe', reason: 'Rich in antioxidants' },
  { name: 'Oats', safety: 'safe', reason: 'Excellent source of fiber' },
  { name: 'Almonds', safety: 'safe', reason: 'Healthy fats and protein' },
  { name: 'Honey', safety: 'caution', reason: 'Natural sweetener but high in sugars' },
];

// Generate personalized warnings based on user conditions
const generateWarnings = (ingredients, conditions, allergies) => {
  const warnings = [];

  ingredients.forEach(ing => {
    // Diabetes warnings
    if (conditions.includes('diabetes')) {
      if (ing.name.toLowerCase().includes('sugar') || 
          ing.name.toLowerCase().includes('syrup') ||
          ing.name.toLowerCase().includes('fructose')) {
        warnings.push({
          condition: 'diabetes',
          message: `Contains ${ing.name} - may spike blood sugar levels`,
          severity: 'danger',
          ingredient: ing.name,
        });
      }
    }

    // Hypertension warnings
    if (conditions.includes('hypertension')) {
      if (ing.name.toLowerCase().includes('sodium') || 
          ing.name.toLowerCase().includes('msg') ||
          ing.name.toLowerCase().includes('salt')) {
        warnings.push({
          condition: 'hypertension',
          message: `High sodium alert: ${ing.name} may raise blood pressure`,
          severity: 'warning',
          ingredient: ing.name,
        });
      }
    }

    // Celiac/Gluten warnings
    if (conditions.includes('celiac') || allergies.includes('gluten')) {
      if (ing.name.toLowerCase().includes('wheat') || 
          ing.name.toLowerCase().includes('barley') ||
          ing.name.toLowerCase().includes('gluten')) {
        warnings.push({
          condition: 'celiac',
          message: `⚠️ GLUTEN DETECTED: ${ing.name}`,
          severity: 'danger',
          ingredient: ing.name,
        });
      }
    }

    // PCOD warnings
    if (conditions.includes('pcod')) {
      if (ing.safety === 'danger' && 
          (ing.name.toLowerCase().includes('hydrogenated') ||
           ing.name.toLowerCase().includes('artificial'))) {
        warnings.push({
          condition: 'pcod',
          message: `${ing.name} may disrupt hormonal balance`,
          severity: 'warning',
          ingredient: ing.name,
        });
      }
    }
  });

  // Allergy warnings
  allergies.forEach(allergy => {
    ingredients.forEach(ing => {
      const ingLower = ing.name.toLowerCase();
      if (
        (allergy === 'peanuts' && ingLower.includes('peanut')) ||
        (allergy === 'dairy' && (ingLower.includes('milk') || ingLower.includes('lactose') || ingLower.includes('whey'))) ||
        (allergy === 'soy' && ingLower.includes('soy')) ||
        (allergy === 'eggs' && ingLower.includes('egg')) ||
        (allergy === 'shellfish' && (ingLower.includes('shrimp') || ingLower.includes('crab'))) ||
        (allergy === 'fish' && ingLower.includes('fish')) ||
        (allergy === 'tree_nuts' && (ingLower.includes('almond') || ingLower.includes('cashew') || ingLower.includes('walnut')))
      ) {
        warnings.push({
          condition: allergy,
          message: `🚨 ALLERGEN ALERT: Contains ${ing.name}`,
          severity: 'danger',
          ingredient: ing.name,
        });
      }
    });
  });

  return warnings;
};

// Mock product database
const mockProducts = [
  // (same product objects as in your TS file, omitted here for brevity)
];

// Get a random product for demo
const getRandomProduct = () => {
  const randomIndex = Math.floor(Math.random() * mockProducts.length);
  return { ...mockProducts[randomIndex], id: Date.now().toString(), timestamp: new Date() };
};

// Search products by name or barcode
const searchProduct = (query) => {
  const lowerQuery = query.toLowerCase();
  const found = mockProducts.find(
    p => p.productName.toLowerCase().includes(lowerQuery) ||
         p.barcode === query ||
         (p.brand && p.brand.toLowerCase().includes(lowerQuery))
  );
  
  if (found) {
    return { ...found, id: Date.now().toString(), timestamp: new Date() };
  }
  
  // Return a generated product for unknown queries
  return generateProductFromQuery(query);
};

// Generate a mock product from a query
const generateProductFromQuery = (query) => {
  const randomScore = Math.floor(Math.random() * 60) + 20; // 20-80
  const verdict = randomScore >= 70 ? 'safe' : randomScore >= 45 ? 'caution' : 'danger';
  
  // Mix of safe and dangerous ingredients
  const ingredientPool = [...safeIngredients, ...dangerousIngredients];
  const shuffled = ingredientPool.sort(() => Math.random() - 0.5);
  const selectedIngredients = shuffled.slice(0, Math.floor(Math.random() * 5) + 4);
  
  return {
    id: Date.now().toString(),
    productName: query,
    brand: 'Unknown Brand',
    timestamp: new Date(),
    score: randomScore,
    verdict,
    ingredients: selectedIngredients,
    personalizedWarnings: [],
    aiExplanation: {
      kid: `I scanned "${query}" and found some ingredients that need attention! Some are good, but watch out for the ones marked in red - they might not be the best for your body.`,
      scientist: `Analysis of "${query}" reveals a mixed ingredient profile. The product contains both beneficial whole food components and processed additives. Further analysis of specific concentrations would be needed for a complete nutritional assessment.`,
    },
    alternatives: [],
  };
};

// Export functions and data
export {
  dangerousIngredients,
  safeIngredients,
  generateWarnings,
  mockProducts,
  getRandomProduct,
  searchProduct,
};
