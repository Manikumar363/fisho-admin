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
  invoiceUrl?: string;
  receiptUrl?: string;
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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
  const [searchInput, setSearchInput] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  
  // Stats state
  const [stats, setStats] = useState<{
    totalOrders: number;
    statusCounts: Record<string, number>;
    ongoingOrders: number;
    deliveryTypeCounts: {
      express: number;
      nextDay: number;
    };
  }>({
    totalOrders: 0,
    statusCounts: {},
    ongoingOrders: 0,
    deliveryTypeCounts: { express: 0, nextDay: 0 }
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
    
    // Add search parameter if search input is provided
    if (searchInput.trim()) {
      params.append('search', searchInput.trim());
    }
    
    if (selectedType !== 'all') {
      const apiDeliveryType = selectedType === 'next-day' ? 'nextDay' : selectedType;
      params.append('deliveryType', apiDeliveryType);
    }
    if (selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }
    apiFetch<{
      success: boolean;
      data: Order[];
      pagination: { page: number; limit: number; total: number; pages: number };
      stats?: {
        totalOrders: number;
        statusCounts: Record<string, number>;
        ongoingOrders: number;
        deliveryTypeCounts: { express: number; nextDay: number };
      };
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
  }, [selectedType, selectedStatus, currentPage, userRole, storeId, searchInput]);

  const normalizeDeliveryType = (type?: string) => {
    const normalized = (type || '').toLowerCase().replace(/[_\s]/g, '-');
    if (normalized === 'nextday' || normalized === 'next-day') return 'next-day';
    if (normalized === 'express') return 'express';
    return normalized || 'other';
  };

  const filteredOrders = React.useMemo(() => {
    // Since API handles search filtering now, just return all orders
    // The API response already contains filtered results
    return orders;
  }, [orders]);

  // Delivery type stats (for filter counts)
  const deliveryTypeStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    orders.forEach((order) => {
      const type = normalizeDeliveryType((order as any).deliveryType);
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats;
  }, [orders]);

  const handleFilterSelect = (type: string) => {
    setSelectedType(type);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const handleStatusFilterSelect = (status: string) => {
    setSelectedStatus(status);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedType('all');
    setSelectedStatus('all');
    setCurrentPage(1);
    setShowFilterMenu(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str?: string) => {
    if (!str) return 'N/A';
    return str.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700 border border-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'accepted' || statusLower === 'accept') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
    if (statusLower === 'delivered') return 'bg-blue-100 text-blue-700 border border-blue-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getPaymentStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700 border border-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    if (statusLower === 'paid') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'failed') return 'bg-red-100 text-red-700 border border-red-300';
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
      const payload = { 
        orderId: order._id, 
        storeId: storeId,
        status: 'accepted' 
      };
      console.log('Accepting order with payload:', payload);
      const res = await apiFetch<{ success: boolean; data?: { order: Partial<Order> }; message?: string }>(
        '/api/order/status-update',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to accept order');
      // Merge the partial order data from API with existing order data
      if (res.data?.order) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, ...res.data!.order } : o)));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'accepted' } : o)));
      }
      toast.success('Order accepted successfully');
    } catch (err: any) {
      console.error('Accept order error:', err);
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
      const payload = { 
        orderId: order._id, 
        storeId: storeId,
        status: 'rejected' 
      };
      console.log('Rejecting order with payload:', payload);
      const res = await apiFetch<{ success: boolean; data?: { order: Partial<Order> }; message?: string }>(
        '/api/order/status-update',
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to reject order');
      // Merge the partial order data from API with existing order data
      if (res.data?.order) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, ...res.data!.order } : o)));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'rejected' } : o)));
      }
      toast.success('Order rejected successfully');
    } catch (err: any) {
      console.error('Reject order error:', err);
      toast.error(err?.message || 'Failed to reject order');
    } finally {
      setRejectingId(null);
    }
  };

  const downloadFileFromUrl = async (fileUrl: string, filename: string) => {
    const isAbsoluteUrl = /^https?:\/\//i.test(fileUrl);

    // External links (like S3) should be opened directly to avoid CORS/auth header issues.
    if (isAbsoluteUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch(fileUrl, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  };

  const handleDownloadInvoice = async (order: Order) => {
    setDownloadingInvoiceId(order._id);
    try {
      const invoiceUrl = order.invoiceUrl || order.receiptUrl;

      if (!invoiceUrl) {
        toast.info('Invoice not available for this order');
        return;
      }

      const filename = `${order.invoiceNo || order._id}.pdf`;
      await downloadFileFromUrl(invoiceUrl, filename);
      toast.success('Invoice downloaded successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
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

      {/* Stats Cards - Horizontal Scroll */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Total Orders */}
          <Card className="flex-shrink-0 w-30">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ongoing Orders */}
          <Card className="flex-shrink-5 w-28">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-600 mb-1">Ongoing Orders</p>
                <p className="text-2xl font-bold text-orange-600">{stats.ongoingOrders}</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Orders */}
          {stats.statusCounts.pending !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.statusCounts.pending || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accepted Orders */}
          {stats.statusCounts.accepted !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Accepted</p>
                  <p className="text-2xl font-bold text-green-600">{stats.statusCounts.accepted || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rejected Orders */}
          {stats.statusCounts.rejected !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">{stats.statusCounts.rejected || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ready to Pickup */}
          {stats.statusCounts.ready_to_pickup !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Ready to Pickup</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.statusCounts.ready_to_pickup || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accepted by Delivery Partner */}
          {stats.statusCounts.accepted_by_delivery_partner !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Accepted by Partner</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.statusCounts.accepted_by_delivery_partner || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Picked Up */}
          {stats.statusCounts.picked_up !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Picked Up</p>
                  <p className="text-2xl font-bold text-teal-600">{stats.statusCounts.picked_up || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Out for Delivery */}
          {stats.statusCounts.out_for_delivery !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Out for Delivery</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.statusCounts.out_for_delivery || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivered Orders */}
          {stats.statusCounts.delivered !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Delivered</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.statusCounts.delivered || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancelled Orders */}
          {stats.statusCounts.cancelled !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.statusCounts.cancelled || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Returned Orders */}
          {stats.statusCounts.returned !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Returned</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.statusCounts.returned || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refunded Orders */}
          {stats.statusCounts.refunded !== undefined && (
            <Card className="flex-shrink-0 w-36">
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <p className="text-xs font-medium text-gray-600 mb-1">Refunded</p>
                  <p className="text-2xl font-bold text-pink-600">{stats.statusCounts.refunded || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Express Orders */}
          <Card className="flex-shrink-0 w-36">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-600 mb-1">Express Orders</p>
                <p className="text-2xl font-bold text-violet-600">{stats.deliveryTypeCounts.express || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Next Day Orders */}
          <Card className="flex-shrink-0 w-36">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-600 mb-1">Next Day Orders</p>
                <p className="text-2xl font-bold text-sky-600">{stats.deliveryTypeCounts.nextDay || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by order ID or customer name..."
                className="pl-10"
                value={searchInput}
                onChange={handleSearchChange}
              />
            </div>
            {userRole !== 'subadmin' && (
              <div className="relative">
                <Button 
                  variant="outline"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className={selectedType !== 'all' || selectedStatus !== 'all' ? 'border-blue-600 text-blue-600' : ''}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {(selectedType !== 'all' || selectedStatus !== 'all') && (
                    <Badge variant="default" className="ml-2 bg-blue-600">
                      {(selectedType !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)}
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
                      {(selectedType !== 'all' || selectedStatus !== 'all') && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                    <div className="p-2">
                      <button
                        onClick={clearFilters}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                          selectedType === 'all' && selectedStatus === 'all' ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        All Orders ({totalOrders})
                      </button>
                      <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500">Status</div>
                      <button
                        onClick={() => handleStatusFilterSelect('pending')}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                          selectedStatus === 'pending' ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        Pending
                      </button>
                      <button
                        onClick={() => handleStatusFilterSelect('delivered')}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                          selectedStatus === 'delivered' ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        Delivered
                      </button>
                      <div className="px-3 pt-3 pb-1 text-xs font-semibold text-gray-500">Delivery Type</div>
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
            Online Orders ({filteredOrders.length})
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
                  <th className="text-left py-3 px-4">Payment Status</th>
                  <th className="text-left py-3 px-4">Delivery Type</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-600">Loading orders...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-red-600">{error}</td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPending = order.status?.toLowerCase() === 'pending';
                    const paymentMethod = order.payment?.method?.toLowerCase() || '';
                    const paymentStatus = order.payment?.status?.toLowerCase() || '';
                    const isOfflinePayment = paymentMethod === 'cod' || paymentMethod === 'cash' || paymentMethod === 'offline';
                    // Show accept/reject buttons only if order is pending AND (payment is offline OR payment is already paid)
                    const canShowButtons = isPending && (isOfflinePayment || paymentStatus === 'paid');
                    
                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{order.invoiceNo || order._id}</td>
                        <td className="py-3 px-4">{order.shippingAddress?.name || '—'}</td>
                        <td className="py-3 px-4">{order.items?.length || 0}</td>
                        <td className="py-3 px-4"><span className="dirham-symbol mr-2">&#xea;</span>{parseFloat(order.pricing?.grandTotal || '0').toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {capitalize(order.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getPaymentStatusBadgeClass(order.payment?.status)}>
                            {capitalize(order.payment?.status)}
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
                            {canShowButtons && (
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
                              onClick={() => handleDownloadInvoice(order)}
                              disabled={downloadingInvoiceId === order._id}
                              title="Download Invoice"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => navigate(`/orders/${order._id}`)}
                              title="View Order"
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
          {!loading && !error && filteredOrders.length > 0 && totalPages > 1 && (
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