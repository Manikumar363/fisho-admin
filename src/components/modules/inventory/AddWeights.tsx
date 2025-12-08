import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';

export default function AddWeights() {
  const [weights, setWeights] = useState([
    { id: 1, label: '20-30 Packet', grams: 250, category: 'All', status: 'Active' },
    { id: 2, label: '100g Pack', grams: 100, category: 'All', status: 'Active' },
    { id: 3, label: '250g Pack', grams: 250, category: 'All', status: 'Active' },
    { id: 4, label: '500g Pack', grams: 500, category: 'All', status: 'Active' },
    { id: 5, label: '1kg Pack', grams: 1000, category: 'All', status: 'Active' },
    { id: 6, label: 'Jumbo (40-50)', grams: 500, category: 'Prawns', status: 'Active' }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Add Available Weights</h1>
        <p className="text-gray-600">Manage available weight options for products</p>
      </div>

      {/* Add Weight Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Weight Option</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
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

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Weight
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Weights */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Weight Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Weight Label</th>
                  <th className="text-left py-3 px-4">Gram Value</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {weights.map((weight) => (
                  <tr key={weight.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{weight.label}</td>
                    <td className="py-3 px-4">{weight.grams}g</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{weight.category}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={weight.status === 'Active' ? 'default' : 'secondary'}>
                        {weight.status}
                      </Badge>
                    </td>
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
    </div>
  );
}
