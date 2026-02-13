import React, { useState, useEffect } from 'react';
import { Search, Download, Eye } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

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
    if (search.trim()) params.append('search', search.trim());

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
  }, [currentPage, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Format helpers
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'accepted' || statusLower === 'accept') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
    if (statusLower === 'delivered') return 'bg-blue-100 text-blue-700 border border-blue-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getPaymentStatusBadgeClass = (status: string) => {
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
        '/api/bulk-order/accept-order',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id }),
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

  const handleRejectOrder = async (order: BulkOrder) => {
    setRejectingId(order._id);
    try {
      const res = await apiFetch<{ success: boolean; data?: BulkOrder; message?: string }>(
        '/api/bulk-order/reject-order',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to reject order');
      if (res.data) {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? res.data! : o)));
      } else {
        setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: 'rejected' } : o)));
      }
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
          Export Orders
        </Button>
      </div>

      {/* Search */}
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
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Bulk Orders ({totalOrders})
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const isPending = order.status?.toLowerCase() === 'pending';
                    const firstItem = order.items?.[0];

                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600 font-medium">
                          {order._id.substring(0, 12)}...
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
                              {firstItem?.preferredDeliveryDate
                                ? formatDeliveryDate(firstItem.preferredDeliveryDate)
                                : '—'}
                            </p>
                            <p className="text-gray-600 text-xs">
                              {firstItem?.preferredDeliveryTime || '—'}
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
          {!loading && !error && orders.length > 0 && totalPages > 1 && (
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
