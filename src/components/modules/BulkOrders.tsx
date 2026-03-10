import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BulkOrderItem {
  product: string;
  variant: string;
  weight: number;
  preferredDeliveryDate: string;
  preferredDeliveryTime: string;
  notes: string;
  _id: string;
}

interface BulkOrder {
  _id: string;
  user: string;
  createdAt: string;
  shippingAddress: {
    name: string;
    phone: string;
    pincode: string;
    addressLine1: string;
    city: string;
    state: string;
    country: string;
    landmark: string;
  };
  items: BulkOrderItem[];
  pricing: {
    grandTotal: string;
    tax: string;
    discount: string;
    shipping: string;
  };
  payment: {
    method: string;
    status: string;
  };
  orderType: string;
  status: string;
  updatedAt: string;
  preferredDeliveryDate?: string;
  preferredDeliveryTime?: string;
  notes?: string;
}

export default function BulkOrders() {
  const navigate = useNavigate();

  // API state
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Fetch bulk orders from API
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setOrders([]);

    // Build query params
    const params = new URLSearchParams();
    params.append('page', String(currentPage));
    params.append('limit', '20');

    // Add search parameter if search input is provided
    if (searchInput.trim()) {
      params.append('search', searchInput.trim());
    }

    // Add status filter if selected
    if (selectedStatus !== 'all') {
      params.append('status', selectedStatus);
    }

    apiFetch<{
      success: boolean;
      data: BulkOrder[];
      pagination: { page: number; limit: number; total: number; pages: number };
      message?: string;
    }>(`/api/bulk-order/all-orders?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch bulk orders');
        setOrders(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalOrders(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to fetch bulk orders');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentPage, searchInput, selectedStatus])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilterSelect = (status: string) => {
    setSelectedStatus(status);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    return orders;
  }, [orders])

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str: string | undefined | null) => {
    if (!str) return '—';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStatusBadgeClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700 border border-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower === 'requested') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'accepted') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'quotation_added') return 'bg-purple-100 text-purple-700 border border-purple-300';
    if (statusLower === 'payment_confirmed') return 'bg-blue-100 text-blue-700 border border-blue-300';
    if (statusLower === 'processing') return 'bg-cyan-100 text-cyan-700 border border-cyan-300';
    if (statusLower === 'order_ready') return 'bg-indigo-100 text-indigo-700 border border-indigo-300';
    if (statusLower === 'order_delivered') return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getPaymentStatusBadgeClass = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-700 border border-gray-300';
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    if (statusLower === 'completed' || statusLower === 'paid') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'failed') return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const handleAcceptOrder = async (order: BulkOrder) => {
    setAcceptingId(order._id);
    try {
      const res = await apiFetch<{ success: boolean; data?: BulkOrder; message?: string }>(
        '/api/bulk-order/status-update',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, status: 'accepted' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to accept order');
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'accepted' } : o)));
      toast.success(res.message || 'Order accepted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept order');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectOrder = async (order: BulkOrder) => {
    setRejectingId(order._id);
    try {
      const res = await apiFetch<{ success: boolean; data?: BulkOrder; message?: string }>(
        '/api/bulk-order/status-update',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, status: 'rejected' }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to reject order');
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'rejected' } : o)));
      toast.success(res.message || 'Order rejected successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject order');
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Bulk Orders Management</h1>
          <p className="text-gray-600">Track and manage all bulk orders</p>
        </div>
        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4 mr-2" />
          Export Bulk Orders
        </Button>
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
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={selectedStatus !== 'all' ? 'border-blue-600 text-blue-600' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border rounded-lg shadow-lg z-10">
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Filter by Status</span>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedStatus !== 'all' && (
                      <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                  <div className="p-2 max-h-80 overflow-y-auto">
                    <button
                      onClick={clearFilters}
                      className={selectedStatus === 'all' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      All Orders ({totalOrders})
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('requested')}
                      className={selectedStatus === 'requested' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Requested
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('accepted')}
                      className={selectedStatus === 'accepted' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Accepted
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('quotation_added')}
                      className={selectedStatus === 'quotation_added' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Quotation Added
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('payment_confirmed')}
                      className={selectedStatus === 'payment_confirmed' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Payment Confirmed
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('processing')}
                      className={selectedStatus === 'processing' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('order_ready')}
                      className={selectedStatus === 'order_ready' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Order Ready
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('order_delivered')}
                      className={selectedStatus === 'order_delivered' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Delivered
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('rejected')}
                      className={selectedStatus === 'rejected' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Rejected
                    </button>
                    <button
                      onClick={() => handleStatusFilterSelect('cancelled')}
                      className={selectedStatus === 'cancelled' ? 'w-full text-left px-3 py-2 rounded hover:bg-gray-50 bg-blue-50 text-blue-600' : 'w-full text-left px-3 py-2 rounded hover:bg-gray-50'}
                    >
                      Cancelled
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
            Bulk Orders ({filteredAndSortedOrders.length} of {totalOrders})
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
                  <th className="text-left py-3 px-4">Preferred Delivery</th>
                  <th className="text-left py-3 px-4">Order Status</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-600">
                      Loading orders...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredAndSortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOrders.map((order) => {
                    const isPending = order.status?.toLowerCase() === 'requested';

                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600 font-medium">
                          {order._id ? order._id.substring(0, 12) + '...' : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{order.shippingAddress?.name || '—'}</p>
                            <p className="text-sm text-gray-600">{order.shippingAddress?.phone || '—'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{order.items?.length || 0} item(s)</Badge>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <span className="dirham-symbol mr-1">&#xea;</span>
                          {parseFloat(order.pricing?.grandTotal || '0').toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p>
                              {order.preferredDeliveryDate
                                ? formatDeliveryDate(order.preferredDeliveryDate)
                                : '—'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {order.preferredDeliveryTime || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeClass(order.status)}>
                            {capitalize(order.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getPaymentStatusBadgeClass(order.payment?.status)}>
                            {capitalize(order.payment?.status || 'pending')}
                          </Badge>
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
                              onClick={() => navigate(`/bulk-order/${order._id}`)}
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
          {!loading && !error && filteredAndSortedOrders.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
