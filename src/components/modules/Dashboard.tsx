
import React, { useState, useEffect } from 'react';
import InventoryAlertsSubadmin from './inventory/InventoryAlertsSubadmin';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Receipt,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { toast } from 'react-toastify';
import { getAdminData, getUserRole, apiFetch } from '../../lib/api';



  // Capitalize and prettify status (replace underscores with spaces, capitalize each word)
  const capitalize = (str?: string) => {
    if (!str) return '-';
    return str
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  // Active Orders state (must be inside component)
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  // Delivery Partners state
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  // Fetch active orders
  useEffect(() => {
    const fetchActiveOrders = async () => {
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const res = await apiFetch('/api/order/order-history?status=ongoing');
        if (!res.success) throw new Error(res.message || 'Failed to fetch active orders');
        setActiveOrders(res.data || []);
      } catch (err: any) {
        setOrdersError(err?.message || 'Failed to fetch active orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchActiveOrders();
  }, []);
  const [userRole, setUserRole] = useState<string>('admin');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>({
    activeUsers: 0,
    totalOrders: 0,
    inventoryAlerts: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    expressOrders: 0,
    nextDayOrders: 0,
    todaysRevenue:0,
    bulkOrders: 0
  });

  useEffect(() => {
    const role = getUserRole();
    if (role) {
      setUserRole(role);
    }
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setStatsLoading(true);
      try {
        const response = await apiFetch('/api/admin/dashboard-stats');
        if (response.success && response.data) {
          setDashboardStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Keep static values on error
      } finally {
        setStatsLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    // Accept welcome flag either from navigation state or a session flag set at login
    const fromLoginState = (location.state as any)?.showWelcome;
    const fromLoginSession = sessionStorage.getItem('showWelcome') === '1';
    const fromLoginLocal = localStorage.getItem('showWelcome') === '1';
    const fromLogin = fromLoginState || fromLoginSession || fromLoginLocal;
    const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
    if (!fromLogin || !isDashboard) return;

    const adminName = getAdminData()?.name || 'Admin';
    toast.success(`Welcome ${adminName}! Login successful.`);

    // Clear the flags so it doesn't show again on other routes
    sessionStorage.removeItem('showWelcome');
    localStorage.removeItem('showWelcome');

    // Clear state so the toast only shows once and doesn't leak to other routes
    setTimeout(() => {
      navigate(location.pathname, { replace: true, state: {} });
    }, 0);
  }, [location.state, location.pathname, navigate]);

  const handleAssignDeliveryPartner = async (order: any) => {
    setSelectedOrder(order);
    setSelectedDeliveryPartner('');
    setPartnersLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; deliveryPartners: any[] }>(
        '/api/delivery-partner/available-delivery-partners'
      );
      if (res.success && res.deliveryPartners) {
        setDeliveryPartners(res.deliveryPartners);
      } else {
        toast.error('Failed to fetch delivery partners');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to fetch delivery partners');
    } finally {
      setPartnersLoading(false);
      setIsDialogOpen(true);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDeliveryPartner) {
      toast.error('Please select a delivery partner');
      return;
    }
    setIsAssigning(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/order/assign-delivery-partner',
        {
          method: 'POST',
          body: JSON.stringify({
            deliveryPartnerId: selectedDeliveryPartner,
            orderId: selectedOrder._id
          }),
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to assign delivery partner');
      
      const partnerName = deliveryPartners.find(p => p._id === selectedDeliveryPartner);
      toast.success(
        `Delivery partner "${partnerName?.firstName} ${partnerName?.lastName}" assigned successfully`
      );
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setSelectedDeliveryPartner('');
      
      // Refresh active orders
      const ordersRes = await apiFetch('/api/order/order-history?status=ongoing');
      if (ordersRes.success) {
        setActiveOrders(ordersRes.data || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to assign delivery partner');
    } finally {
      setIsAssigning(false);
    }
  };

  const kpiData = [
    { label: 'Active Users', value: (dashboardStats?.activeUsers ?? 0).toLocaleString(), icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-100', onClick: () => navigate('/user-management?filter=end-users'), roles: ['admin'] },
    { label: 'Total Orders', value: (dashboardStats?.totalOrders ?? 0).toLocaleString(), icon: ShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-100', onClick: () => navigate('/orders'), roles: ['admin', 'subadmin'] },
    { label: 'Transactions', value: (dashboardStats?.totalTransactions ?? 0).toLocaleString(), icon: CreditCard, color: 'text-pink-600', bgColor: 'bg-pink-100', onClick: () => navigate('/transactions'), roles: ['admin', 'subadmin'] },
    { label: 'Total Revenue', value: { symbol: true, amount: Number(dashboardStats?.totalRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }, icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-100', onClick: () => navigate('/transactions?filter=revenue'), roles: ['admin', 'subadmin'] },
    { label: 'Inventory Alerts', value: (dashboardStats?.inventoryAlerts ?? 0).toString(), icon: AlertTriangle, color: 'text-amber-600', bgColor: 'bg-amber-100', onClick: () => navigate(userRole === 'subadmin' ? '/inventory-alerts' : '/inventory-management?tab=inventoryAlerts'), roles: ['admin', 'subadmin'] },
    { label: 'Express Orders', value: (dashboardStats?.expressOrders ?? 0).toLocaleString(), icon: Zap, color: 'text-orange-600', bgColor: 'bg-orange-100', onClick: () => navigate('/orders?type=express'), roles: ['admin', 'subadmin'] },
    { label: 'Next-Day Orders', value: (dashboardStats?.nextDayOrders ?? 0).toLocaleString(), icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100', onClick: () => navigate('/orders?type=next-day'), roles: ['admin', 'subadmin'] },
    { label: 'Bulk Orders', value: (dashboardStats?.bulkOrders ?? 0).toLocaleString(), icon: PackageIcon, color: 'text-purple-600', bgColor: 'bg-purple-100', onClick: () => navigate('/orders?type=bulk'), roles: ['admin', 'subadmin'] },
    { label: 'Waste Management', value: '3.2%', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100', onClick: () => navigate('/waste-management'), roles: ['admin', 'subadmin'] },
    { label: "Today's Revenue", value: { symbol: true, amount: Number(dashboardStats?.todaysRevenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }, icon: Receipt, color: 'text-teal-600', bgColor: 'bg-teal-100', onClick: () => navigate('/transactions'), roles: ['admin', 'subadmin'] }
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
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/offers', { state: { mode: 'add' } })}
            >
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
            className={kpi.onClick !== undefined ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
            onClick={kpi.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-600 text-sm mb-2">{kpi.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-24" />
                  ) : kpi.value && kpi.value.symbol ? (
                    <p className="mb-1">
                      <span className="dirham-symbol mr-2">&#xea;</span>
                      {kpi.value.amount}
                    </p>
                  ) : (
                    <p className="mb-1">{kpi.value}</p>
                  )}
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
            {ordersLoading ? (
              <div className="p-4 text-center text-gray-600">Loading orders...</div>
            ) : ordersError ? (
              <div className="p-4 text-center text-red-600">{ordersError}</div>
            ) : (
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
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order: any) => {
                    // Map delivery type for color
                    let typeColor = 'bg-purple-100 text-purple-700 border border-purple-300';
                    if (order.deliveryType?.toLowerCase() === 'express') typeColor = 'bg-purple-100 text-purple-700 border border-purple-300';
                    else if (order.deliveryType?.toLowerCase() === 'next-day' || order.deliveryType?.toLowerCase() === 'nextday') typeColor = 'bg-blue-100 text-blue-700 border border-blue-300';

                    // Map status for color (distinct for each status)
                    let statusColor = 'bg-gray-100 text-gray-700 border border-gray-300';
                    switch ((order.status || '').toLowerCase()) {
                      case 'pending':
                        statusColor = 'bg-orange-100 text-orange-700 border border-orange-300';
                        break;
                      case 'accepted':
                      case 'accept':
                        statusColor = 'bg-green-100 text-green-700 border border-green-300';
                        break;
                      case 'accepted_by_delivery_partner':
                        statusColor = 'bg-blue-100 text-blue-700 border border-blue-300';
                        break;
                      case 'ready_to_pickup':
                        statusColor = 'bg-yellow-100 text-yellow-800 border border-yellow-300';
                        break;
                      case 'order placed':
                        statusColor = 'bg-cyan-100 text-cyan-700 border border-cyan-300';
                        break;
                      case 'out for delivery':
                        statusColor = 'bg-purple-100 text-purple-700 border border-purple-300';
                        break;
                      case 'delivered':
                        statusColor = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
                        break;
                      case 'rejected':
                        statusColor = 'bg-red-100 text-red-700 border border-red-300';
                        break;
                      case 'cancelled':
                        statusColor = 'bg-red-100 text-red-700 border border-red-300';
                        break;
                      default:
                        statusColor = 'bg-gray-100 text-gray-700 border border-gray-300';
                    }

                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{order.invoiceNo || order._id}</td>
                        <td className="py-3 px-4">{order.shippingAddress?.name || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${typeColor}`}>
                            {order.deliveryType || order.orderType || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="dirham-symbol mr-2">&#xea;</span>
                          {order.pricing?.grandTotal || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                            {capitalize(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.deliveryPartner 
                            ? `${order.deliveryPartner.firstName} ${order.deliveryPartner.lastName}` 
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-4">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                        <td className="py-3 px-4">
                          {[ 'accepted', 'ready_to_pickup'].includes((order.status || '').toLowerCase()) && (
                            <Button size="sm" variant="outline" onClick={() => handleAssignDeliveryPartner(order)} title="Assign Delivery Partner">
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Partner Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold text-gray-900">{selectedOrder.invoiceNo || selectedOrder._id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Delivery Partner
                </label>
                {partnersLoading ? (
                  <div className="p-4 text-center text-gray-600 text-sm">
                    Loading delivery partners...
                  </div>
                ) : (
                  <Select value={selectedDeliveryPartner} onValueChange={setSelectedDeliveryPartner} disabled={isAssigning}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a delivery partner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryPartners.map((partner) => (
                        <SelectItem key={partner._id} value={partner._id}>
                          {partner.firstName} {partner.lastName} ({partner.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                  disabled={isAssigning}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAssignment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isAssigning || partnersLoading}
                >
                  {isAssigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}