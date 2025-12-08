import React, { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, ChevronRight, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, GripVertical, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Category state
  const [categoryForm, setCategoryForm] = useState({
    speciesName: '',
    speciesIcon: null as File | null,
    availability: true
  });

  // Product state
  const [productForm, setProductForm] = useState({
    species: '',
    productName: '',
    productImage: null as File | null,
    description: '',
    nutritionFacts: '',
    cutTypes: [] as string[],
    currentCutType: '',
    availableStock: '',
    defaultProfit: '',
    defaultDiscount: '',
    costPricePerKg: '',
    availability: true
  });

  // Product Variant state
  const [variantForm, setVariantForm] = useState({
    species: '',
    product: '',
    variantName: '',
    cutType: '',
    featured: false,
    bestSeller: false,
    displayPrice: '',
    discount: '',
    sellingPrice: '',
    notes: '',
    availability: true
  });

  // Mock data - now using state for reordering
  const [categories, setCategories] = useState([
    { id: 1, icon: '🦐', name: 'Prawns', availability: 'Available', dateCreated: '2024-01-15', lastUpdated: '2024-11-20' },
    { id: 2, icon: '🐟', name: 'Fish', availability: 'Available', dateCreated: '2024-01-15', lastUpdated: '2024-11-18' },
    { id: 3, icon: '🦀', name: 'Crab', availability: 'Available', dateCreated: '2024-01-16', lastUpdated: '2024-11-15' },
    { id: 4, icon: '🦑', name: 'Squid', availability: 'Unavailable', dateCreated: '2024-01-20', lastUpdated: '2024-11-10' },
    { id: 5, icon: '🦞', name: 'Lobster', availability: 'Available', dateCreated: '2024-02-01', lastUpdated: '2024-11-22' }
  ]);

  const [products, setProducts] = useState([
    { id: 1, image: '', name: 'Tiger Prawns', species: 'Prawns', cutTypes: ['Whole Cleaned', 'Peeled'], stock: 125, costPrice: 320, profit: 15, discount: 10, status: 'Active', lastUpdated: '2024-11-28' },
    { id: 2, image: '', name: 'King Prawns', species: 'Prawns', cutTypes: ['Whole', 'Peeled', 'Deveined'], stock: 80, costPrice: 450, profit: 20, discount: 5, status: 'Active', lastUpdated: '2024-11-27' },
    { id: 3, image: '', name: 'Salmon', species: 'Fish', cutTypes: ['Fillet', 'Steak', 'Whole'], stock: 45, costPrice: 580, profit: 18, discount: 8, status: 'Active', lastUpdated: '2024-11-26' },
    { id: 4, image: '', name: 'Pomfret', species: 'Fish', cutTypes: ['Whole Cleaned', 'Curry Cut'], stock: 60, costPrice: 340, profit: 15, discount: 12, status: 'Active', lastUpdated: '2024-11-25' },
    { id: 5, image: '', name: 'Mud Crab', species: 'Crab', cutTypes: ['Whole', 'Cleaned'], stock: 15, costPrice: 680, profit: 22, discount: 5, status: 'Low Stock', lastUpdated: '2024-11-24' }
  ]);

  const [variants, setVariants] = useState([
    { id: 1, variantName: 'Tiger Prawns - Whole Cleaned - 500g', product: 'Tiger Prawns', species: 'Prawns', cutType: 'Whole Cleaned', featured: true, bestSeller: true, costPrice: 320, profit: 15, displayPrice: 368, discount: 10, sellingPrice: 331, status: 'Active', lastUpdated: '2024-11-28' },
    { id: 2, variantName: 'Tiger Prawns - Peeled - 250g', product: 'Tiger Prawns', species: 'Prawns', cutType: 'Peeled', featured: false, bestSeller: true, costPrice: 320, profit: 15, displayPrice: 368, discount: 10, sellingPrice: 331, status: 'Active', lastUpdated: '2024-11-27' },
    { id: 3, variantName: 'Salmon - Fillet - 500g', product: 'Salmon', species: 'Fish', cutType: 'Fillet', featured: true, bestSeller: false, costPrice: 580, profit: 18, displayPrice: 684, discount: 8, sellingPrice: 629, status: 'Active', lastUpdated: '2024-11-26' },
    { id: 4, variantName: 'Pomfret - Whole Cleaned - 500g', product: 'Pomfret', species: 'Fish', cutType: 'Whole Cleaned', featured: false, bestSeller: false, costPrice: 340, profit: 15, displayPrice: 391, discount: 12, sellingPrice: 344, status: 'Active', lastUpdated: '2024-11-25' },
    { id: 5, variantName: 'King Prawns - Deveined - 500g', product: 'King Prawns', species: 'Prawns', cutType: 'Deveined', featured: true, bestSeller: true, costPrice: 450, profit: 20, displayPrice: 540, discount: 5, sellingPrice: 513, status: 'Active', lastUpdated: '2024-11-28' }
  ]);

  // Reorder functions
  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    setCategories(newCategories);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProducts.length) return;
    
    [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
    setProducts(newProducts);
  };

  const moveVariant = (index: number, direction: 'up' | 'down') => {
    const newVariants = [...variants];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newVariants.length) return;
    
    [newVariants[index], newVariants[targetIndex]] = [newVariants[targetIndex], newVariants[index]];
    setVariants(newVariants);
  };

  const handleAddCutType = () => {
    if (productForm.currentCutType.trim()) {
      setProductForm({
        ...productForm,
        cutTypes: [...productForm.cutTypes, productForm.currentCutType.trim()],
        currentCutType: ''
      });
    }
  };

  const handleRemoveCutType = (index: number) => {
    setProductForm({
      ...productForm,
      cutTypes: productForm.cutTypes.filter((_, i) => i !== index)
    });
  };

  // Auto-calculate variant prices
  const calculateVariantPrices = (costPrice: number, profit: number, discount: number) => {
    const displayPrice = costPrice + (costPrice * profit / 100);
    const sellingPrice = displayPrice - (displayPrice * discount / 100);
    return { displayPrice: displayPrice.toFixed(2), sellingPrice: sellingPrice.toFixed(2) };
  };

  const handleOpenAddModal = () => {
    // Reset forms
    setCategoryForm({ speciesName: '', speciesIcon: null, availability: true });
    setProductForm({
      species: '',
      productName: '',
      productImage: null,
      description: '',
      nutritionFacts: '',
      cutTypes: [],
      currentCutType: '',
      availableStock: '',
      defaultProfit: '',
      defaultDiscount: '',
      costPricePerKg: '',
      availability: true
    });
    setVariantForm({
      species: '',
      product: '',
      variantName: '',
      cutType: '',
      featured: false,
      bestSeller: false,
      displayPrice: '',
      discount: '',
      sellingPrice: '',
      notes: '',
      availability: true
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission based on active tab
    console.log('Submitting:', activeTab);
    setShowAddModal(false);
  };

  const renderCategoryModal = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="speciesName">Species Name *</Label>
        <Input
          id="speciesName"
          value={categoryForm.speciesName}
          onChange={(e) => setCategoryForm({ ...categoryForm, speciesName: e.target.value })}
          placeholder="e.g., Prawns, Fish, Crab"
          required
        />
      </div>

      <div>
        <Label htmlFor="speciesIcon">Species Icon *</Label>
        <Input
          id="speciesIcon"
          type="file"
          accept="image/*"
          onChange={(e) => setCategoryForm({ ...categoryForm, speciesIcon: e.target.files?.[0] || null })}
          required
        />
        <p className="text-sm text-gray-500 mt-1">Upload an icon or image for this species</p>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="availability">Availability</Label>
          <p className="text-sm text-gray-600">Make this category available to users</p>
        </div>
        <Switch
          id="availability"
          checked={categoryForm.availability}
          onCheckedChange={(checked: boolean) => setCategoryForm({ ...categoryForm, availability: checked })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Add Category
        </Button>
      </DialogFooter>
    </form>
  );

  const renderProductModal = () => (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="species">Select Species *</Label>
          <Select value={productForm.species} onValueChange={(value: string) => setProductForm({ ...productForm, species: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prawns">Prawns</SelectItem>
              <SelectItem value="fish">Fish</SelectItem>
              <SelectItem value="crab">Crab</SelectItem>
              <SelectItem value="squid">Squid</SelectItem>
              <SelectItem value="lobster">Lobster</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            value={productForm.productName}
            onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
            placeholder="e.g., Tiger Prawns"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="productImage">Product Image *</Label>
        <Input
          id="productImage"
          type="file"
          accept="image/*"
          onChange={(e) => setProductForm({ ...productForm, productImage: e.target.files?.[0] || null })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={productForm.description}
          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          placeholder="Enter product description, origin, characteristics..."
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="nutritionFacts">Nutrition Facts *</Label>
        <Textarea
          id="nutritionFacts"
          value={productForm.nutritionFacts}
          onChange={(e) => setProductForm({ ...productForm, nutritionFacts: e.target.value })}
          placeholder="Enter nutritional information (e.g., Protein: 20g per 100g, Omega-3: 500mg...)"
          rows={3}
          required
        />
      </div>

      <div>
        <Label>Available Cut Types *</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={productForm.currentCutType}
            onChange={(e) => setProductForm({ ...productForm, currentCutType: e.target.value })}
            placeholder="Enter cut type (e.g., Whole Cleaned, Curry Cut)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCutType())}
          />
          <Button type="button" onClick={handleAddCutType} variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {productForm.cutTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {productForm.cutTypes.map((cutType: string, index: number) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {cutType}
                <button
                  type="button"
                  onClick={() => handleRemoveCutType(index)}
                  className="ml-1 hover:text-red-600"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="availableStock">Available Stock (KG) *</Label>
          <Input
            id="availableStock"
            type="number"
            value={productForm.availableStock}
            onChange={(e) => setProductForm({ ...productForm, availableStock: e.target.value })}
            placeholder="Enter stock in kilograms"
            required
          />
        </div>

        <div>
          <Label htmlFor="costPricePerKg">Cost Price Per KG (₹) *</Label>
          <Input
            id="costPricePerKg"
            type="number"
            value={productForm.costPricePerKg}
            onChange={(e) => setProductForm({ ...productForm, costPricePerKg: e.target.value })}
            placeholder="Enter cost price"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="defaultProfit">Default Profit % *</Label>
          <Input
            id="defaultProfit"
            type="number"
            value={productForm.defaultProfit}
            onChange={(e) => setProductForm({ ...productForm, defaultProfit: e.target.value })}
            placeholder="e.g., 15"
            required
          />
        </div>

        <div>
          <Label htmlFor="defaultDiscount">Default Discount % *</Label>
          <Input
            id="defaultDiscount"
            type="number"
            value={productForm.defaultDiscount}
            onChange={(e) => setProductForm({ ...productForm, defaultDiscount: e.target.value })}
            placeholder="e.g., 10"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="productAvailability">Availability</Label>
          <p className="text-sm text-gray-600">Make this product available to users</p>
        </div>
        <Switch
          id="productAvailability"
          checked={productForm.availability}
          onCheckedChange={(checked: boolean) => setProductForm({ ...productForm, availability: checked })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Add Product
        </Button>
      </DialogFooter>
    </form>
  );

  const renderVariantModal = () => {
    // Get product from selection to auto-fill defaults
    const selectedProduct = products.find(p => p.name === variantForm.product);
    const costPrice = selectedProduct?.costPrice || 0;
    const defaultProfit = selectedProduct?.profit || 0;
    const defaultDiscount = selectedProduct?.discount || 0;
    
    const prices = calculateVariantPrices(costPrice, defaultProfit, parseFloat(variantForm.discount) || defaultDiscount);

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="variantSpecies">Select Species *</Label>
            <Select value={variantForm.species} onValueChange={(value: string) => setVariantForm({ ...variantForm, species: value, product: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose species" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prawns">Prawns</SelectItem>
                <SelectItem value="fish">Fish</SelectItem>
                <SelectItem value="crab">Crab</SelectItem>
                <SelectItem value="squid">Squid</SelectItem>
                <SelectItem value="lobster">Lobster</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="variantProduct">Select Product *</Label>
            <Select 
              value={variantForm.product} 
              onValueChange={(value: string) => {
                const product = products.find(p => p.name === value);
                setVariantForm({ 
                  ...variantForm, 
                  product: value,
                  discount: product?.discount.toString() || ''
                });
              }}
              disabled={!variantForm.species}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .filter(p => p && p.species && p.species.toLowerCase() === variantForm.species)
                  .map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="variantName">Variant Name *</Label>
          <Input
            id="variantName"
            value={variantForm.variantName}
            onChange={(e) => setVariantForm({ ...variantForm, variantName: e.target.value })}
            placeholder="e.g., Tiger Prawns - Whole Cleaned - 500g"
            required
          />
        </div>

        <div>
          <Label htmlFor="variantCutType">Select Cut Type *</Label>
          <Select value={variantForm.cutType} onValueChange={(value: string) => setVariantForm({ ...variantForm, cutType: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose cut type" />
            </SelectTrigger>
            <SelectContent>
              {selectedProduct?.cutTypes.map((ct: string, idx: number) => (
                <SelectItem key={idx} value={ct}>{ct}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={variantForm.featured}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, featured: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="bestSeller">Best Seller</Label>
            <Switch
              id="bestSeller"
              checked={variantForm.bestSeller}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, bestSeller: checked })}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-900">Pricing Details</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Cost Price (₹/KG)</Label>
              <Input value={costPrice} disabled className="bg-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Profit %</Label>
              <Input value={defaultProfit} disabled className="bg-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Display Price (₹)</Label>
              <Input value={prices.displayPrice} disabled className="bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="variantDiscount">Discount % *</Label>
              <Input
                id="variantDiscount"
                type="number"
                value={variantForm.discount}
                onChange={(e) => setVariantForm({ ...variantForm, discount: e.target.value })}
                placeholder="Enter discount"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Selling Price (₹)</Label>
              <Input 
                value={variantForm.discount ? calculateVariantPrices(costPrice, defaultProfit, parseFloat(variantForm.discount)).sellingPrice : prices.sellingPrice} 
                disabled 
                className="bg-white font-semibold text-green-600" 
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={variantForm.notes}
            onChange={(e) => setVariantForm({ ...variantForm, notes: e.target.value })}
            placeholder="Additional notes or special instructions..."
            rows={2}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="variantAvailability">Availability</Label>
            <p className="text-sm text-gray-600">Make this variant available to users</p>
          </div>
          <Switch
            id="variantAvailability"
            checked={variantForm.availability}
            onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, availability: checked })}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Add Variant
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Inventory</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-blue-600">
          {activeTab === 'categories' ? 'Categories' : activeTab === 'products' ? 'Products' : 'Product Variants'}
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage categories, products, and variants</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="variants">Product Variants</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Reorder</th>
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Species Icon</th>
                      <th className="text-left py-3 px-4">Species Name</th>
                      <th className="text-left py-3 px-4">Availability</th>
                      <th className="text-left py-3 px-4">Date Created</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category, index) => (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveCategory(index, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveCategory(index, 'down')}
                              disabled={index === categories.length - 1}
                              className={`p-1 rounded ${index === categories.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">
                          <span className="text-3xl">{category.icon}</span>
                        </td>
                        <td className="py-3 px-4">{category.name}</td>
                        <td className="py-3 px-4">
                          <Badge variant={category.availability === 'Available' ? 'default' : 'secondary'}>
                            {category.availability}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{category.dateCreated}</td>
                        <td className="py-3 px-4">{category.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              {category.availability === 'Available' ? (
                                <ToggleRight className="w-4 h-4 text-green-600" />
                              ) : (
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search products by name or species..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Products ({products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Reorder</th>
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Product Image</th>
                      <th className="text-left py-3 px-4">Product Name</th>
                      <th className="text-left py-3 px-4">Species</th>
                      <th className="text-left py-3 px-4">Cut Types</th>
                      <th className="text-left py-3 px-4">Available Stock</th>
                      <th className="text-left py-3 px-4">Cost Price (₹/KG)</th>
                      <th className="text-left py-3 px-4">Default Profit %</th>
                      <th className="text-left py-3 px-4">Default Discount %</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveProduct(index, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveProduct(index, 'down')}
                              disabled={index === products.length - 1}
                              className={`p-1 rounded ${index === products.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">
                          <ImageWithFallback
                            src="https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=50&h=50&fit=crop"
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </td>
                        <td className="py-3 px-4">{product.name}</td>
                        <td className="py-3 px-4">{product.species}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.cutTypes.slice(0, 2).map((ct, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {ct}
                              </Badge>
                            ))}
                            {product.cutTypes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.cutTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.stock} KG</td>
                        <td className="py-3 px-4">₹{product.costPrice}</td>
                        <td className="py-3 px-4">{product.profit}%</td>
                        <td className="py-3 px-4">{product.discount}%</td>
                        <td className="py-3 px-4">
                          <Badge variant={product.status === 'Active' ? 'default' : 'destructive'}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{product.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search variants..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Product Variants ({variants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Reorder</th>
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Variant Name</th>
                      <th className="text-left py-3 px-4">Product Name</th>
                      <th className="text-left py-3 px-4">Species</th>
                      <th className="text-left py-3 px-4">Cut Type</th>
                      <th className="text-left py-3 px-4">Featured</th>
                      <th className="text-left py-3 px-4">Best Seller</th>
                      <th className="text-left py-3 px-4">Cost Price (₹/KG)</th>
                      <th className="text-left py-3 px-4">Profit %</th>
                      <th className="text-left py-3 px-4">Display Price (₹)</th>
                      <th className="text-left py-3 px-4">Discount %</th>
                      <th className="text-left py-3 px-4">Selling Price (₹)</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant, index) => (
                      <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveVariant(index, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveVariant(index, 'down')}
                              disabled={index === variants.length - 1}
                              className={`p-1 rounded ${index === variants.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">{variant.variantName}</td>
                        <td className="py-3 px-4">{variant.product}</td>
                        <td className="py-3 px-4">{variant.species}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">{variant.cutType}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {variant.featured ? (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.bestSeller ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">₹{variant.costPrice}</td>
                        <td className="py-3 px-4">{variant.profit}%</td>
                        <td className="py-3 px-4">₹{variant.displayPrice}</td>
                        <td className="py-3 px-4">{variant.discount}%</td>
                        <td className="py-3 px-4 font-semibold text-green-600">₹{variant.sellingPrice}</td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{variant.status}</Badge>
                        </td>
                        <td className="py-3 px-4">{variant.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Add New {activeTab === 'categories' ? 'Category' : activeTab === 'products' ? 'Product' : 'Product Variant'}
            </DialogTitle>
          </DialogHeader>
          {activeTab === 'categories' && renderCategoryModal()}
          {activeTab === 'products' && renderProductModal()}
          {activeTab === 'variants' && renderVariantModal()}
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              View {activeTab === 'categories' ? 'Category' : activeTab === 'products' ? 'Product' : 'Product Variant'}
            </DialogTitle>
          </DialogHeader>
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="speciesName">Species Name</Label>
                <Input
                  id="speciesName"
                  value={selectedItem?.name || ''}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="speciesIcon">Species Icon</Label>
                <Input
                  id="speciesIcon"
                  type="file"
                  accept="image/*"
                  readOnly
                />
                <p className="text-sm text-gray-500 mt-1">Upload an icon or image for this species</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <p className="text-sm text-gray-600">Make this category available to users</p>
                </div>
                <Switch
                  id="availability"
                  checked={selectedItem?.availability === 'Available'}
                  onCheckedChange={(checked: boolean) => {
                    const updatedCategories = categories.map(cat => 
                      cat.id === selectedItem.id ? { ...cat, availability: checked ? 'Available' : 'Unavailable' } : cat
                    );
                    setCategories(updatedCategories);
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="species">Select Species</Label>
                <Select value={selectedItem?.species || ''} onValueChange={(value: string) => {
                  const updatedProducts = products.map(prod => 
                    prod.id === selectedItem.id ? { ...prod, species: value } : prod
                  );
                  setProducts(updatedProducts);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prawns">Prawns</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="crab">Crab</SelectItem>
                    <SelectItem value="squid">Squid</SelectItem>
                    <SelectItem value="lobster">Lobster</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={selectedItem?.name || ''}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="productImage">Product Image</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={selectedItem?.description || ''}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="nutritionFacts">Nutrition Facts</Label>
                <Textarea
                  id="nutritionFacts"
                  value={selectedItem?.nutritionFacts || ''}
                  readOnly
                />
              </div>

              <div>
                <Label>Available Cut Types</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedItem?.cutTypes.map((cutType: string, index: number) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {cutType}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="availableStock">Available Stock (KG)</Label>
                  <Input
                    id="availableStock"
                    type="number"
                    value={selectedItem?.stock || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="costPricePerKg">Cost Price Per KG (₹)</Label>
                  <Input
                    id="costPricePerKg"
                    type="number"
                    value={selectedItem?.costPrice || ''}
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultProfit">Default Profit %</Label>
                  <Input
                    id="defaultProfit"
                    type="number"
                    value={selectedItem?.profit || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="defaultDiscount">Default Discount %</Label>
                  <Input
                    id="defaultDiscount"
                    type="number"
                    value={selectedItem?.discount || ''}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="productAvailability">Availability</Label>
                  <p className="text-sm text-gray-600">Make this product available to users</p>
                </div>
                <Switch
                  id="productAvailability"
                  checked={selectedItem?.availability}
                  onCheckedChange={(checked: boolean) => {
                    const updatedProducts = products.map(prod => 
                      prod.id === selectedItem.id ? { ...prod, availability: checked } : prod
                    );
                    setProducts(updatedProducts);
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="variantSpecies">Select Species</Label>
                <Select value={selectedItem?.species || ''} onValueChange={(value: string) => {
                  const updatedVariants = variants.map(variant => 
                    variant.id === selectedItem.id ? { ...variant, species: value } : variant
                  );
                  setVariants(updatedVariants);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prawns">Prawns</SelectItem>
                    <SelectItem value="fish">Fish</SelectItem>
                    <SelectItem value="crab">Crab</SelectItem>
                    <SelectItem value="squid">Squid</SelectItem>
                    <SelectItem value="lobster">Lobster</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variantProduct">Select Product</Label>
                <Select 
                  value={selectedItem?.product || ''} 
                  onValueChange={(value: string) => {
                    const product = products.find(p => p.name === value);
                    setVariantForm({ 
                      ...variantForm, 
                      product: value,
                      discount: product?.discount.toString() || ''
                    });
                  }}
                  disabled={!selectedItem?.species}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      .filter(p => p && p.species && selectedItem?.species && p.species.toLowerCase() === selectedItem.species?.toLowerCase())
                      .map(p => (
                        <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="variantName">Variant Name</Label>
                <Input
                  id="variantName"
                  value={selectedItem?.variantName || ''}
                  readOnly
                />
              </div>

              <div>
                <Label htmlFor="variantCutType">Select Cut Type</Label>
                <Select value={selectedItem?.cutType || ''} onValueChange={(value: string) => {
                  const updatedVariants = variants.map(variant => 
                    variant.id === selectedItem.id ? { ...variant, cutType: value } : variant
                  );
                  setVariants(updatedVariants);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose cut type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedItem?.cutTypes.map((ct: string, idx: number) => (
                      <SelectItem key={idx} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor="featured">Featured</Label>
                  <Switch
                    id="featured"
                    checked={selectedItem?.featured}
                    onCheckedChange={(checked: boolean) => {
                      const updatedVariants = variants.map(variant => 
                        variant.id === selectedItem.id ? { ...variant, featured: checked } : variant
                      );
                      setVariants(updatedVariants);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <Label htmlFor="bestSeller">Best Seller</Label>
                  <Switch
                    id="bestSeller"
                    checked={selectedItem?.bestSeller}
                    onCheckedChange={(checked: boolean) => {
                      const updatedVariants = variants.map(variant => 
                        variant.id === selectedItem.id ? { ...variant, bestSeller: checked } : variant
                      );
                      setVariants(updatedVariants);
                    }}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-blue-900">Pricing Details</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">Cost Price (₹/KG)</Label>
                    <Input value={selectedItem?.costPrice || ''} disabled className="bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Profit %</Label>
                    <Input value={selectedItem?.profit || ''} disabled className="bg-white" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Display Price (₹)</Label>
                    <Input value={selectedItem?.displayPrice || ''} disabled className="bg-white" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="variantDiscount">Discount %</Label>
                    <Input
                      id="variantDiscount"
                      type="number"
                      value={selectedItem?.discount || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Selling Price (₹)</Label>
                    <Input 
                      value={selectedItem?.sellingPrice || ''} 
                      disabled 
                      className="bg-white font-semibold text-green-600" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={selectedItem?.notes || ''}
                  readOnly
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="variantAvailability">Availability</Label>
                  <p className="text-sm text-gray-600">Make this variant available to users</p>
                </div>
                <Switch
                  id="variantAvailability"
                  checked={selectedItem?.availability}
                  onCheckedChange={(checked: boolean) => {
                    const updatedVariants = variants.map(variant => 
                      variant.id === selectedItem.id ? { ...variant, availability: checked } : variant
                    );
                    setVariants(updatedVariants);
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {activeTab === 'categories' ? 'category' : activeTab === 'products' ? 'product' : 'product variant'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Delete item from state
                if (activeTab === 'categories') {
                  setCategories(categories.filter(cat => cat.id !== selectedItem.id));
                } else if (activeTab === 'products') {
                  setProducts(products.filter(prod => prod.id !== selectedItem.id));
                } else if (activeTab === 'variants') {
                  setVariants(variants.filter(variant => variant.id !== selectedItem.id));
                }
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}