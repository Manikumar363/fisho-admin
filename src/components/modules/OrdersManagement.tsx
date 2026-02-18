import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Download, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { apiFetch, getAdminData, getUserRole } from '../../lib/api';
import { toast } from 'sonner';

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
  deliveryType?: string;
  store?: any;
  storeId?: string;
}

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // User and store state
  const [userRole, setUserRole] = useState<string>('admin');
  const [storeId, setStoreId] = useState<string | null>(null);

  // API state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [search, setSearch] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState({
    totalOrders: 0,
    ongoingOrders: 0,
    expressOrders: 0,
    nextDayOrders: 0
  });

  // Get user role and store data on mount
  useEffect(() => {
    const role = getUserRole();
    setUserRole(role || 'admin');

    if (role === 'subadmin') {
      const adminData = getAdminData();
      if (adminData?.store?.id) {
        setStoreId(adminData.store.id);
      } else if (adminData?.id) {
        setStoreId(adminData.id);
      }
    }
  }, []);

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
    
    // For sub-admin, filter by storeId
    if (userRole === 'subadmin' && storeId) {
      params.append('storeId', storeId);
    }
    
    if (selectedType !== 'all') params.append('deliveryType', selectedType);
    if (search.trim()) params.append('search', search.trim());

    apiFetch<{
      success: boolean;
      data: Order[];
      pagination: { page: number; limit: number; total: number; pages: number };
      stats?: { totalOrders: number; ongoingOrders: number; expressOrders: number; nextDayOrders: number };
      message?: string;
    }>(`/api/order/order-history?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch order history');
        // Sort orders by creation date (latest first)
        const sortedOrders = (res.data || []).sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setOrders(sortedOrders);
        setTotalPages(res.pagination?.pages || 1);
        setTotalOrders(res.pagination?.total || 0);
        if (res.stats) {
          setStats(res.stats);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to fetch order history');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedType, currentPage, search, userRole, storeId]);

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

  const capitalize = (str: string) => {
    return str.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'accepted' || statusLower === 'accept') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
    if (statusLower === 'delivered') return 'bg-blue-100 text-blue-700 border border-blue-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getStoreId = (order: Order) =>
    (order as any).store?._id || (order as any).store?.id || (order as any).storeId;

  const handleAcceptOrder = async (order: Order) => {
    const storeId = getStoreId(order);
    if (!storeId) {
      toast.error('Store ID not found for this order');
      return;
    }
    setAcceptingId(order._id);
    try {
      const res = await apiFetch<{ success: boolean; data?: Order; message?: string }>(
        '/api/order/accept-order',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, storeId }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to accept order');
      if (res.data) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data! : o)));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'accepted' } : o)));
      }
      toast.success(res.message || 'Order accepted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept order');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectOrder = async (order: Order) => {
    const storeId = getStoreId(order);
    if (!storeId) {
      toast.error('Store ID not found for this order');
      return;
    }
    setRejectingId(order._id);
    try {
      const res = await apiFetch<{ success: boolean; data?: Order; message?: string }>(
        '/api/order/reject-order',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, storeId }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to cancel order');
      if (res.data) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data! : o)));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'cancelled' } : o)));
      }
      toast.success(res.message || 'Order cancelled successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to cancel order');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">
            {userRole === 'subadmin' ? 'My Store Orders' : 'Orders Management'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'subadmin' 
              ? 'Track and manage orders for your store'
              : 'Track and manage all online orders'}
          </p>
        </div>
        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ongoing Orders</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.ongoingOrders}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Express Orders</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.expressOrders}</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Day Orders</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.nextDayOrders}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder={userRole === 'subadmin' 
                  ? "Search by order ID, customer name, or phone..." 
                  : "Search by order ID, customer name, or phone..."}
                className="pl-10"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            {userRole !== 'subadmin' && (
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
            )}
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
                  <th className="text-left py-3 px-4">Delivery Type</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 text-center text-gray-600">Loading orders...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 text-center text-red-600">{error}</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-4 px-4 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isPending = order.status?.toLowerCase() === 'pending';
                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{order.invoiceNo || order._id}</td>
                        <td className="py-3 px-4">{order.shippingAddress?.name || '—'}</td>
                        <td className="py-3 px-4">{order.items?.length || 0}</td>
                        <td className="py-3 px-4"><span className="dirham-symbol mr-1">&#xea;</span>{parseFloat(order.pricing?.grandTotal || '0').toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {capitalize(order.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {order.deliveryType ? (
                            <Badge className={order.deliveryType?.toLowerCase() === 'express' ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}>
                              {capitalize(order.deliveryType)}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  className="border-2 border-green-600 bg-green-600 text-white hover:bg-green-700"
                                  onClick={() => handleAcceptOrder(order)}
                                  disabled={acceptingId === order._id || rejectingId === order._id}
                                >
                                  {acceptingId === order._id ? 'Accepting...' : 'Accept'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectOrder(order)}
                                  disabled={acceptingId === order._id || rejectingId === order._id}
                                >
                                  {rejectingId === order._id ? 'Rejecting...' : 'Reject'}
                                </Button>
                              </>
                            )}
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => navigate(`/orders/${order._id}`)}
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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