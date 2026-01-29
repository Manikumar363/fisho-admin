import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Switch } from '../../../components/ui/switch';
import { toast } from 'sonner';
import { Plus, Image as ImageIcon } from 'lucide-react';

interface AddProductVariantProps {
  onBack?: () => void;
}

const DUMMY_SPECIES = [
  { id: 'cat1', name: 'Prawns' },
  { id: 'cat2', name: 'Fish' },
  { id: 'cat3', name: 'Crab' },
  { id: 'cat4', name: 'Lobster' },
];

const DUMMY_PRODUCTS = [
  { id: 'prod1', name: 'Tiger Prawns', species: 'cat1', availableWeights: [250, 500, 1000] },
  { id: 'prod2', name: 'Rohu', species: 'cat2', availableWeights: [500, 1000] },
  { id: 'prod3', name: 'Blue Crab', species: 'cat3', availableWeights: [250, 500] },
];

const DUMMY_CUT_TYPES = [
  { id: 'whole', name: 'Whole Cleaned' },
  { id: 'curry', name: 'Curry Cut' },
  { id: 'fillet', name: 'Fillet' },
  { id: 'butterfly', name: 'Butterfly Cut' },
];

interface WeightOption {
  id: string;
  weight: string;
  cutType: string;
  costPricePerKg: string;
  displayPrice: string;
  sellingPrice: string;
  profit: string;
  discount: string;
  weightNotes: string;
  isActive: boolean;
  featured?: boolean;
  bestSeller?: boolean;
  expressDelivery?: boolean;
  nextDayDelivery?: boolean;
  festiveOffer?: boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyWeightOption = (weight?: number, cutType?: string): WeightOption => ({
  id: generateId(),
  weight: weight?.toString() || '',
  cutType: cutType || '',
  costPricePerKg: '',
  displayPrice: '',
  sellingPrice: '',
  profit: '',
  discount: '',
  weightNotes: '',
  isActive: true,
  featured: false,
  bestSeller: false,
  expressDelivery: false,
  nextDayDelivery: false,
  festiveOffer: false,
});

const AddProductVariant: React.FC<AddProductVariantProps> = ({ onBack }) => {
  const [species, setSpecies] = useState('');
  const [product, setProduct] = useState('');
  const [cutType, setCutType] = useState('');
  const [variantName, setVariantName] = useState('');
  const [variantImage, setVariantImage] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [availability, setAvailability] = useState(true);
  const [weightOptions, setWeightOptions] = useState<WeightOption[]>([]);
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [nextDayDelivery, setNextDayDelivery] = useState(false);
  const [festiveOffer, setFestiveOffer] = useState(false);

  // New: Store image per cut type
  const [cutTypeImages, setCutTypeImages] = useState<{ [cutType: string]: File | null }>({});

  // Get available weights for the selected product
  const selectedProduct = DUMMY_PRODUCTS.find((p) => p.id === product);
  const availableWeights = selectedProduct?.availableWeights || [];

  // When product changes, reset weightOptions to match available weights
  useEffect(() => {
    if (availableWeights.length > 0) {
      setWeightOptions(availableWeights.map((weight) => createEmptyWeightOption(weight)));
    } else {
      setWeightOptions([]);
    }
  }, [product, availableWeights.join(',')]);

  // Handle field change for a specific weight
  const handleWeightOptionChange = (
    id: string,
    field: keyof WeightOption,
    value: string | boolean
  ) => {
    setWeightOptions((prev) =>
      prev.map((opt) => {
        if (opt.id !== id) return opt;

        const updated = { ...opt, [field]: value };

        // Auto-calculate profit when display or selling price changes
        if (field === 'displayPrice' || field === 'sellingPrice') {
          const displayPrice = parseFloat(
            field === 'displayPrice' ? (value as string) : opt.displayPrice
          );
          const sellingPrice = parseFloat(
            field === 'sellingPrice' ? (value as string) : opt.sellingPrice
          );

          if (!isNaN(displayPrice) && !isNaN(sellingPrice) && displayPrice > 0) {
            const profitPercent = ((displayPrice - sellingPrice) / displayPrice) * 100;
            updated.profit = profitPercent.toFixed(2);
          }
        }

        return updated;
      })
    );
  };

  // Add new weight option
  const addWeightOption = () => {
    setWeightOptions((prev) => [...prev, createEmptyWeightOption()]);
  };

  // Remove weight option
  const removeWeightOption = (id: string) => {
    setWeightOptions((prev) => prev.filter((opt) => opt.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate and submit logic here
    toast.success('Product variant added!');
    if (onBack) onBack();
  };

  const [cutTypes, setCutTypes] = useState<string[]>(['Whole', 'Fillet']);
  const [weights, setWeights] = useState<string[]>(['250', '500']);

  // Add/Remove CutType/Weight
  const addCutType = (val: string) => {
    if (val && !cutTypes.includes(val)) setCutTypes([...cutTypes, val]);
  };
  const removeCutType = (val: string) => {
    setCutTypes(cutTypes.filter(c => c !== val));
    setCutTypeImages(prev => {
      const newObj = { ...prev };
      delete newObj[val];
      return newObj;
    });
  };
  const addWeight = (val: string) => {
    if (val && !weights.includes(val)) setWeights([...weights, val]);
  };
  const removeWeight = (val: string) => {
    setWeights(weights.filter(w => w !== val));
  };

  // Generate all combinations for the table
  // Also, for each cutType, mark the first weight row for image upload
  const variantRows = cutTypes.flatMap(cutType =>
    weights.map((weight, idx) => {
      const found = weightOptions.find(opt => opt.weight === weight && opt.cutType === cutType);
      return {
        ...(found ? found : createEmptyWeightOption(Number(weight), cutType)),
        cutType,
        weight,
        isFirstWeight: idx === 0,
        weightCount: weights.length
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Add Product and Variants</h1>
          <p className="text-gray-600">Create a new product variant with complete details</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className='font-semibold text-xl'>Variant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="species">Category</Label>
                <select
                  id="species"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={species}
                  onChange={e => setSpecies(e.target.value)}
                  required
                >
                  <option value="">Select Species</option>
                  {DUMMY_SPECIES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="Enter product name"
                  value={variantName}
                  onChange={e => setVariantName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productImage">Product Image</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={e => setVariantImage(e.target.files?.[0] || null)}
                />
                {variantImage && (
                  <img
                    src={URL.createObjectURL(variantImage)}
                    alt="Product preview"
                    className="w-20 h-20 object-cover rounded mt-2 border"
                  />
                )}
              </div>
              <div>
                <Label htmlFor="availableStock">Available Stock</Label>
                <Input
                  id="availableStock"
                  type="number"
                  min="0"
                  placeholder="Enter available stock"
                  // Add state and handler for available stock as needed
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter product description, origin, characteristics..."
                // Add state and handler for description as needed
              />
            </div>
            <div>
              <Label htmlFor="nutrition">Nutrition Facts</Label>
              <Textarea
                id="nutrition"
                placeholder="Enter nutritional information (e.g., Protein: 20g per 100g, Omega-3: 500mg...)"
                // Add state and handler for nutrition as needed
              />
            </div>
            <div>
              <Label htmlFor="cutTypes">Available Cut Types</Label>
              <div className="flex gap-2">
                <select
                  id="cutTypes"
                  className="w-48 px-3 py-2 border border-gray-300 rounded-md"
                  value={cutType}
                  onChange={e => setCutType(e.target.value)}
                >
                  <option value="">Select cut type</option>
                  {DUMMY_CUT_TYPES.map((c) => (
                    !cutTypes.includes(c.name) && (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    )
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (cutType && !cutTypes.includes(cutType)) {
                      setCutTypes([...cutTypes, cutType]);
                      setCutType('');
                    }
                  }}
                  disabled={!cutType}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap mt-2">
                {cutTypes.map(cut => (
                  <span key={cut} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
                    {cut}
                    <button
                      type="button"
                      className="ml-1 text-gray-500 hover:text-red-500"
                      onClick={() => removeCutType(cut)}
                    >×</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="weights">Available Weights (in grams)</Label>
              <div className="flex gap-2 flex-wrap mt-1">
                {weights.map(w => (
                  <span key={w} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
                    {w}
                    <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={() => removeWeight(w)}>×</button>
                  </span>
                ))}
                <Input
                  id="weights"
                  placeholder="Enter weight (e.g., 250, 500, 1000)"
                  className="w-40"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addWeight(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.getElementById('weights') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      addWeight(input.value.trim());
                      input.value = '';
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Weight Options & Pricing</Label>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="min-w-full bg-card">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="py-2 px-3 text-left text-sm font-medium">CutType</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Image</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Weight (g)</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Cost Price / KG</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Display Price</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Selling Price</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Profit %</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Discount %</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Notes</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Featured</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Best Seller</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Express Delivery</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Next Day Delivery</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Festive Offer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-muted-foreground">
                          No variants. Add CutType and Weight options above.
                        </td>
                      </tr>
                    ) : (
                      variantRows.map((opt, idx) => (
                        <tr key={opt.cutType + '-' + opt.weight} className="border-t border-border">
                          <td className="py-2 px-3">{opt.cutType}</td>
                          <td className="py-2 px-3">
                            {opt.isFirstWeight ? (
                              <div className="flex flex-col items-center">
                                <label className="flex flex-col items-center cursor-pointer group">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={e => {
                                      const file = e.target.files?.[0] || null;
                                      setCutTypeImages(prev => ({ ...prev, [opt.cutType]: file }));
                                    }}
                                  />
                                  <span className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs group-hover:underline">
                                    <ImageIcon className="w-4 h-4" />
                                  </span>
                                </label>
                                {cutTypeImages[opt.cutType] && (
                                  <img
                                    src={URL.createObjectURL(cutTypeImages[opt.cutType]!)}
                                    alt={opt.cutType + ' preview'}
                                    className="w-10 h-10 object-cover rounded border mt-1"
                                  />
                                )}
                              </div>
                            ) : (
                              cutTypeImages[opt.cutType] ? (
                                <img
                                  src={URL.createObjectURL(cutTypeImages[opt.cutType]!)}
                                  alt={opt.cutType + ' preview'}
                                  className="w-10 h-10 object-cover rounded border"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">No image</span>
                              )
                            )}
                          </td>
                          <td className="py-2 px-3">{opt.weight}</td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={opt.costPricePerKg}
                              onChange={e => handleWeightOptionChange(opt.id, 'costPricePerKg', e.target.value)}
                              placeholder="0.00"
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={opt.displayPrice}
                              onChange={e => handleWeightOptionChange(opt.id, 'displayPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={opt.sellingPrice}
                              onChange={e => handleWeightOptionChange(opt.id, 'sellingPrice', e.target.value)}
                              placeholder="0.00"
                              className="w-24"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="0"
                              value={opt.profit}
                              readOnly
                              placeholder="Auto"
                              className="w-20 bg-muted/50"
                              title="Auto-calculated from prices"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={opt.discount}
                              onChange={e => handleWeightOptionChange(opt.id, 'discount', e.target.value)}
                              placeholder="%"
                              className="w-20"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              value={opt.weightNotes}
                              onChange={e => handleWeightOptionChange(opt.id, 'weightNotes', e.target.value)}
                              placeholder="Notes"
                              className="w-28"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!opt.featured}
                              onCheckedChange={val => handleWeightOptionChange(opt.id, 'featured', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!opt.bestSeller}
                              onCheckedChange={val => handleWeightOptionChange(opt.id, 'bestSeller', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!opt.expressDelivery}
                              onCheckedChange={val => handleWeightOptionChange(opt.id, 'expressDelivery', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!opt.nextDayDelivery}
                              onCheckedChange={val => handleWeightOptionChange(opt.id, 'nextDayDelivery', val)}
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Switch
                              checked={!!opt.festiveOffer}
                              onCheckedChange={val => handleWeightOptionChange(opt.id, 'festiveOffer', val)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {weightOptions.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Profit % is auto-calculated based on display and selling prices.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="availability">Availability</Label>
                <p className="text-sm text-gray-600">Show this variant to customers</p>
              </div>
              <Switch id="availability" checked={availability} onCheckedChange={setAvailability} />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Add Product Variant
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductVariant;
