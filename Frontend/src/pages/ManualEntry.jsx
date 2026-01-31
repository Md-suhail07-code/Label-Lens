import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { useScanHistory } from '@/context/ScanHistoryContext';
import { useUserProfile } from '@/context/UserProfileContext';
import { searchProduct, generateWarnings } from '@/data/mockProducts';

const ManualEntry = () => {
  const navigate = useNavigate();
  const { addScan } = useScanHistory();
  const { profile } = useUserProfile();

  const [productName, setProductName] = useState('');
  const [ingredientsList, setIngredientsList] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('product');

  const handleSearch = async () => {
    const query = activeTab === 'product' ? productName : ingredientsList;
    if (!query.trim()) return;

    setIsSearching(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = searchProduct(query);

    if (result) {
      // Generate personalized warnings
      const warnings = generateWarnings(
        result.ingredients,
        profile.conditions,
        profile.allergies
      );

      const finalResult = {
        ...result,
        personalizedWarnings: warnings,
      };

      addScan(finalResult);
      navigate('/results');
    }

    setIsSearching(false);
  };

  // Sample products for quick selection
  const sampleProducts = [
    'Oreo Cookies',
    'Maggi Noodles',
    'Greek Yogurt',
    'Diet Coke',
    'Protein Bar',
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Manual Entry" showBack />

      <div className="pt-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Introduction */}
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Enter Product Details
            </h2>
            <p className="text-muted-foreground mt-1">
              Search by product name or paste the ingredients list directly.
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 rounded-xl h-12">
              <TabsTrigger value="product" className="rounded-lg">
                Product Name
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="rounded-lg">
                Ingredients List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="product" className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search product name..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="pl-12 h-12 rounded-xl text-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Quick samples */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Try these:</p>
                <div className="flex flex-wrap gap-2">
                  {sampleProducts.map((product) => (
                    <motion.button
                      key={product}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProductName(product)}
                      className="px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {product}
                    </motion.button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-4 space-y-4">
              <Textarea
                placeholder={`Paste ingredients list here...

Example:
Enriched Flour, Sugar, Palm Oil, Cocoa, High Fructose Corn Syrup, Soy Lecithin, Artificial Flavor...`}
                value={ingredientsList}
                onChange={(e) => setIngredientsList(e.target.value)}
                className="min-h-[200px] rounded-xl text-base resize-none"
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Copy the ingredients list from the product packaging or website
              </p>
            </TabsContent>
          </Tabs>

          {/* Analyze button */}
          <Button
            size="lg"
            onClick={handleSearch}
            disabled={
              isSearching || 
              (activeTab === 'product' ? !productName.trim() : !ingredientsList.trim())
            }
            className="w-full rounded-xl gradient-primary text-primary-foreground h-14"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Product
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ManualEntry;
