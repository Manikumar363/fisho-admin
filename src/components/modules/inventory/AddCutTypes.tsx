import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';

const AddCutTypes: React.FC = () => {
  const [cutTypes, setCutTypes] = useState([
    { id: 1, name: 'Whole Cleaned', category: 'All', status: 'Active' },
    { id: 2, name: 'Curry Cut', category: 'Fish', status: 'Active' },
    { id: 3, name: 'Fillet', category: 'Fish', status: 'Active' },
    { id: 4, name: 'Butterfly Cut', category: 'Prawns', status: 'Active' },
    { id: 5, name: 'Headless', category: 'Prawns', status: 'Active' },
    { id: 6, name: 'Half Cut', category: 'Crab', status: 'Inactive' }
  ]);

  // State for new cut type form
  const [newCutName, setNewCutName] = useState('');
  const [newCategory, setNewCategory] = useState('all'); // Initialize to a valid category
  const [newStatus, setNewStatus] = useState(true); // true = Active, false = Inactive

  // Handle add cut type
  const handleAddCutType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCutName.trim() || !newCategory) return;
    setCutTypes((prev) => [
      ...prev,
      {
        id: prev.length ? Math.max(...prev.map(c => c.id)) + 1 : 1,
        name: newCutName.trim(),
        category: newCategory === 'all' ? 'All' :
                  newCategory.charAt(0).toUpperCase() + newCategory.slice(1),
        status: newStatus ? 'Active' : 'Inactive',
      },
    ]);
    setNewCutName('');
    setNewCategory('all'); // Reset to a valid category so select always works
    setNewStatus(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Add Cut Types</h1>
        <p className="text-gray-600">Manage different cut types for seafood products</p>
      </div>

      {/* Add Cut Type Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Cut Type</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAddCutType}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cutName">Cut Type Name</Label>
                <Input
                  id="cutName"
                  placeholder="e.g., Whole Cleaned, Curry Cut"
                  value={newCutName}
                  onChange={e => setNewCutName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category Mapping</Label>
                <select
                  id="category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Category</option>
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
              <Switch
                id="cutStatus"
                checked={newStatus}
                onCheckedChange={setNewStatus}
              />
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Cut Type
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Cut Types */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Cut Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Cut Type Name</th>
                  <th className="text-left py-3 px-4">Category</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cutTypes.map((cut) => (
                  <tr key={cut.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{cut.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{cut.category}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={cut.status === 'Active' ? 'default' : 'secondary'}>
                        {cut.status}
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
};

export default AddCutTypes;
