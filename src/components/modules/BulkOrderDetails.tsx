import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CreditCard, User, MapPin, Calendar, Clock, CheckCircle, Circle, RotateCcw, Wallet, CreditCard as CardIcon, Edit2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL ;

const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) return `${IMAGE_BASE_URL}/placeholder-image.png`;
  if (imagePath.startsWith('http')) return imagePath;
  return `${IMAGE_BASE_URL}${imagePath}`;
};

interface BulkOrderItem {
  product: {
    _id: string;
    name: string;
    description: string;
    image: string;
    category: string;
    stock: number;
  };
  variant: {
    _id: string;
    image: string;
    cutType: string;
    weight: number;
    costPrice: number;
    displayPrice: number;
    sellingPrice: number;
    profit: number;
    discount: number;
  };
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
  updatedAt: string;
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
}

export default function BulkOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<BulkOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [refundingType, setRefundingType] = useState<string | null>(null);
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [editingPricing, setEditingPricing] = useState({
    subtotal: 0,
    discount: 0,
    tax: 0,
    shipping: 0,
  });

  // Fetch order details
  useEffect(() => {
    if (!id) return;

    let active = true;
    setLoading(true);
    setError(null);

    apiFetch<{
      success: boolean;
      data: BulkOrder;
      message?: string;
    }>(`/api/bulk-order/order-by-id/${id}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch order');
        setOrder(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to fetch order details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const capitalize = (str: string | undefined | null) => {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Map backend enum to display label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Order Placed',
      'accepted': 'Order Accepted',
      'ready_to_pickup': 'Ready for Pickup',
      'accepted_by_delivery_partner': 'Accepted by Delivery Agent',
      'picked_up': 'Order Pickup',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'returned': 'Returned',
      'refunded': 'Refunded',
      'rejected': 'Rejected'
    };
    return statusMap[status] || status;
  };

  // Get timeline flow - normal delivery progression (without cancelled/returned/refunded)
  const getTimelineFlow = () => {
    return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered'];
  };

  // Get all available statuses for editing (includes cancelled, returned, refunded)
  const getStatusFlow = () => {
    return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'accepted') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border border-red-300';
    if (statusLower === 'delivered') return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
    if (statusLower === 'returned') return 'bg-orange-100 text-orange-700 border border-orange-300';
    if (statusLower === 'refunded') return 'bg-blue-100 text-blue-700 border border-blue-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    if (statusLower === 'completed' || statusLower === 'paid') return 'bg-green-100 text-green-700 border border-green-300';
    if (statusLower === 'failed') return 'bg-red-100 text-red-700 border border-red-300';
    return 'bg-gray-100 text-gray-700 border border-gray-300';
  };

  const handleAcceptOrder = async () => {
    if (!order) return;
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
      if (res.data) setOrder(res.data);
      toast.success(res.message || 'Order accepted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept order');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectOrder = async () => {
    if (!order) return;
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
      if (res.data) setOrder(res.data);
      toast.success(res.message || 'Order rejected successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject order');
    } finally {
      setRejectingId(null);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(newStatus);
    try {
      const res = await apiFetch<{ success: boolean; data?: BulkOrder; message?: string }>(
        '/api/bulk-order/status-update',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, status: newStatus }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to update order status');
      
      // Show success toast immediately
      toast.success(res.message || `Order status updated to ${getStatusLabel(newStatus)}`);
      
      if (res.data) setOrder(res.data);
      
      // Re-fetch complete order data to ensure all fields are present
      if (id) {
        const refreshRes = await apiFetch<{ success: boolean; data: BulkOrder }>(
          `/api/bulk-order/order-by-id/${id}`
        );
        if (refreshRes.success) {
          setOrder(refreshRes.data);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRefund = async (refundType: 'wallet' | 'account') => {
    if (!order) return;
    setRefundingType(refundType);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/bulk-order/process-refund',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, refundType }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to process refund');
      toast.success(res.message || `Refund processed to ${refundType}`);
      // Refresh order data
      const refreshRes = await apiFetch<{ success: boolean; data: BulkOrder }>(
        `/api/bulk-order/order-by-id/${order._id}`
      );
      if (refreshRes.success) setOrder(refreshRes.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process refund');
    } finally {
      setRefundingType(null);
    }
  };

  const startEditingPricing = () => {
    setEditingPricing({
      subtotal: parseFloat(order?.pricing?.grandTotal || '0'),
      discount: parseFloat(order?.pricing?.discount || '0'),
      tax: parseFloat(order?.pricing?.tax || '0'),
      shipping: parseFloat(order?.pricing?.shipping || '0'),
    });
    setIsEditingPricing(true);
  };

  const cancelEditingPricing = () => {
    setIsEditingPricing(false);
  };

  const calculateGrandTotal = (subtotal: number, discount: number, tax: number, shipping: number) => {
    return subtotal - discount + tax + shipping;
  };

  const handlePricingChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingPricing((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const savePricingChanges = async () => {
    if (!order) return;
    try {
      // Here you can add API call to save pricing changes if needed
      // For now, we'll just update the local state
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;
        return {
          ...prevOrder,
          pricing: {
            ...prevOrder.pricing,
            grandTotal: editingPricing.subtotal.toString(),
            discount: editingPricing.discount.toString(),
            tax: editingPricing.tax.toString(),
            shipping: editingPricing.shipping.toString(),
          },
        };
      });
      toast.success('Pricing updated successfully');
      setIsEditingPricing(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update pricing');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/bulk-orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-gray-600">
            Loading order details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate('/bulk-orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-red-600">
            {error || 'Order not found'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = order?.status?.toLowerCase() === 'pending';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/bulk-orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="mb-0">Order {order?._id?.substring(0, 12) || 'N/A'}...</h1>
          <Badge className={getStatusBadgeClass(order?.status || '')}>
            {capitalize(order?.status || '—')}
          </Badge>
        </div>
      </div>

      {/* Order Status and Actions */}
      {isPending && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-orange-800">This order is pending and requires your action.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="border-2 border-green-600 bg-green-600 text-white hover:bg-green-700"
                  onClick={handleAcceptOrder}
                  disabled={acceptingId !== null || rejectingId !== null}
                >
                  {acceptingId ? 'Accepting...' : 'Accept Order'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRejectOrder}
                  disabled={acceptingId !== null || rejectingId !== null}
                >
                  {rejectingId ? 'Rejecting...' : 'Reject Order'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-medium text-blue-600">{order?._id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Type</p>
              <p className="font-medium">{capitalize(order?.orderType || '—')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium">{order?.createdAt ? formatDateTime(order.createdAt) : '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="font-medium">{order.items?.length || 0} item(s)</p>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{order.shippingAddress?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{order.shippingAddress?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="text-sm">{order.shippingAddress?.addressLine1}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Landmark</p>
              <p className="text-sm">{order.shippingAddress?.landmark || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Country</p>
              <p className="text-sm">{order.shippingAddress?.country}</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment & Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pricing & Payment
            </CardTitle>
            {!isEditingPricing && (
              <Button
                size="sm"
                variant="outline"
                onClick={startEditingPricing}
                className="flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!isEditingPricing ? (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    <span className="dirham-symbol mr-2">&#xea;</span>
                    {parseFloat(order.pricing?.grandTotal || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="font-medium">
                    <span className="dirham-symbol mr-2">&#xea;</span>
                    {parseFloat(order.pricing?.tax || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="font-medium">
                    <span className="dirham-symbol mr-2">&#xea;</span>
                    {parseFloat(order.pricing?.discount || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="font-medium">
                    <span className="dirham-symbol mr-2">&#xea;</span>
                    {parseFloat(order.pricing?.shipping || '0').toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="font-semibold text-lg">
                    <span className="dirham-symbol mr-2">&#xea;</span>
                    {parseFloat(order.pricing?.grandTotal || '0').toFixed(2)}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{capitalize(order.payment?.method || '')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge className={getPaymentStatusBadgeClass(order.payment?.status || '')}>
                    {capitalize(order.payment?.status || '')}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  {/* Subtotal Input */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Subtotal</label>
                    <div className="flex items-center gap-2">
                      <span className="dirham-symbol">&#xea;</span>
                      <input
                        type="number"
                        value={editingPricing.subtotal}
                        onChange={(e) => handlePricingChange('subtotal', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Tax Input */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Tax (Added)</label>
                    <div className="flex items-center gap-2">
                      <span className="dirham-symbol">&#xea;</span>
                      <input
                        type="number"
                        value={editingPricing.tax}
                        onChange={(e) => handlePricingChange('tax', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Discount Input */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Discount (Subtracted)</label>
                    <div className="flex items-center gap-2">
                      <span className="dirham-symbol">&#xea;</span>
                      <input
                        type="number"
                        value={editingPricing.discount}
                        onChange={(e) => handlePricingChange('discount', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Shipping Input */}
                  <div>
                    <label className="text-sm text-gray-600 block mb-2">Shipping (Added)</label>
                    <div className="flex items-center gap-2">
                      <span className="dirham-symbol">&#xea;</span>
                      <input
                        type="number"
                        value={editingPricing.shipping}
                        onChange={(e) => handlePricingChange('shipping', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Grand Total Display */}
                  <div className="border-t pt-4 bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Calculated Grand Total</span>
                      <span className="font-bold text-lg text-blue-600">
                        <span className="dirham-symbol mr-2">&#xea;</span>
                        {calculateGrandTotal(
                          editingPricing.subtotal,
                          editingPricing.discount,
                          editingPricing.tax,
                          editingPricing.shipping
                        ).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Formula: Subtotal - Discount + Tax + Shipping
                    </p>
                  </div>

                  {/* Save and Cancel Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700 flex-1"
                      onClick={savePricingChanges}
                    >
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEditingPricing}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Order Status Timeline
          </CardTitle>
          <Button
            size="sm"
            variant={isEditingTimeline ? "destructive" : "outline"}
            onClick={() => setIsEditingTimeline(!isEditingTimeline)}
            className="flex items-center gap-1"
          >
            {isEditingTimeline ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Status
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Selection - Show when editing */}
            {isEditingTimeline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800 mb-3">Select a new status:</p>
                <div className="flex flex-wrap gap-2">
                  {getStatusFlow().map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      onClick={() => {
                        handleStatusUpdate(status);
                        setIsEditingTimeline(false);
                      }}
                      disabled={updatingStatus !== null}
                      className={`${order?.status === status ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      {updatingStatus === status ? 'Updating...' : getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Status Flow */}
            <div className="flex flex-col space-y-3">
              {getTimelineFlow().map((status, index) => {
                const timelineFlow = getTimelineFlow();
                const currentStatusIndex = timelineFlow.indexOf(order?.status || '');
                const isCompleted = currentStatusIndex >= index;
                const isCurrent = status === order?.status;

                return (
                  <div key={status}>
                    <div className="flex items-center gap-3">
                      {isCompleted || isCurrent ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={`font-medium ${isCompleted || isCurrent ? 'text-green-700' : 'text-gray-500'}`}>
                        {getStatusLabel(status)}
                      </span>
                      {isCurrent && <Badge className="bg-blue-100 text-blue-700">Current</Badge>}
                    </div>
                    {index < timelineFlow.length - 1 && (
                      <div className={`ml-3 h-6 w-0.5 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Order Items ({order.items?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={getImageUrl(item.product?.image)}
                      alt={item.product?.name || 'Product'}
                      className="w-full h-full object-cover rounded"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.src.includes('placeholder')) {
                          img.src = getImageUrl(null);
                        }
                      }}
                    />
                  </div>
                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.product?.name}</h3>
                    <p className="text-sm text-gray-600">{item.product?.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline">Weight: {item.weight}g</Badge>
                      <Badge variant="outline">
                        Price: <span className="dirham-symbol mr-2">&#xea;</span>
                        {item.variant?.sellingPrice || '—'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Delivery Preferences */}
                <div className="border-t pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      Preferred Delivery Date
                    </div>
                    <p className="font-medium">
                      {item.preferredDeliveryDate ? formatDate(item.preferredDeliveryDate) : '—'}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Preferred Delivery Time
                    </div>
                    <p className="font-medium">{item.preferredDeliveryTime || '—'}</p>
                  </div>
                </div>

                {/* Notes */}
                {item.notes && (
                  <div className="border-t pt-3">
                    <p className="text-sm text-gray-600">Special Notes</p>
                    <p className="text-sm bg-gray-50 p-2 rounded mt-1">{item.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
    </div>
  );
}
