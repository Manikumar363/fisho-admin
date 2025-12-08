import React from 'react';
import { Plus, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export default function WasteManagement() {
  const wasteEntries = [
    {
      id: 1,
      date: '2025-11-29',
      product: 'Tiger Prawns',
      variant: 'Whole Cleaned - 500g',
      quantity: 2,
      costPrice: 320,
      totalWastage: 640,
      reason: 'Expired stock'
    },
    {
      id: 2,
      date: '2025-11-28',
      product: 'Salmon Fillet',
      variant: 'Fillet - 250g',
      quantity: 1,
      costPrice: 490,
      totalWastage: 490,
      reason: 'Damaged packaging'
    },
    {
      id: 3,
      date: '2025-11-28',
      product: 'King Fish',
      variant: 'Curry Cut - 500g',
      quantity: 3,
      costPrice: 250,
      totalWastage: 750,
      reason: 'Quality issues'
    },
    {
      id: 4,
      date: '2025-11-27',
      product: 'Pomfret',
      variant: 'Whole Cleaned - 500g',
      quantity: 1,
      costPrice: 350,
      totalWastage: 350,
      reason: 'Overstock'
    }
  ];

  const totalWastage = wasteEntries.reduce((sum, entry) => sum + entry.totalWastage, 0);
  const totalRevenue = 250000; // Mock revenue
  const wastagePercentage = ((totalWastage / totalRevenue) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Waste Management</h1>
        <p className="text-gray-600">Track and manage inventory wastage</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 mb-2">Total Wastage</p>
                <p className="mb-1">{wasteEntries.length} entries</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 mb-2">Wastage Value</p>
                <p className="mb-1">₹{totalWastage.toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 mb-2">Wastage Percentage</p>
                <p className="mb-1">{wastagePercentage}%</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Percent className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Waste Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Waste Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <select
                  id="product"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Product</option>
                  <option value="prawns">Tiger Prawns</option>
                  <option value="salmon">Salmon Fillet</option>
                  <option value="kingfish">King Fish</option>
                  <option value="pomfret">Pomfret</option>
                </select>
              </div>

              <div>
                <Label htmlFor="variant">Variant</Label>
                <select
                  id="variant"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Variant</option>
                  <option value="whole-500">Whole Cleaned - 500g</option>
                  <option value="curry-500">Curry Cut - 500g</option>
                  <option value="fillet-250">Fillet - 250g</option>
                </select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity Wasted</Label>
                <Input id="quantity" type="number" placeholder="0" />
              </div>

              <div>
                <Label htmlFor="cost">Cost Price per Unit (₹)</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="Auto-filled from inventory"
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes / Reason</Label>
              <Textarea
                id="notes"
                placeholder="Enter reason for wastage..."
                rows={3}
              />
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Waste Entry
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Waste Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Wastage History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Variant</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Cost Price</th>
                  <th className="text-left py-3 px-4">Total Wastage</th>
                  <th className="text-left py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody>
                {wasteEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{entry.date}</td>
                    <td className="py-3 px-4">{entry.product}</td>
                    <td className="py-3 px-4">{entry.variant}</td>
                    <td className="py-3 px-4">{entry.quantity}</td>
                    <td className="py-3 px-4">₹{entry.costPrice}</td>
                    <td className="py-3 px-4 text-red-600">₹{entry.totalWastage}</td>
                    <td className="py-3 px-4 text-gray-600">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
