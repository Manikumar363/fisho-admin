import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Package, CreditCard, MapPin, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../ui/ImageWithFallback';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const orderData = {
    id: orderId,
    user: {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      phone: '+91 98765 43210'
    },
    deliveryType: 'Express',
    deliverySlot: 'Today, 6:00 PM - 8:00 PM',
    orderDate: '2025-11-29 10:30 AM',
    status: 'In Transit',
    paymentMethod: 'UPI',
    transactionId: 'TXN-987654321',
    address: '123, MG Road, Koramangala, Bangalore - 560034',
    items: [
      {
        id: 1,
        name: 'Tiger Prawns',
        variant: 'Whole Cleaned - 500g',
        quantity: 2,
        price: 380,
        total: 760
      },
      {
        id: 2,
        name: 'Salmon Fillet',
        variant: 'Fillet - 250g',
        quantity: 1,
        price: 590,
        total: 590
      }
    ],
    subtotal: 1350,
    deliveryCharges: 50,
    discount: 150,
    total: 1250,
    timeline: [
      { status: 'Order Placed', time: '2025-11-29 10:30 AM', completed: true },
      { status: 'Order Confirmed', time: '2025-11-29 10:45 AM', completed: true },
      { status: 'Packed', time: '2025-11-29 12:00 PM', completed: true },
      { status: 'Out for Delivery', time: '2025-11-29 5:30 PM', completed: true },
      { status: 'Delivered', time: '', completed: false }
    ],
    notes: 'Please deliver before 7 PM',
    rating: null,
    feedback: null
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Button>
        <div>
          <h1 className="mb-1">Order Details - {orderId}</h1>
          <p className="text-gray-600">Complete information about this order</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p>{orderData.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p>{orderData.user.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Email</p>
                  <p>{orderData.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{orderData.address}</p>
              <div className="mt-3 flex gap-4">
                <div>
                  <p className="text-sm text-gray-600">Delivery Type</p>
                  <Badge variant="outline" className="mt-1">
                    {orderData.deliveryType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time Slot</p>
                  <p className="mt-1">{orderData.deliverySlot}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=80&h=80&fit=crop"
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4>{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.variant}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p>₹{item.price} × {item.quantity}</p>
                      <p>₹{item.total}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{orderData.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges</span>
                  <span>₹{orderData.deliveryCharges}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{orderData.discount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span>Total Amount</span>
                  <span>₹{orderData.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {orderData.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{orderData.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="mb-4">{orderData.status}</Badge>
              <div className="space-y-4">
                {orderData.timeline.map((step, index) => (
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
                      {index < orderData.timeline.length - 1 && (
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
                        <p className="text-sm text-gray-500">{step.time}</p>
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
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Payment Method</p>
                <p>{orderData.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="text-blue-600">{orderData.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <Badge variant="default">Paid</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p>{orderData.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p>{orderData.orderDate}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
