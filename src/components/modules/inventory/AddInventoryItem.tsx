import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Checkbox } from '../../ui/checkbox';

export default function AddInventoryItem() {
  const navigate = useNavigate();
  const [addType, setAddType] = useState('');
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

  const renderCategoryForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="speciesName">Species Name</Label>
          <Input id="speciesName" placeholder="e.g., Prawns" />
        </div>

        <div>
          <Label htmlFor="speciesIcon">Species Icon</Label>
          <div className="flex gap-2">
            <Input id="speciesIcon" type="file" accept="image/*" />
            <Button type="button" variant="outline">
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" placeholder="Enter category description" rows={3} />
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="status">Status</Label>
          <p className="text-sm text-gray-600">Make this category active</p>
        </div>
        <Switch id="status" />
      </div>
    </div>
  );

  const renderCutTypeForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cutName">Cut Type Name</Label>
          <Input id="cutName" placeholder="e.g., Whole Cleaned, Curry Cut" />
        </div>

        <div>
          <Label htmlFor="category">Category Mapping</Label>
          <select
            id="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Category</option>
            <option value="all">All Categories</option>
            <option value="prawns">Prawns</option>
            <option value="fish">Fish</option>
            <option value="crab">Crab</option>
            <option value="lobster">Lobster</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="cutStatus">Status</Label>
          <p className="text-sm text-gray-600">Make this cut type active</p>
        </div>
        <Switch id="cutStatus" />
      </div>
    </div>
  );

  const renderWeightForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weightLabel">Weight Label</Label>
          <Input id="weightLabel" placeholder="e.g., 20-30 Packet, 250g Pack" />
        </div>

        <div>
          <Label htmlFor="gramValue">Gram Value (Optional)</Label>
          <Input id="gramValue" type="number" placeholder="e.g., 250" />
        </div>
      </div>

      <div>
        <Label htmlFor="weightCategory">Category</Label>
        <select
          id="weightCategory"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Select Category</option>
          <option value="all">All Categories</option>
          <option value="prawns">Prawns</option>
          <option value="fish">Fish</option>
          <option value="crab">Crab</option>
          <option value="lobster">Lobster</option>
        </select>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="weightStatus">Status</Label>
          <p className="text-sm text-gray-600">Make this weight option active</p>
        </div>
        <Switch id="weightStatus" />
      </div>
    </div>
  );

  const renderProductForm = () => (
    <div className="space-y-4">
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
        <Label htmlFor="productDescription">Description</Label>
        <Textarea
          id="productDescription"
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/inventory-management')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Inventory
        </Button>
        <div>
          <h1 className="mb-1">Add Inventory Item</h1>
          <p className="text-gray-600">Add category, cut type, weight or product variant</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Item Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {/* Add Type Selector */}
            <div>
              <Label htmlFor="addType">Select Add Type</Label>
              <select
                id="addType"
                value={addType}
                onChange={(e) => setAddType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Type</option>
                <option value="category">Category (Species)</option>
                <option value="cutType">Cut Type</option>
                <option value="weight">Weight</option>
                <option value="product">Product Variant</option>
              </select>
            </div>

            {/* Conditional Form Fields */}
            {addType === 'category' && renderCategoryForm()}
            {addType === 'cutType' && renderCutTypeForm()}
            {addType === 'weight' && renderWeightForm()}
            {addType === 'product' && renderProductForm()}

            {addType && (
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add {addType === 'category' ? 'Category' : addType === 'cutType' ? 'Cut Type' : addType === 'weight' ? 'Weight' : 'Product Variant'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
