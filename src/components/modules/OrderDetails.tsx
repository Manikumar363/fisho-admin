import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Package, CreditCard, MapPin, Clock, CheckCircle, Edit2, X, Wallet, CreditCard as CardIcon, RotateCcw, Truck, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface OrderItem {
  snapshot: {
    productName: string;
    variantName: string;
    priceAtPurchase: number;
    unitPriceAtPurchase: number;
    retailPriceAtPurchase: number;
    subtotal: number;
  };
  product: any;
  variant: any;
  quantity: number;
  _id: string;
}

interface Order {
  _id: string;
  invoiceNo: string;
  pricing: {
    grandTotal: string;
    tax: string;
    discount: string;
    shipping: string;
    loyaltyPoints: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    landmark?: string;
  };
  payment: {
    method: string;
    status: string;
  };
  user?: any;
  store?: any;
  items: OrderItem[];
  orderType: string;
  deliveryType?: string;
  deliveryDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deliveryPartner?: {
    _id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    profile_url: string;
  };
  deliveryProof?: string[];
}

// Helper for capitalizing the first letter
const capitalize = (str: string | undefined | null) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Helper for formatting prices to 2 decimal places
const formatPrice = (value: any): string => {
  const num = parseFloat(value);
  if (!Number.isFinite(num)) return '0.00';
  return num.toFixed(2);
};

