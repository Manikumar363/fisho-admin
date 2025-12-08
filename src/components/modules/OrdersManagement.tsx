import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, Eye, Download, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export default function OrdersManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedType(typeParam);
    }
  }, [searchParams]);

  const allOrders = [
    { id: 'ORD-1234', customer: 'John Doe', type: 'Express', items: 5, amount: '₹1,250', status: 'Delivered', date: '2025-11-28', time: '10:30 AM' },
    { id: 'ORD-1235', customer: 'Jane Smith', type: 'Next-Day', items: 8, amount: '₹2,100', status: 'Processing', date: '2025-11-28', time: '09:15 AM' },
    { id: 'ORD-1236', customer: 'Mike Johnson', type: 'Bulk', items: 25, amount: '₹5,500', status: 'Pending', date: '2025-11-28', time: '08:45 AM' },
    { id: 'ORD-1237', customer: 'Sarah Wilson', type: 'Express', items: 3, amount: '₹875', status: 'Out for Delivery', date: '2025-11-27', time: '04:20 PM' },
    { id: 'ORD-1238', customer: 'Tom Brown', type: 'Next-Day', items: 6, amount: '₹1,650', status: 'Processing', date: '2025-11-27', time: '03:00 PM' },
    { id: 'ORD-1239', customer: 'Emily Davis', type: 'Express', items: 4, amount: '₹950', status: 'Delivered', date: '2025-11-27', time: '02:30 PM' },
    { id: 'ORD-1240', customer: 'Robert Garcia', type: 'Bulk', items: 30, amount: '₹7,800', status: 'Confirmed', date: '2025-11-26', time: '11:00 AM' },
    { id: 'ORD-1241', customer: 'Lisa Martinez', type: 'Next-Day', items: 7, amount: '₹1,890', status: 'Delivered', date: '2025-11-26', time: '10:15 AM' },
    { id: 'ORD-1242', customer: 'David Lee', type: 'Express', items: 2, amount: '₹650', status: 'Cancelled', date: '2025-11-26', time: '09:45 AM' },
    { id: 'ORD-1243', customer: 'Maria Rodriguez', type: 'Bulk', items: 20, amount: '₹4,200', status: 'Processing', date: '2025-11-25', time: '05:30 PM' },
    { id: 'ORD-1244', customer: 'James Anderson', type: 'Next-Day', items: 5, amount: '₹1,450', status: 'Delivered', date: '2025-11-25', time: '04:00 PM' },
    { id: 'ORD-1245', customer: 'Patricia Taylor', type: 'Express', items: 6, amount: '₹1,320', status: 'Out for Delivery', date: '2025-11-25', time: '03:15 PM' }
  ];

  const filteredOrders = selectedType === 'all' 
    ? allOrders 
    : allOrders.filter(order => order.type.toLowerCase() === selectedType.replace('-', ' '));

  const stats = {
    total: allOrders.length,
    express: allOrders.filter(o => o.type === 'Express').length,
    nextDay: allOrders.filter(o => o.type === 'Next-Day').length,
    bulk: allOrders.filter(o => o.type === 'Bulk').length
  };

  const handleFilterSelect = (type: string) => {
    setSelectedType(type);
    setShowFilterMenu(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Orders Management</h1>
          <p className="text-gray-600">Track and manage all orders</p>
        </div>
        <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 text-sm mb-1">Total Orders</p>
            <p>{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 text-sm mb-1">Express Orders</p>
            <p>{stats.express}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 text-sm mb-1">Next-Day Orders</p>
            <p>{stats.nextDay}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600 text-sm mb-1">Bulk Orders</p>
            <p>{stats.bulk}</p>
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
                placeholder="Search by order ID, customer name, or phone..."
                className="pl-10"
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
                      <span className="font-semibold">Filter by Order Type</span>
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
                      All Orders ({stats.total})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('express')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'express' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Express Orders ({stats.express})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('next-day')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'next-day' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Next-Day Orders ({stats.nextDay})
                    </button>
                    <button
                      onClick={() => handleFilterSelect('bulk')}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 ${
                        selectedType === 'bulk' ? 'bg-blue-50 text-blue-600' : ''
                      }`}
                    >
                      Bulk Orders ({stats.bulk})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedType !== 'all' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filter:</span>
              <Badge variant="default" className="bg-blue-600">
                {selectedType === 'express' ? 'Express Orders' : 
                 selectedType === 'next-day' ? 'Next-Day Orders' : 
                 'Bulk Orders'}
                <button 
                  onClick={() => handleFilterSelect('all')}
                  className="ml-2 hover:text-gray-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedType === 'all' ? 'All Orders' : 
             selectedType === 'express' ? 'Express Orders' : 
             selectedType === 'next-day' ? 'Next-Day Orders' : 
             'Bulk Orders'} 
            ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-blue-600">{order.id}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        order.type === 'Express' ? 'bg-orange-100 text-orange-700' :
                        order.type === 'Next-Day' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.items}</td>
                    <td className="py-3 px-4">{order.amount}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          order.status === 'Delivered' ? 'default' :
                          order.status === 'Cancelled' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div>{order.date}</div>
                        <div className="text-sm text-gray-500">{order.time}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}