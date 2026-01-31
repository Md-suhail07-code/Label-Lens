// Health Conditions
// Possible values for health conditions
// 'diabetes', 'hypertension', 'pcod', 'celiac', 'heart_disease', 'kidney_disease', 'obesity', 'ibs'

// Possible values for allergies
// 'peanuts', 'tree_nuts', 'dairy', 'gluten', 'soy', 'shellfish', 'eggs', 'fish'

// Explanation modes
// 'kid' or 'scientist'

// Example user profile object
/*
const userProfile = {
  name: "John Doe",
  conditions: ["diabetes", "hypertension"], // array of health conditions
  allergies: ["peanuts", "dairy"], // array of allergies
  explanationMode: "kid", // "kid" or "scientist"
  familyMode: false,
  familyMembers: [
    {
      id: "1",
      name: "Jane Doe",
      conditions: ["pcod"],
      allergies: ["gluten"]
    }
  ],
  onboardingComplete: true
};
*/

// Ingredient analysis
/*
const ingredient = {
  name: "Sugar",
  safety: "caution", // "safe", "caution", "danger"
  reason: "High sugar content",
  hiddenName: "Sucrose"
};
*/

// Scan result / product
/*
const scanResult = {
  id: "scan1",
  productName: "Chocolate Bar",
  brand: "SweetTreats",
  imageUrl: "https://example.com/image.jpg",
  barcode: "123456789",
  timestamp: new Date(),
  score: 65,
  verdict: "caution", // "safe", "caution", "danger"
  ingredients: [ingredient],
  personalizedWarnings: [
    {
      condition: "diabetes", // HealthCondition or Allergy
      message: "High sugar content may affect your blood sugar",
      severity: "warning", // "warning" or "danger"
      ingredient: "Sugar"
    }
  ],
  aiExplanation: {
    kid: "This chocolate has a lot of sugar. Be careful!",
    scientist: "Contains high levels of sucrose, potentially affecting glycemic response."
  },
  alternatives: [
    {
      id: "alt1",
      name: "Dark Chocolate",
      brand: "HealthySweets",
      imageUrl: "",
      score: 85,
      verdict: "safe"
    }
  ]
};
*/

// Scanner state
/*
const scannerState = {
  mode: "camera", // "camera", "barcode", "manual"
  isScanning: false,
  isProcessing: false,
  error: null
};
*/

// Condition metadata example
/*
const conditionInfo = {
  id: "diabetes",
  name: "Diabetes",
  icon: "🩸",
  description: "A condition affecting blood sugar levels.",
  color: "red"
};

const allergyInfo = {
  id: "peanuts",
  name: "Peanuts",
  icon: "🥜",
  description: "Allergic reaction to peanuts."
};
*/
