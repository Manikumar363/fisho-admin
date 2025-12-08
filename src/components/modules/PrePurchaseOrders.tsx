import React, { useState } from 'react';
import { Plus, Eye, Edit, Trash2, Download, X, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface Particular {
  id: string;
  product: string;
  costPrice: string;
  quantity: string;
  amount: number;
  vat: string;
  totalAmount: number;
}

export default function PrePurchaseOrders() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState('');
  const [particulars, setParticulars] = useState<Particular[]>([
    {
      id: '1',
      product: '',
      costPrice: '',
      quantity: '',
      amount: 0,
      vat: '',
      totalAmount: 0
    }
  ]);

  // Mock data for pre-purchase orders
  const ppoList = [
    {
      id: 'PPO-001',
      date: '28/11/2024',
      noOfParticulars: 5,
      ppoValue: 45680
    },
    {
      id: 'PPO-002',
      date: '27/11/2024',
      noOfParticulars: 3,
      ppoValue: 28900
    },
    {
      id: 'PPO-003',
      date: '26/11/2024',
      noOfParticulars: 8,
      ppoValue: 67500
    },
    {
      id: 'PPO-004',
      date: '25/11/2024',
      noOfParticulars: 4,
      ppoValue: 32150
    },
    {
      id: 'PPO-005',
      date: '24/11/2024',
      noOfParticulars: 6,
      ppoValue: 51200
    }
  ];

  // Mock products
  const products = [
    'Tiger Prawns',
    'King Prawns',
    'Salmon',
    'Pomfret',
    'Tuna',
    'Mud Crab',
    'Squid',
    'Lobster'
  ];

  const handleAddParticular = () => {
    setParticulars([
      ...particulars,
      {
        id: Date.now().toString(),
        product: '',
        costPrice: '',
        quantity: '',
        amount: 0,
        vat: '',
        totalAmount: 0
      }
    ]);
  };

  const handleRemoveParticular = (id: string) => {
    if (particulars.length > 1) {
      setParticulars(particulars.filter(p => p.id !== id));
    }
  };

  const handleParticularChange = (id: string, field: keyof Particular, value: string) => {
    setParticulars(particulars.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        
        // Calculate amount (Cost Price × Quantity)
        const costPrice = parseFloat(updated.costPrice) || 0;
        const quantity = parseFloat(updated.quantity) || 0;
        updated.amount = costPrice * quantity;
        
        // Calculate total amount (Amount + VAT%)
        const vat = parseFloat(updated.vat) || 0;
        updated.totalAmount = updated.amount + (updated.amount * vat / 100);
        
        return updated;
      }
      return p;
    }));
  };

  const calculatePPOTotal = () => {
    return particulars.reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting PPO:', { billNo, date, particulars });
    // Reset form
    setBillNo('');
    setDate('');
    setParticulars([{
      id: '1',
      product: '',
      costPrice: '',
      quantity: '',
      amount: 0,
      vat: '',
      totalAmount: 0
    }]);
    setShowAddForm(false);
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="mb-2">Add Pre-Purchase Order</h1>
            <p className="text-gray-600">Create a new pre-purchase order</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAddForm(false)}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>PPO Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billNo">Bill No *</Label>
                  <Input
                    id="billNo"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="Enter bill number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Particulars Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Particulars</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParticular}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Particular
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Product *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Cost Price (₹) *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Quantity *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Amount (₹)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">VAT % *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Total Amount (₹)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {particulars.map((particular) => (
                        <tr key={particular.id} className="border-t">
                          <td className="py-3 px-4">
                            <Select
                              value={particular.product}
                              onValueChange={(value: string) => handleParticularChange(particular.id, 'product', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product: string) => (
                                  <SelectItem key={product} value={product}>
                                    {product}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.costPrice}
                              onChange={(e) => handleParticularChange(particular.id, 'costPrice', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.quantity}
                              onChange={(e) => handleParticularChange(particular.id, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={particular.amount.toFixed(2)}
                              disabled
                              className="bg-gray-50"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.vat}
                              onChange={(e) => handleParticularChange(particular.id, 'vat', e.target.value)}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={particular.totalAmount.toFixed(2)}
                              disabled
                              className="bg-gray-50 font-semibold"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveParticular(particular.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              disabled={particulars.length === 1}
                            >
                              <Trash2 className={`w-4 h-4 ${particulars.length === 1 ? 'text-gray-300' : 'text-red-600'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700">Total PPO Value:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ₹{calculatePPOTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save PPO
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Pre-Purchase Orders</h1>
          <p className="text-gray-600">Manage all pre-purchase orders</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Pre-Purchase Order
        </Button>
      </div>

      {/* PPO List Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pre-Purchase Orders ({ppoList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">PPO ID</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">No. of Particulars</th>
                  <th className="text-left py-3 px-4">PPO Value</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ppoList.map((ppo) => (
                  <tr key={ppo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-blue-600">{ppo.id}</td>
                    <td className="py-3 px-4">{ppo.date}</td>
                    <td className="py-3 px-4">{ppo.noOfParticulars}</td>
                    <td className="py-3 px-4 font-semibold">₹{ppo.ppoValue.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded" title="View">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Download">
                          <Download className="w-4 h-4 text-gray-600" />
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
