import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Upload, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const IMAGE_TYPES = [
  { value: 'front', label: 'Front' },
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'packaging', label: 'Packaging' },
];

const Contribute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const barcodeFromState = location.state?.barcode ?? '';

  const [code, setCode] = useState(barcodeFromState);
  const [productName, setProductName] = useState('');
  const [categories, setCategories] = useState('');
  const [imagefield, setImagefield] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    } else {
      setImageFile(null);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      alert('Barcode (code) is required.');
      return;
    }
    if (!productName.trim()) {
      alert('Product name is required.');
      return;
    }
    if (!categories.trim()) {
      alert('Product category is required.');
      return;
    }
    if (!imagefield) {
      alert('Please select an image type.');
      return;
    }
    if (!imageFile) {
      alert('Please upload an image.');
      return;
    }

    setIsSubmitting(true);

    // Front-end only: build payload for future API (no actual submit yet)
    const formData = new FormData();
    formData.append('code', code.trim());
    formData.append('product_name', productName.trim());
    formData.append('categories', categories.trim());
    formData.append('imagefield', imagefield);
    formData.append(`imgupload_${imagefield}`, imageFile);

    console.log('Contribute payload (for future API):', {
      code: code.trim(),
      product_name: productName.trim(),
      categories: categories.trim(),
      imagefield,
      [`imgupload_${imagefield}`]: imageFile?.name,
    });

    // Simulate submit delay; replace with real API call later
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    alert('Thank you for contributing! This will be connected to the backend soon.');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Contribute" showBack />

      <div className="pt-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-100 text-rose-500 mb-3">
              <Heart className="w-7 h-7" fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Help make LabelLens better
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Add product info so others can see ingredients and make informed choices.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Barcode (pre-filled, read-only when coming from scan) */}
            <div className="space-y-2">
              <Label htmlFor="code">Barcode (code)</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 3017620422003"
                className="h-12 rounded-xl font-mono"
              />
              {barcodeFromState && (
                <p className="text-xs text-muted-foreground">
                  Pre-filled from your scan.
                </p>
              )}
            </div>

            {/* Product name */}
            <div className="space-y-2">
              <Label htmlFor="product_name">Product name</Label>
              <Input
                id="product_name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Coca-Cola Classic"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label htmlFor="categories">Product category</Label>
              <Input
                id="categories"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                placeholder="e.g. Orange Juice, Soft Drinks"
                className="h-12 rounded-xl"
              />
            </div>

            {/* Image type dropdown */}
            <div className="space-y-2">
              <Label>Image type</Label>
              <Select value={imagefield} onValueChange={setImagefield}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select image type" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Upload image</Label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="imgupload"
                />
                <div className="h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 hover:border-rose-300 hover:bg-rose-50/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : 'Tap to choose image'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full rounded-xl h-14 bg-rose-500 hover:bg-rose-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" fill="currentColor" />
                  Submit contribution
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Contribute;
