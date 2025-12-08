import React, { useState } from 'react';
import { Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Checkbox } from '../../ui/checkbox';

export default function AddProductVariant() {
  const [actualPrice, setActualPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');

  const calculateDiscountedPrice = () => {
    if (actualPrice && discountPercent) {
      const price = parseFloat(actualPrice);
      const discount = parseFloat(discountPercent);
      return (price - (price * discount / 100)).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Add Product Variant</h1>
        <p className="text-gray-600">Create a new product variant with complete details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="species">Species Name</Label>
                    <select
                      id="species"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Species</option>
                      <option value="prawns">Prawns</option>
                      <option value="fish">Fish</option>
                      <option value="crab">Crab</option>
                      <option value="lobster">Lobster</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" placeholder="e.g., Tiger Prawns" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productImage">Product Image</Label>
                  <div className="flex gap-2">
                    <Input id="productImage" type="file" accept="image/*" />
                    <Button type="button" variant="outline">
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="nutritional">Nutritional Facts</Label>
                  <Textarea
                    id="nutritional"
                    placeholder="Enter nutritional information"
                    rows={3}
                  />
                </div>

                {/* Delivery Types */}
                <div className="space-y-2">
                  <Label>Delivery Types</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nextDay" />
                      <label htmlFor="nextDay">Next-Day Delivery</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="express" />
                      <label htmlFor="express">Express Delivery</label>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="featured">Featured Product</Label>
                    <Switch id="featured" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bestseller">Best Seller</Label>
                    <Switch id="bestseller" />
                  </div>
                </div>

                {/* Variant Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cutType">Cut Type</Label>
                    <select
                      id="cutType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Cut Type</option>
                      <option value="whole">Whole Cleaned</option>
                      <option value="curry">Curry Cut</option>
                      <option value="fillet">Fillet</option>
                      <option value="butterfly">Butterfly Cut</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="netWeight">Net Weight</Label>
                    <select
                      id="netWeight"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Weight</option>
                      <option value="250">250g Pack</option>
                      <option value="500">500g Pack</option>
                      <option value="1000">1kg Pack</option>
                    </select>
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="actualPrice">Actual Price (₹)</Label>
                    <Input
                      id="actualPrice"
                      type="number"
                      placeholder="0.00"
                      value={actualPrice}
                      onChange={(e) => setActualPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Discount %</Label>
                    <Input
                      id="discount"
                      type="number"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discountedPrice">Discounted Price (₹)</Label>
                    <Input
                      id="discountedPrice"
                      value={calculateDiscountedPrice()}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="quantity">Available Quantity (Admin Only)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="Enter stock quantity"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="visibility">Visibility</Label>
                    <p className="text-sm text-gray-600">Show this product to customers</p>
                  </div>
                  <Switch id="visibility" defaultChecked />
                </div>

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product Variant
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Product Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-400" />
                </div>
                <div className="p-4">
                  <h3 className="mb-1">Product Name</h3>
                  <p className="text-gray-600 text-sm mb-3">Species Name</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gray-400 line-through">₹{actualPrice || '0'}</span>
                    <span className="text-green-600">₹{calculateDiscountedPrice()}</span>
                    {discountPercent && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
