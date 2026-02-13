import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader, Edit, X, Check } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  species: string;
  productName: string;
  availableQuantity: number;
  alertLimit: number;
  status: 'In Stock' | 'Out of Stock';
}

export default function InventoryAlerts() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingAlerts, setSavingAlerts] = useState<{ [key: string]: boolean }>({});
  const [alertLimits, setAlertLimits] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const IMAGE_BASE = ((import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_BASE_URL) as string | undefined;

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch products
      const res = await apiFetch<{
        success: boolean;
        products?: Array<{
          _id: string;
          name: string;
          category?: { _id: string; name: string };
          stock: number;
          lowStockThreshold?: number;
          isActive: boolean;
        }>;
        message?: string;
      }>('/api/products');

      if (!res.success) throw new Error(res.message || 'Failed to fetch products');

      const mapped: InventoryItem[] = (res.products || [])
        .filter(p => p.isActive)
        .map(p => {
          let species = '—';
          if (p.category && typeof p.category === 'object') {
            species = p.category.name || '—';
          }

          const alertLimit = p.lowStockThreshold || 10;
          const isOutOfStock = p.stock <= 0;
          const isLowStock = p.stock <= alertLimit;

          return {
            id: p._id,
            species,
            productName: p.name,
            availableQuantity: p.stock,
            alertLimit,
            status: isOutOfStock ? 'Out of Stock' : 'In Stock'
          };
        });

      setInventoryItems(mapped);

      // Initialize alert limits with current values
      const limits: { [key: string]: string } = {};
      mapped.forEach(item => {
        limits[item.id] = item.alertLimit.toString();
      });
      setAlertLimits(limits);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load inventory data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertLimitChange = (itemId: string, value: string) => {
    setAlertLimits(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSaveAlertLimit = async (itemId: string) => {
    const newLimit = parseFloat(alertLimits[itemId] || '0');
    
    if (isNaN(newLimit) || newLimit < 0) {
      toast.error('Please enter a valid alert limit');
      return;
    }

    setSavingAlerts(prev => ({ ...prev, [itemId]: true }));
    try {
      const res = await apiFetch<{
        success: boolean;
        product?: {
          _id: string;
          lowStockThreshold: number;
        };
        message?: string;
      }>(`/api/products/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          lowStockThreshold: newLimit
        })
      });

      if (!res.success) throw new Error(res.message || 'Failed to update alert limit');

      // Update local state
      setInventoryItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, alertLimit: newLimit }
          : item
      ));

      toast.success('Alert limit updated successfully');
      setEditingId(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to update alert limit';
      toast.error(msg);
    } finally {
      setSavingAlerts(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const getStatusColor = (item: InventoryItem) => {
    if (item.availableQuantity <= 0) {
      return 'bg-red-100 text-red-700';
    } else if (item.availableQuantity <= item.alertLimit) {
      return 'bg-yellow-100 text-yellow-700';
    } else {
      return 'bg-green-100 text-green-700';
    }
  };

  const getStatusLabel = (item: InventoryItem) => {
    if (item.availableQuantity <= 0) {
      return 'Out of Stock';
    } else if (item.availableQuantity <= item.alertLimit) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory Status</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Loading inventory data...
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              {error}
            </div>
          ) : inventoryItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Species</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Product Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Available Quantity</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Set Alert Limit</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventoryItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {item.species}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-medium text-gray-600">
                          {item.availableQuantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Input
                          type="number"
                          value={alertLimits[item.id] || ''}
                          onChange={(e) => handleAlertLimitChange(item.id, e.target.value)}
                          placeholder="Enter limit"
                          min="0"
                          className="w-32"
                          readOnly={editingId !== item.id}
                          disabled={savingAlerts[item.id]}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusColor(item)} hover:${getStatusColor(item)}`}>
                          {getStatusLabel(item)}
                        </Badge>
                      </td>
                       <td className="px-6 py-4">
                        {editingId === item.id ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveAlertLimit(item.id)}
                              disabled={savingAlerts[item.id]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {savingAlerts[item.id] ? (
                                <>
                                  <Loader className="w-3 h-3 mr-1 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setAlertLimits(prev => ({
                                  ...prev,
                                  [item.id]: item.alertLimit.toString()
                                }));
                              }}
                              disabled={savingAlerts[item.id]}
                              className="bg-gray-400 hover:bg-gray-500"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setEditingId(item.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No products found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend 
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">In Stock - Quantity above alert limit</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-gray-600">Low Stock - Quantity at or below alert limit</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Out of Stock - Quantity is zero</span>
            </div>
          </div>
        </CardContent>
      </Card>*/}
    </div>
  );
}
