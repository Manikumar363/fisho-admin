import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Download, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
// Import your apiFetch utility
import { apiFetch } from '../../lib/api';

interface Order {
  _id: string;
  invoiceNo: string;
  createdAt: string;
  shippingAddress: { name: string; phone: string };
  items: any[];
  pricing: { grandTotal: string };
  payment: { method: string; status: string };
  orderType: string;
  status: string;
}

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // API state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [search, setSearch] = useState('');

  // Filter state
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) setSelectedType(typeParam);
  }, [searchParams]);

  // Fetch orders from API
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setOrders([]);

    // Build query params
    const params = new URLSearchParams();
    params.append('orderType', 'online');
    params.append('page', String(currentPage));
    params.append('limit', '20');
    if (selectedType !== 'all') params.append('deliveryType', selectedType);
    if (search.trim()) params.append('search', search.trim());

    apiFetch<{
      success: boolean;
      data: Order[];
      pagination: { page: number; limit: number; total: number; pages: number };
      message?: string;
    }>(`/api/order/order-history?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch order history');
        setOrders(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalOrders(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to fetch order history');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedType, currentPage, search]);

  // Delivery type stats (for filter counts)
  const deliveryTypeStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    orders.forEach((order) => {
      const type = (order as any).deliveryType || 'other';
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }, [orders]);

  const handleFilterSelect = (type: string) => {
    setSelectedType(type);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'default';
    if (statusLower === 'processing' || statusLower === 'pending') return 'secondary';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'destructive';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage all online orders</p>
        </div>
        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by order ID, customer name, or phone..."
                className="pl-10"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="relative">
              <Button 
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={selectedType !== 'all' ? 'border-blue-600 text-blue-600' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {selectedType !== 'all' && (
                  <Badge variant="default" className="ml-2 bg-blue-600">
                    1
                  </Badge>
                )}
              </Button>
              
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Filter by Delivery Type</span>
                      <button 
                        onClick={() => setShowFilterMenu(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedType !== 'all' && (
                      <button
                        onClick={() => handleFilterSelect('all')}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => handleFilterSelect('all')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'all' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      All Orders ({totalOrders})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('express')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'express' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Express Orders ({deliveryTypeStats['express'] || 0})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('next-day')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'next-day' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Next-Day Orders ({deliveryTypeStats['next-day'] || 0})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('bulk')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'bulk' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Bulk Orders ({deliveryTypeStats['bulk'] || 0})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Online Orders ({totalOrders})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-4 text-center text-gray-600">Loading orders...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-4 text-center text-red-600">{error}</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 px-4 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-600">{order.invoiceNo || order._id}</td>
                      <td className="py-3 px-4">{order.shippingAddress?.name || '—'}</td>
                      <td className="py-3 px-4">{order.items?.length || 0}</td>
                      <td className="py-3 px-4"><span className="dirham-symbol mr-1">&#xea;</span>{order.pricing?.grandTotal || '0'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => navigate(`/orders/${order._id}`)}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {!loading && !error && orders.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}