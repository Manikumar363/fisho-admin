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
          <h1 className="mb-2">Add Product Variant</h1>
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
                <Label htmlFor="species">Species</Label>
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
                <Label htmlFor="product">Product</Label>
                <select
                  id="product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  required
                  disabled={!species}
                >
                  <option value="">Select Product</option>
                  {DUMMY_PRODUCTS.filter((p) => p.species === species).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* CutType and Weight input UI restored */}
            <div className="mb-4">
              <div className="mb-2 font-semibold">CutType</div>
              <div className="flex gap-2 mb-2 flex-wrap">
                {cutTypes.map(cut => (
                  <span key={cut} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
                    {cut}
                    <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={() => removeCutType(cut)}>×</button>
                  </span>
                ))}
                {/* <Input 
                  placeholder="Add CutType"
                  className="w-24"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addCutType(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />*/}
              </div>
              <div className="mb-2 font-semibold">Weight</div>
              <div className="flex gap-2 flex-wrap">
                {weights.map(w => (
                  <span key={w} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
                    {w}
                    <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={() => removeWeight(w)}>×</button>
                  </span>
                ))}
                {/* <Input 
                  placeholder="Add Weight"
                  className="w-24"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      addWeight(e.currentTarget.value.trim());
                      e.currentTarget.value = '';
                    }
                  }}
                />*/}
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
                      <th className="py-2 px-3 text-left text-sm font-medium">Display Price</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Selling Price</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Profit %</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Discount %</th>
                      <th className="py-2 px-3 text-left text-sm font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
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
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any notes for this variant"
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured</Label>
                <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="bestSeller">Best Seller</Label>
                <Switch id="bestSeller" checked={bestSeller} onCheckedChange={setBestSeller} />
              </div>
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
