import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Loader } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import { toast } from 'react-toastify';

interface StoreLowStockItem {
  inventoryId: string;
  productId: string;
  productName: string;
  productImage: string;
  category: { _id: string; name: string };
  cost: number;
  isProductActive: boolean;
  currentStock: number;
  threshold: number;
  deficit: number;
}

const InventoryAlerts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<StoreLowStockItem[]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [threshold, setThreshold] = useState<number>(10);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<any>('/api/stores/');
        if (!res.success) throw new Error(res.message || 'Failed to fetch stores');

        setStores(res.stores || []);

        if (res.stores?.length > 0) {
          setSelectedStoreId(res.stores[0]._id);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Fetch inventory
  useEffect(() => {
    if (!selectedStoreId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<any>(
          `/api/admin/store-low-stock-products/${selectedStoreId}`
        );

        if (!res.success) throw new Error(res.message || 'Failed to fetch inventory alerts');

        setItems(res.data || []);
        setStoreName(res.store?.storeName || '');
        setStoreAddress(res.store?.storeAddress || '');
        setThreshold(res.threshold || 10);
      } catch (e: any) {
        setError(e?.message || 'Failed to load inventory alerts');
        toast.error(e?.message || 'Failed to load inventory alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStoreId]);

  const getStatusColor = (item: StoreLowStockItem) => {
    if (item.currentStock <= 0) return 'bg-red-100 text-red-700';
    if (item.currentStock <= item.threshold) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusLabel = (item: StoreLowStockItem) => {
    if (item.currentStock <= 0) return 'Out of Stock';
    if (item.currentStock <= item.threshold) return 'Low Stock';
    return 'In Stock';
  };

  return (
    <section className="mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>

          <div className="flex flex-col md:flex-row md:items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Select Store:</span>

              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Choose a store..." />
                </SelectTrigger>

                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store._id} value={store._id}>
                      {store.name} ({store.address})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {storeName && (
              <div className="text-sm text-gray-500">
                {storeName}
                {storeAddress ? ` - ${storeAddress}` : ''}
              </div>
            )}
          </div>
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
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">Category</th>
                    <th className="px-6 py-4 text-left">Product Name</th>
                    <th className="px-6 py-4 text-right">Current Stock</th>
                    <th className="px-6 py-4 text-right">Alert Limit</th>
                    <th className="px-6 py-4 text-right">Deficit</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr key={item.inventoryId}>
                      <td className="px-6 py-4 text-left">{item.category?.name || '—'}</td>
                      <td className="px-6 py-4 text-left">{item.productName}</td>
                      <td className="px-6 py-4 text-right">{Number(item.currentStock).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">{Number(item.threshold).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">{Number(item.deficit).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge className={getStatusColor(item)}>
                          {getStatusLabel(item)}
                        </Badge>
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
    </section>
  );
};

export default InventoryAlerts;