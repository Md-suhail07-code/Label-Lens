import axios from 'axios';

const OFF_HEADERS = {
  "User-Agent": "LabelLens/1.0 (Educational Project)",
  "Accept": "application/json"
};

/** Try OFF product API; returns product object or null */
async function fetchOffProduct(code, base = 'org') {
  const host = base === 'net' ? 'world.openfoodfacts.net' : 'world.openfoodfacts.org';
  const url = `https://${host}/api/v0/product/${code}.json`;
  try {
    const res = await axios.get(url, {
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) {
    console.log(`   OFF ${base} failed:`, e.message);
  }
  return null;
}

/** Try OFF v2 product API (.net); returns product object or null */
async function fetchOffProductV2(code) {
  try {
    const url = `https://world.openfoodfacts.net/api/v2/product/${code}`;
    const res = await axios.get(url, {
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const data = res.data;
    if (res.status === 200 && data && typeof data === 'object' && data.status === 1 && data.product) return data.product;
  } catch (e) {
    console.log('   OFF v2 .net failed:', e.message);
  }
  return null;
}

/** Fallback: search by barcode (search_terms); returns product object or null */
async function searchOffByCode(code) {
  try {
    const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
      params: {
        search_terms: code,
        search_simple: 1,
        action: 'process',
        json: 1,
        fields: 'code,product_name,product_name_en,brands,ingredients_text,ingredients_text_en,image_url,image_front_url,nutriscore_grade'
      },
      headers: OFF_HEADERS,
      timeout: 8000,
      validateStatus: () => true
    });
    const products = res.data?.products || [];
    const match = products.find(p => String(p.code || '') === String(code));
    return match || products[0] || null;
  } catch (e) {
    console.log('   Search API failed:', e.message);
  }
  return null;
}

/** Build API response shape from OFF product object */
function buildResultData(product) {
  const nutriScore = (product.nutriscore_grade || 'unknown').toLowerCase();
  let derivedVerdict = 'moderate';
  let derivedScore = 50;
  if (['a', 'b'].includes(nutriScore)) { derivedVerdict = 'safe'; derivedScore = 15; }
  else if (['c', 'd'].includes(nutriScore)) { derivedVerdict = 'moderate'; derivedScore = 55; }
  else if (nutriScore === 'e') { derivedVerdict = 'unsafe'; derivedScore = 85; }

  return {
    productName: product.product_name || product.product_name_en || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    image: product.image_front_url || product.image_url || null,
    ingredients: product.ingredients_text || product.ingredients_text_en || "Ingredients list not available.",
    riskScore: derivedScore,
    verdict: derivedVerdict,
    analysisSummary: `NutriScore: ${nutriScore.toUpperCase()}. (MVP: Detailed analysis is a placeholder).`,
    flaggedIngredients: derivedVerdict === 'unsafe' ? [{ name: "High Risk Additives", reason: "Low NutriScore (E)." }] : [],
    alternatives: []
  };
}

// --- CONTROLLER: Process Barcode Search ---
const processBarcodeSearch = async (req, res) => {
  try {
    const rawBarcode = req.body?.barcode;
    if (rawBarcode == null || String(rawBarcode).trim() === '') {
      return res.status(400).json({ success: false, message: "No barcode provided." });
    }

    const barcode = String(rawBarcode).trim();
    console.log(`🔹 Processing barcode: ${barcode}`);

    // 1) Try .org v0 product API
    let product = await fetchOffProduct(barcode, 'org');
    if (product) {
      console.log('✅ Found via OFF .org v0');
      const resultData = buildResultData(product);
      return res.json({ success: true, data: resultData });
    }

    // 2) Try .net v0 (often works when .org fails from server)
    product = await fetchOffProduct(barcode, 'net');
    if (product) {
      console.log('✅ Found via OFF .net v0');
      const resultData = buildResultData(product);
      return res.json({ success: true, data: resultData });
    }

    // 3) Try .net v2 product API
    product = await fetchOffProductV2(barcode);
    if (product) {
      console.log('✅ Found via OFF .net v2');
      const resultData = buildResultData(product);
      return res.json({ success: true, data: resultData });
    }

    // 4) Fallback: search by barcode (search_terms)
    product = await searchOffByCode(barcode);
    if (product) {
      console.log('✅ Found via OFF search API');
      const resultData = buildResultData(product);
      return res.json({ success: true, data: resultData });
    }

    console.log('❌ Product not found in OFF (tried .org, .net, search).');
    return res.json({
      success: false,
      message: "Product not found. Please try scanning again."
    });
  } catch (error) {
    console.error("🔥 Server Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error connecting to product database."
    });
  }
};

// Placeholder for Image Scan (Keep to prevent router errors if you have this route defined)
const processImageScan = async (req, res) => {
    return res.json({ success: false, message: "Image scan not implemented in MVP." });
};

export { processBarcodeSearch, processImageScan };
