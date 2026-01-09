import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { apiFetch } from '../../../lib/api';

interface ViewStoreProps {
  storeId: string;
  onBack: () => void;
}

export default function ViewStore({ storeId, onBack }: ViewStoreProps) {
  const [selectedMonth, setSelectedMonth] = useState('december-2024');
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStore(null);

    apiFetch<{ success: boolean; store: any; message?: string }>(`/api/stores/${storeId}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch store');
        setStore(res.store);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch store';
        console.error('Fetch store error:', err);
        setError(msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId]);

  const headerTitle = useMemo(() => {
    if (loading) return 'Loading store...';
    if (error) return 'Store unavailable';
    return store?.name || 'Store details';
  }, [loading, error, store?.name]);

  const headerSubtitle = useMemo(() => {
    if (loading) return 'Fetching store details';
    if (error) return error;
    const address = store?.address ? store.address : '—';
    const manager = store?.manager?.name ? `Managed by ${store.manager.name}` : 'Manager not assigned';
    return `${address} • ${manager}`;
  }, [loading, error, store?.address, store?.manager?.name]);

  // Mock inventory data
  const inventory = [
    { id: 1, productName: 'Salmon', variant: 'Fresh - Premium Cut', stock: 12.5, alert: 'green' },
    { id: 2, productName: 'Tuna', variant: 'Frozen - Steaks', stock: 8.2, alert: 'green' },
    { id: 3, productName: 'Prawns', variant: 'Fresh - Large', stock: 3.5, alert: 'red' },
    { id: 4, productName: 'Mackerel', variant: 'Fresh - Whole', stock: 15.0, alert: 'green' },
    { id: 5, productName: 'Pomfret', variant: 'Fresh - Medium', stock: 4.2, alert: 'red' },
    { id: 6, productName: 'Squid', variant: 'Fresh - Cleaned', stock: 2.8, alert: 'red' },
    { id: 7, productName: 'Crab', variant: 'Live - Large', stock: 6.5, alert: 'green' },
    { id: 8, productName: 'Lobster', variant: 'Fresh - Whole', stock: 9.3, alert: 'green' }
  ];

  // Mock orders data
  const orders = [
    { 
      orderId: 'ORD-1234', 
      date: '2024-12-04', 
      customerName: 'John Doe', 
      orderValue: '₹2,450', 
      deliveryType: 'Next Day', 
      status: 'Delivered' 
    },
    { 
      orderId: 'ORD-1235', 
      date: '2024-12-04', 
      customerName: 'Jane Smith', 
      orderValue: '₹3,200', 
      deliveryType: 'Express', 
      status: 'In Transit' 
    },
    { 
      orderId: 'ORD-1236', 
      date: '2024-12-03', 
      customerName: 'Mike Johnson', 
      orderValue: '₹1,890', 
      deliveryType: 'Next Day', 
      status: 'Delivered' 
    },
    { 
      orderId: 'ORD-1237', 
      date: '2024-12-03', 
      customerName: 'Sarah Wilson', 
      orderValue: '₹4,560', 
      deliveryType: 'Bulk Order', 
      status: 'Processing' 
    },
    { 
      orderId: 'ORD-1238', 
      date: '2024-12-02', 
      customerName: 'Tom Brown', 
      orderValue: '₹2,100', 
      deliveryType: 'Express', 
      status: 'Delivered' 
    }
  ];

  const handleDownloadLedger = () => {
    console.log('Downloading ledger for month:', selectedMonth);
    // Download logic here
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="mb-2">{headerTitle}</h1>
          <p className="text-gray-600">{headerSubtitle}</p>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-6 text-gray-600">Loading store details...</CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-6 text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* Store Inventory Section */}
      <Card>
        <CardHeader>
          <CardTitle>Store Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Product Name</th>
                  <th className="text-left py-3 px-4">Variant</th>
                  <th className="text-left py-3 px-4">Available Stock (kg)</th>
                  <th className="text-left py-3 px-4">Inventory Alert</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{item.productName}</td>
                    <td className="py-3 px-4 text-gray-600">{item.variant}</td>
                    <td className="py-3 px-4">{item.stock} kg</td>
                    <td className="py-3 px-4">
                      {item.alert === 'red' ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <div className="w-3 h-3 rounded-full bg-red-600"></div>
                          <span>Low Stock</span>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-3 h-3 rounded-full bg-green-600"></div>
                          <span>In Stock</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Store Orders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Orders</CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="december-2024">December 2024</SelectItem>
                <SelectItem value="november-2024">November 2024</SelectItem>
                <SelectItem value="october-2024">October 2024</SelectItem>
                <SelectItem value="september-2024">September 2024</SelectItem>
                <SelectItem value="august-2024">August 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Customer Name</th>
                  <th className="text-left py-3 px-4">Order Value</th>
                  <th className="text-left py-3 px-4">Delivery Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-blue-600">{order.orderId}</td>
                    <td className="py-3 px-4">{order.date}</td>
                    <td className="py-3 px-4">{order.customerName}</td>
                    <td className="py-3 px-4">{order.orderValue}</td>
                    <td className="py-3 px-4">{order.deliveryType}</td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={
                          order.status === 'Delivered' ? 'default' : 
                          order.status === 'In Transit' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Store Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Download the complete ledger report for the selected month
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current Selection: {selectedMonth === 'december-2024' ? 'December 2024' : 
                  selectedMonth === 'november-2024' ? 'November 2024' : 
                  selectedMonth === 'october-2024' ? 'October 2024' : 
                  selectedMonth === 'september-2024' ? 'September 2024' : 'August 2024'}
              </p>
            </div>
            <Button 
              onClick={handleDownloadLedger}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Ledger (Selected Month)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
