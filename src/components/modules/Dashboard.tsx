import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Zap,
  Calendar,
  Package as PackageIcon,
  DollarSign,
  Users,
  Store,
  AlertTriangle,
  CreditCard,
  Plus,
  Receipt
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { getUserRole } from '../../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('admin');

  useEffect(() => {
    const role = getUserRole();
    if (role) {
      setUserRole(role);
    }
  }, []);

  const kpiData = [
    { label: 'Active Users', value: '15,234', change: '+22.1%', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100', onClick: () => navigate('/user-management?filter=end-users'), roles: ['admin', 'subadmin'] },
    { label: 'Total Orders', value: '2,543', change: '+12.5%', icon: ShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-100', onClick: () => navigate('/orders'), roles: ['admin', 'subadmin'] },
    { label: 'Transactions', value: '3,245', change: '+16.7%', icon: CreditCard, color: 'text-pink-600', bgColor: 'bg-pink-100', roles: ['admin', 'subadmin'] },
    { label: 'Total Revenue', value: '₹8.2L', change: '+18.4%', icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100', roles: ['admin', 'subadmin'] },
    { label: 'Inventory Alerts', value: '12', change: '-3', icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100', onClick: () => navigate('/inventory-management?filter=low-stock'), roles: ['admin'] },
    { label: 'Express Orders', value: '856', change: '+8.3%', icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-100', onClick: () => navigate('/orders?type=express'), roles: ['admin', 'subadmin'] },
    { label: 'Next-Day Orders', value: '1,423', change: '+15.2%', icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100', onClick: () => navigate('/orders?type=next-day'), roles: ['admin', 'subadmin'] },
    { label: 'Bulk Orders', value: '264', change: '+5.7%', icon: PackageIcon, color: 'text-purple-600', bgColor: 'bg-purple-100', onClick: () => navigate('/orders?type=bulk'), roles: ['admin', 'subadmin'] },
    { label: 'Waste Management', value: '3.2%', change: '-0.8%', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100', onClick: () => navigate('/waste-management'), roles: ['admin', 'subadmin'] },
    { label: "Today's Revenue", value: '₹1.8L', change: '+11.3%', icon: Receipt, color: 'text-teal-600', bgColor: 'bg-teal-100', onClick: () => navigate('/transactions'), roles: ['admin', 'subadmin'] }
  ];

  // Filter KPI data based on user role
  const filteredKpiData = kpiData.filter(
    (kpi) => !kpi.roles || kpi.roles.includes(userRole)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome to Fisho {userRole === 'subadmin' ? 'Sub Admin' : 'Admin'} Panel
          </p>
        </div>
        <div className="flex gap-3">
          {userRole === 'admin' && (
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />
              Add Offer
            </Button>
          )}
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/store-billing')}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Create Store Bill
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {filteredKpiData.map((kpi, index) => (
          <Card 
            key={index} 
            className={kpi.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={kpi.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-2">{kpi.label}</p>
                  <p className="mb-1">{kpi.value}</p>
                  <p className={`text-sm ${kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {kpi.change}
                  </p>
                </div>
                <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Delivery Partner</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'ORD-1234', customer: 'John Doe', type: 'Express', amount: '₹1,250', status: 'Out for Delivery', deliveryPartner: 'Mohammed Ali', date: '2025-11-28' },
                  { id: 'ORD-1235', customer: 'Jane Smith', type: 'Next-Day', amount: '₹2,100', status: 'Accepted by Delivery Agent', deliveryPartner: 'Suresh Babu', date: '2025-11-28' },
                  { id: 'ORD-1236', customer: 'Mike Johnson', type: 'Bulk', amount: '₹5,500', status: 'Order Placed', deliveryPartner: '-', date: '2025-11-28' },
                  { id: 'ORD-1237', customer: 'Sarah Wilson', type: 'Express', amount: '₹875', status: 'Order Collected', deliveryPartner: 'Mohammed Ali', date: '2025-11-27' },
                  { id: 'ORD-1238', customer: 'Tom Brown', type: 'Next-Day', amount: '₹1,650', status: 'Accepted by Delivery Agent', deliveryPartner: 'Ramesh Kumar', date: '2025-11-27' }
                ].map((order) => (
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
                    <td className="py-3 px-4">{order.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'Accepted by Delivery Agent' ? 'bg-green-100 text-green-700' :
                        order.status === 'Order Placed' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'Order Collected' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{order.deliveryPartner}</td>
                    <td className="py-3 px-4">{order.date}</td>
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