// Helper for badge color
const getStatusBadgeClass = (status: string | undefined | null) => {
  if (!status || typeof status !== 'string') return 'bg-gray-100 text-gray-700 border-gray-200';
  const statusLower = status.toLowerCase();
  if (statusLower === 'accepted' || statusLower === 'confirmed') return 'bg-green-100 text-green-700 border-green-200';
  if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
  if (statusLower === 'packed') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (statusLower === 'out for delivery' || statusLower === 'shipping') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (statusLower === 'delivered' || statusLower === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statusLower === 'processing') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  if (statusLower === 'returned') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (statusLower === 'refunded') return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

// Helper for delivery type badge color
const getDeliveryTypeBadgeClass = (deliveryType: string) => {
  const typeLower = deliveryType?.toLowerCase() || '';
  if (typeLower === 'express' || typeLower === 'express delivery') {
    return 'bg-purple-100 text-purple-700 border border-purple-300';
  }
  return 'bg-blue-100 text-blue-700 border border-blue-300';
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [refundingType, setRefundingType] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    apiFetch<{ success: boolean; data: Order; message?: string }>(`/api/order/order-by-id/${orderId}`)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch order');
        setOrder(res.data);
      })
      .catch((err) => setError(err?.message || 'Failed to fetch order'))
      .finally(() => setLoading(false));
  }, [orderId]);

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
  const getTimelineFlow = (order?: Order) => {
    // Normal sequential flow for timeline display
    return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered'];
  };

  // Get all available statuses for editing (includes cancelled, returned, refunded)
  const getStatusFlow = (order?: Order) => {
    if (!order) return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
    
    const deliveryType = order.deliveryType?.toLowerCase() || 'express';
    
    if (deliveryType === 'next-day-delivery' || deliveryType === 'nextday' || deliveryType === 'next-day') {
      return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
    } else {
      // Express and default flow
      return ['pending', 'accepted', 'ready_to_pickup', 'accepted_by_delivery_partner', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'];
    }
  };

  // Timeline logic - uses normal flow only
  const buildTimeline = (order?: Order) => {
    if (!order) return [];
    const timelineFlow = getTimelineFlow(order);
    const currentStatusIndex = timelineFlow.indexOf(order?.status || '');
    
    const steps = timelineFlow.map((status, index) => {
      const isCompleted = currentStatusIndex >= index;
      const isCurrent = status === order.status;
      return {
        status: status,
        displayLabel: getStatusLabel(status),
        time: (index === 0 && order.createdAt) ? order.createdAt : '',
        completed: isCompleted && order.status !== 'pending',
        current: isCurrent,
      };
    });
    return steps;
  };

  const handleAcceptOrder = async () => {
    if (!order) return;
    setAccepting(true);
    try {
      const res = await apiFetch<{ success: boolean; data: Order; message?: string }>(
        '/api/order/accept-order',
        {
          method: 'POST',
          body: JSON.stringify({
            orderId: order._id,
            storeId: order.store?._id || order.store?.id,
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to accept order');
      if (res.data) setOrder(res.data);
      
      // Re-fetch to ensure complete data
      if (orderId) {
        const refreshRes = await apiFetch<{ success: boolean; data: Order }>(  
          `/api/order/order-by-id/${orderId}`
        );
        if (refreshRes.success) setOrder(refreshRes.data);
      }
      
      toast.success(res.message || 'Order accepted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept order');
    } finally {
      setAccepting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    setUpdatingStatus(newStatus);
    try {
      const res = await apiFetch<{ success: boolean; data: Order; message?: string }>(
        '/api/order/status-update',
        {
          method: 'POST',
          body: JSON.stringify({ 
            orderId: order._id, 
            storeId: order.store?._id || order.store?.id,
            status: newStatus 
          }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to update order status');
      
      // Show success toast immediately
      toast.success(res.message || `Order status updated to ${getStatusLabel(newStatus)}`);
      
      if (res.data) setOrder(res.data);
      
      // Re-fetch complete order data to ensure all fields are present
      if (orderId) {
        const refreshRes = await apiFetch<{ success: boolean; data: Order }>(
          `/api/order/order-by-id/${orderId}`
        );
        if (refreshRes.success) {
          setOrder(refreshRes.data);
        }
      }
      
      setIsEditingStatus(false);
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
        '/api/order/process-refund',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order._id, refundType }),
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to process refund');
      toast.success(res.message || `Refund processed to ${refundType}`);
      // Refresh order data
      const refreshRes = await apiFetch<{ success: boolean; data: Order }>(
        `/api/order/order-by-id/${order._id}`
      );
      if (refreshRes.success) setOrder(refreshRes.data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process refund');
    } finally {
      setRefundingType(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">Loading order details...</div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center text-red-600">{error || 'Order not found'}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button at the very top, left-aligned */}
      <div>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
      </div>
      {/* Heading and subheading below the button */}
      <div>
        <h1 className="mb-1 text-2xl font-semibold">
          Order Details - {order.invoiceNo || order._id}
        </h1>
        <p className="text-gray-600">Complete information about this order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-semibold items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Name</p>
                  <p className='text-gray-600'>{order.shippingAddress?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Phone</p>
                  <p className='text-gray-600'>{order.shippingAddress?.phone || '—'}</p>
                </div>
                {/* Email is not available in API, so skip */}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-semibold items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-gray-600'>
                {order.shippingAddress?.addressLine1 || ''}
                {order.shippingAddress?.landmark ? `, ${order.shippingAddress.landmark}` : ''}
                {order.shippingAddress?.city ? `, ${order.shippingAddress.city}` : ''}
                {order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}
                {order.shippingAddress?.country ? `, ${order.shippingAddress.country}` : ''}
                {order.shippingAddress?.pincode ? `, ${order.shippingAddress.pincode}` : ''}
              </p>
              <div className="mt-3 flex justify-between gap-4">
                <div className="flex flex-col items-start">
                  <p className="text-md font-semibold text-gray-800">Delivery Type</p>
                  {order.deliveryType ? (
                    <Badge className={`mt-1 ${getDeliveryTypeBadgeClass(order.deliveryType)}`}>
                      {capitalize(order.deliveryType)}
                    </Badge>
                  ) : (
                    <span className="mt-1 text-gray-400">—</span>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-sm font-semibold text-gray-800">Delivery Date</p>
                  <p className="mt-1 text-gray-600">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleString() : '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-semibold items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(order.items || []).map((item) => {
                  // Resolve image URL
                  let imageUrl = item.variant?.image || item.product?.image || '';
                  if (imageUrl && imageUrl.startsWith('/')) {
                    // Replace with your actual base URL or use import.meta.env.VITE_API_BASE_URL if set
                    imageUrl = `${import.meta.env.VITE_IMAGE_BASE_URL || ''}${imageUrl}`;
                  }
                  if (!imageUrl) {
                    imageUrl = 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=80&h=80&fit=crop';
                  }

                  return (
                    <div key={item._id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <ImageWithFallback
                        src={imageUrl}
                        alt={item.snapshot.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4>{item.snapshot.productName}</h4>
                        <p className="text-sm text-gray-600">{item.snapshot.variantName || item.variant?.name || '—'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(item.snapshot.priceAtPurchase)} × {item.quantity}</p>
                        <p><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(item.snapshot.subtotal)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.grandTotal || '0')}</span>
                </div>
                
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.discount || '0')}</span>
                </div>
                <div className="flex justify-between ">
                  <span>Loyalty Points</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.loyaltyPoints || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>+<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.tax || '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>+<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.shipping || '0')}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(order?.pricing?.grandTotal || '0')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Delivery Proofs */}
          {order.deliveryProof && order.deliveryProof.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex font-semibold items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Delivery Proofs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {order.deliveryProof.map((proofPath, index) => {
                    let imageUrl = proofPath;
                    if (imageUrl && imageUrl.startsWith('/')) {
                      imageUrl = `${import.meta.env.VITE_IMAGE_BASE_URL || ''}${imageUrl}`;
                    }
                    return (
                      <div key={index} className="relative group">
                        <ImageWithFallback
                          src={imageUrl}
                          alt={`Delivery proof ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-lg" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Accept Order Button */}
          {order?.status === 'pending' && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white mb-4"
              onClick={handleAcceptOrder}
              disabled={accepting}
            >
              {accepting ? 'Accepting...' : 'Accept Order'}
            </Button>
          )}

          {/* Order Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className='font-semibold'>Order Status</CardTitle>
              <Button
                size="sm"
                variant={isEditingStatus ? "destructive" : "outline"}
                onClick={() => {
                  setIsEditingStatus(!isEditingStatus);
                  setSelectedStatus(null);
                }}
                className="flex items-center gap-1"
              >
                {isEditingStatus ? (
                  <>
                    <X className="w-4 h-4" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <Badge className={`mb-4 px-4 py-2 font-semibold border ${getStatusBadgeClass(order?.status)}`}>
                {capitalize(order?.status || '—')}
              </Badge>

            {/* Status Selection Panel */}
              {isEditingStatus && order && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-3">Select a new status:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(getStatusFlow(order) || []).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        disabled={updatingStatus !== null}
                        className={`${selectedStatus === status ? 'bg-blue-600 text-white' : order.status === status ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {getStatusLabel(status)}
                      </Button>
                    ))}
                  </div>
                  {selectedStatus && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          handleStatusUpdate(selectedStatus);
                          setSelectedStatus(null);
                        }}
                        disabled={updatingStatus !== null}
                      >
                        {updatingStatus ? 'Saving...' : 'Save Status'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedStatus(null);
                          setIsEditingStatus(false);
                        }}
                        disabled={updatingStatus !== null}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-4">
                {(buildTimeline(order) || []).map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                      >
                        {step.completed && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      {index < (getTimelineFlow(order)?.length || 0) - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.completed ? 'bg-green-200' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={step.completed ? '' : 'text-gray-400'}>
                        {step.displayLabel}
                      </p>
                      {step.time && (
                        <p className="text-sm text-gray-500">{step.time ? new Date(step.time).toLocaleString() : ''}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-semibold items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Payment Method</p>
                <p className='text-gray-600'>{order?.payment?.method || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Payment Status</p>
                <Badge
                  className={`px-4 py-2 mt-2 font-semibold border ${
                    order?.payment?.status === 'paid'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : order?.payment?.status === 'pending'
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {capitalize(order?.payment?.status || '—')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Partner Info */}
          {order.deliveryPartner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex font-semibold items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Delivery Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  {order.deliveryPartner.profile_url && (
                    <ImageWithFallback
                      src={`${import.meta.env.VITE_IMAGE_BASE_URL || ''}${order.deliveryPartner.profile_url}`}
                      alt={`${order.deliveryPartner.firstName} ${order.deliveryPartner.lastName}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {order.deliveryPartner.firstName} {order.deliveryPartner.lastName}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Email</p>
                  <p className='text-gray-600'>{order.deliveryPartner.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Phone</p>
                  <p className='text-gray-600'>{order.deliveryPartner.phone || '—'}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refund Options - Show only for returned orders */}
          {order?.status?.toLowerCase() === 'returned' && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <RotateCcw className="w-5 h-5" />
                  Refund Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-orange-800">
                  Order has been returned. Please select a refund option:
                </p>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    onClick={() => handleRefund('wallet')}
                    disabled={refundingType !== null}
                  >
                    <Wallet className="w-4 h-4" />
                    {refundingType === 'wallet' ? 'Processing...' : 'Refund to Wallet'}
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                    onClick={() => handleRefund('account')}
                    disabled={refundingType !== null}
                  >
                    <CardIcon className="w-4 h-4" />
                    {refundingType === 'account' ? 'Processing...' : 'Refund to Account'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex font-semibold items-center">
                <Clock className="w-5 h-5 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Order ID</p>
                <p className='text-gray-600'>{order._id}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Order Date</p>
                <p className='text-gray-600'>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
