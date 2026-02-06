import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Package, CreditCard, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner'; // or your preferred toast lib

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
}

// Helper for capitalizing the first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

// Helper for badge color
const getStatusBadgeClass = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'accepted' || statusLower === 'confirmed') return 'bg-green-100 text-green-700 border-green-200';
  if (statusLower === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (statusLower === 'rejected' || statusLower === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
  if (statusLower === 'packed') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (statusLower === 'out for delivery' || statusLower === 'shipping') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (statusLower === 'delivered' || statusLower === 'completed') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (statusLower === 'processing') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Timeline logic (example, you may want to adjust based on status)
  const buildTimeline = (order: Order) => {
    const steps = [
      { status: 'Order Placed', time: order.createdAt, completed: true },
      { status: 'Order Confirmed', time: '', completed: ['confirmed', 'packed', 'out for delivery', 'delivered', 'accepted'].includes(order.status.toLowerCase()) },
      { status: 'Packed', time: '', completed: ['packed', 'out for delivery', 'delivered'].includes(order.status.toLowerCase()) },
      { status: 'Out for Delivery', time: '', completed: ['out for delivery', 'delivered'].includes(order.status.toLowerCase()) },
      { status: 'Delivered', time: '', completed: order.status.toLowerCase() === 'delivered' }
    ];
    return steps;
  };

  const [accepting, setAccepting] = useState(false);

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
      setOrder(res.data);
      toast.success(res.message || 'Order accepted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to accept order');
    } finally {
      setAccepting(false);
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
                  <p className="text-sm font-semibold text-gray-800">Delivery Type</p>
                  <Badge variant="outline" className="mt-1 text-gray-700">
                    {order.deliveryType || '—'}
                  </Badge>
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
                {order.items.map((item) => {
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
                        <p><span className="dirham-symbol mr-2">&#xea;</span>{item.snapshot.priceAtPurchase} × {item.quantity}</p>
                        <p><span className="dirham-symbol mr-2">&#xea;</span>{item.snapshot.subtotal}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span><span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.grandTotal || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span><span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.shipping || '0'}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.discount || '0'}</span>
                </div>
                <div className="flex justify-between ">
                  <span>Loyalty Points</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.loyaltyPoints || '0'}</span>
                </div>
                <div className="flex justify-between ">
                  <span>Tax</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.tax || '0'}</span>
                </div>
                <div className="flex justify-between ">
                  <span>Shipping</span>
                  <span>-<span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.shipping || '0'}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span><span className="dirham-symbol mr-2">&#xea;</span>{order.pricing?.grandTotal || '0'}</span>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Accept Order Button */}
          {order.status === 'pending' && (
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
            <CardHeader>
              <CardTitle className='font-semibold'>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`mb-4 px-4 py-2 font-semibold border ${getStatusBadgeClass(order.status)}`}>
                {capitalize(order.status || '—')}
              </Badge>
              <div className="space-y-4">
                {buildTimeline(order).map((step, index) => (
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
                      {index < 4 && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.completed ? 'bg-green-200' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={step.completed ? '' : 'text-gray-400'}>
                        {step.status}
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
                <p className='text-gray-600'>{order.payment?.method || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Payment Status</p>
                <Badge
                  className={`px-4 py-2 mt-2 font-semibold border ${
                    order.payment?.status === 'paid'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : order.payment?.status === 'pending'
                      ? 'bg-orange-100 text-orange-700 border-orange-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {capitalize(order.payment?.status || '—')}
                </Badge>
              </div>
            </CardContent>
          </Card>

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
    </div>
  );
}
