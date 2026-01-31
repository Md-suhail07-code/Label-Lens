export const healthConditions = [
  {
    id: 'diabetes',
    name: 'Diabetes',
    icon: '🩸',
    description: 'Monitors sugar, artificial sweeteners, and high-GI ingredients',
    color: 'from-red-400 to-orange-400',
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    icon: '❤️',
    description: 'Tracks sodium, MSG, and blood pressure affecting additives',
    color: 'from-pink-400 to-red-400',
  },
  {
    id: 'pcod',
    name: 'PCOD/PCOS',
    icon: '🌸',
    description: 'Identifies hormone-disrupting ingredients and inflammatory foods',
    color: 'from-purple-400 to-pink-400',
  },
  {
    id: 'celiac',
    name: 'Celiac Disease',
    icon: '🌾',
    description: 'Detects gluten and cross-contamination risks',
    color: 'from-amber-400 to-yellow-400',
  },
  {
    id: 'heart_disease',
    name: 'Heart Disease',
    icon: '💗',
    description: 'Monitors trans fats, cholesterol, and sodium levels',
    color: 'from-rose-400 to-red-500',
  },
  {
    id: 'kidney_disease',
    name: 'Kidney Disease',
    icon: '🫘',
    description: 'Tracks phosphorus, potassium, and sodium content',
    color: 'from-emerald-400 to-teal-400',
  },
  {
    id: 'obesity',
    name: 'Weight Management',
    icon: '⚖️',
    description: 'Identifies hidden calories, sugars, and unhealthy fats',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'ibs',
    name: 'IBS',
    icon: '🫃',
    description: 'Detects FODMAPs and gut-irritating ingredients',
    color: 'from-green-400 to-emerald-400',
  },
];

export const allergies = [
  {
    id: 'peanuts',
    name: 'Peanuts',
    icon: '🥜',
    description: 'Peanuts and peanut-derived ingredients',
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    icon: '🌰',
    description: 'Almonds, cashews, walnuts, and other tree nuts',
  },
  {
    id: 'dairy',
    name: 'Dairy',
    icon: '🥛',
    description: 'Milk, cheese, butter, and lactose products',
  },
  {
    id: 'gluten',
    name: 'Gluten',
    icon: '🍞',
    description: 'Wheat, barley, rye, and gluten proteins',
  },
  {
    id: 'soy',
    name: 'Soy',
    icon: '🫘',
    description: 'Soybeans, soy sauce, and soy lecithin',
  },
  {
    id: 'shellfish',
    name: 'Shellfish',
    icon: '🦐',
    description: 'Shrimp, crab, lobster, and mollusks',
  },
  {
    id: 'eggs',
    name: 'Eggs',
    icon: '🥚',
    description: 'Eggs and egg-derived ingredients',
  },
  {
    id: 'fish',
    name: 'Fish',
    icon: '🐟',
    description: 'Fish and fish-derived products',
  },
];

export const getConditionById = (id) => {
  return healthConditions.find(c => c.id === id);
};

export const getAllergyById = (id) => {
  return allergies.find(a => a.id === id);
};
