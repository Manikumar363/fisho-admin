import React, { useState } from 'react';
import { Plus, Upload, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';

export default function AddCategory() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Prawns', icon: '🦐', products: 24, status: 'Active', description: 'Fresh water and sea prawns' },
    { id: 2, name: 'Fish', icon: '🐟', products: 18, status: 'Active', description: 'Various fish species' },
    { id: 3, name: 'Crab', icon: '🦀', products: 12, status: 'Active', description: 'Fresh crabs' },
    { id: 4, name: 'Lobster', icon: '🦞', products: 8, status: 'Inactive', description: 'Premium lobster varieties' }
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Add Category / Species</h1>
        <p className="text-gray-600">Manage seafood categories and species</p>
      </div>

      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
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

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Icon</th>
                  <th className="text-left py-3 px-4">Species Name</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Total Products</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-2xl">{category.icon}</td>
                    <td className="py-3 px-4">{category.name}</td>
                    <td className="py-3 px-4 text-gray-600">{category.description}</td>
                    <td className="py-3 px-4">{category.products}</td>
                    <td className="py-3 px-4">
                      <Badge variant={category.status === 'Active' ? 'default' : 'secondary'}>
                        {category.status}
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
