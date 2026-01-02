import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Download, Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

export default function UserManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('end-users');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddEndUserModal, setShowAddEndUserModal] = useState(false);
  const [showAddDeliveryPartnerModal, setShowAddDeliveryPartnerModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [vendorForm, setVendorForm] = useState({
    vendorName: '',
    companyName: '',
    vatNumber: '',
    email: '',
    contactNumber: ''
  });
  const [endUserForm, setEndUserForm] = useState({
    name: '',
    email: '',
    contactNumber: ''
  });
  const [deliveryPartnerForm, setDeliveryPartnerForm] = useState({
    name: '',
    mobileNumber: '',
    drivingLicense: null as File | null,
    workPermit: null as File | null,
    email: ''
  });

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'end-users') {
      setActiveTab('end-users');
    }
  }, [searchParams]);


  // End Users API integration
  const [endUsers, setEndUsers] = useState<any[]>([]);
  const [endUsersLoading, setEndUsersLoading] = useState(false);
  const [endUsersError, setEndUsersError] = useState<string | null>(null);
  const [endUsersPage, setEndUsersPage] = useState(1);
  const [endUsersTotalPages, setEndUsersTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab !== 'end-users') return;
    setEndUsersLoading(true);
    setEndUsersError(null);
    apiFetch<{ success: boolean; users: any[]; pagination?: any; message?: string }>(`/api/user/all-users?page=${endUsersPage}&limit=15`)
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch users');
        setEndUsers(res.users || []);
        setEndUsersTotalPages(res.pagination?.totalPages || 1);
      })
      .catch(e => {
        setEndUsersError(e?.message || 'Failed to load users');
      })
      .finally(() => setEndUsersLoading(false));
  }, [activeTab, endUsersPage]);

  const deliveryPartners = [
    { id: 'DP-001', name: 'Mohammed Ali', email: 'ali@fisho.com', phone: '+91 98765 11111', deliveries: 342, earnings: '₹68,400', rating: 4.8, status: 'Active' },
    { id: 'DP-002', name: 'Suresh Babu', email: 'suresh@fisho.com', phone: '+91 98765 11112', deliveries: 298, earnings: '₹59,600', rating: 4.7, status: 'Active' },
    { id: 'DP-003', name: 'Ramesh Kumar', email: 'ramesh@fisho.com', phone: '+91 98765 11113', deliveries: 456, earnings: '₹91,200', rating: 4.9, status: 'Active' },
    { id: 'DP-004', name: 'Vikram Singh', email: 'vikram@fisho.com', phone: '+91 98765 11114', deliveries: 189, earnings: '₹37,800', rating: 4.6, status: 'Inactive' }
  ];

  const storeManagers = [
    { id: 'SM-001', name: 'Rajesh Kumar', email: 'rajesh.marine@fisho.com', phone: '+91 98765 22221', store: 'Fisho Marine Drive', experience: '5 years', status: 'Active' },
    { id: 'SM-002', name: 'Priya Sharma', email: 'priya.bandra@fisho.com', phone: '+91 98765 22222', store: 'Fisho Bandra West', experience: '3 years', status: 'Active' },
    { id: 'SM-003', name: 'Mohammed Syed', email: 'mohammed.andheri@fisho.com', phone: '+91 98765 22223', store: 'Fisho Andheri', experience: '7 years', status: 'Active' },
    { id: 'SM-004', name: 'Anjali Desai', email: 'anjali.juhu@fisho.com', phone: '+91 98765 22224', store: 'Fisho Juhu', experience: '4 years', status: 'Active' }
  ];

  const vendors = [
    { id: 'VN-001', vendorName: 'Coastal Fisheries Ltd', companyName: 'Coastal Fisheries Private Limited', vatNumber: 'VAT123456789', email: 'info@coastalfisheries.com', phone: '+91 98765 33331', status: 'Active' },
    { id: 'VN-002', vendorName: 'Marine Supplies Co', companyName: 'Marine Supplies Company', vatNumber: 'VAT987654321', email: 'contact@marinesupplies.com', phone: '+91 98765 33332', status: 'Active' },
    { id: 'VN-003', vendorName: 'Ocean Fresh Traders', companyName: 'Ocean Fresh Traders LLP', vatNumber: 'VAT456789123', email: 'sales@oceanfresh.com', phone: '+91 98765 33333', status: 'Active' }
  ];

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding vendor:', vendorForm);
    setShowAddVendorModal(false);
    setVendorForm({
      vendorName: '',
      companyName: '',
      vatNumber: '',
      email: '',
      contactNumber: ''
    });
  };

  const handleAddEndUser = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding end user:', endUserForm);
    setShowAddEndUserModal(false);
    setEndUserForm({
      name: '',
      email: '',
      contactNumber: ''
    });
  };

  const handleAddDeliveryPartner = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding delivery partner:', deliveryPartnerForm);
    setShowAddDeliveryPartnerModal(false);
    setDeliveryPartnerForm({
      name: '',
      mobileNumber: '',
      drivingLicense: null,
      workPermit: null,
      email: ''
    });
  };

  const handleView = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setShowViewModal(true);
  };

  const handleDelete = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    console.log('Deleting:', selectedItem);
    setShowDeleteDialog(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">User Management</h1>
          <p className="text-gray-600">Manage all users, delivery partners, and store managers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm whitespace-nowrap">From:</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm whitespace-nowrap">To:</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, phone, email, or user ID..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b">
          <TabsTrigger value="end-users">End Users</TabsTrigger>
          <TabsTrigger value="delivery-partners">Delivery Partners</TabsTrigger>
          <TabsTrigger value="store-managers">Store Managers</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="end-users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>End Users</CardTitle>
              <Button 
                onClick={() => setShowAddEndUserModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add End User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">User ID</th>
                      <th className="text-left py-3 px-4">User Name</th>
                      <th className="text-left py-3 px-4">Phone Number</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Revenue</th>
                      <th className="text-left py-3 px-4">Total Orders</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endUsersLoading ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">Loading users...</td></tr>
                    ) : endUsersError ? (
                      <tr><td colSpan={8} className="py-8 text-center text-red-600">{endUsersError}</td></tr>
                    ) : endUsers.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">No users found</td></tr>
                    ) : (
                      endUsers.map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-blue-600">{user._id}</td>
                          <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                          <td className="py-3 px-4">{user.countryCode} {user.phone}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">—</td>
                          <td className="py-3 px-4">—</td>
                          <td className="py-3 px-4">
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleView(user, 'end-user')}
                                title="View"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleDelete(user, 'end-user')}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery-partners">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Delivery Partners</CardTitle>
              <Button 
                onClick={() => setShowAddDeliveryPartnerModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Delivery Partner
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">DP ID</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Phone Number</th>
                      <th className="text-left py-3 px-4">Email ID</th>
                      <th className="text-left py-3 px-4">Total Deliveries</th>
                      <th className="text-left py-3 px-4">Earnings</th>
                      <th className="text-left py-3 px-4">Rating</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryPartners.map((partner) => (
                      <tr key={partner.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{partner.id}</td>
                        <td className="py-3 px-4">{partner.name}</td>
                        <td className="py-3 px-4">{partner.phone}</td>
                        <td className="py-3 px-4">{partner.email}</td>
                        <td className="py-3 px-4">{partner.deliveries}</td>
                        <td className="py-3 px-4">{partner.earnings}</td>
                        <td className="py-3 px-4">⭐ {partner.rating}</td>
                        <td className="py-3 px-4">
                          <Badge variant={partner.status === 'Active' ? 'default' : 'secondary'}>
                            {partner.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleView(partner, 'delivery-partner')}
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleDelete(partner, 'delivery-partner')}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store-managers">
          <Card>
            <CardHeader>
              <CardTitle>Store Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Manager ID</th>
                      <th className="text-left py-3 px-4">Name</th>
                      <th className="text-left py-3 px-4">Phone</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Store</th>
                      <th className="text-left py-3 px-4">Experience</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeManagers.map((manager) => (
                      <tr key={manager.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{manager.id}</td>
                        <td className="py-3 px-4">{manager.name}</td>
                        <td className="py-3 px-4">{manager.phone}</td>
                        <td className="py-3 px-4">{manager.email}</td>
                        <td className="py-3 px-4">{manager.store}</td>
                        <td className="py-3 px-4">{manager.experience}</td>
                        <td className="py-3 px-4">
                          <Badge variant={manager.status === 'Active' ? 'default' : 'secondary'}>
                            {manager.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleView(manager, 'store-manager')}
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Vendors</CardTitle>
              <Button 
                onClick={() => setShowAddVendorModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Vendor ID</th>
                      <th className="text-left py-3 px-4">Vendor Name</th>
                      <th className="text-left py-3 px-4">Company Name</th>
                      <th className="text-left py-3 px-4">VAT Number</th>
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Contact Number</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr key={vendor.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-blue-600">{vendor.id}</td>
                        <td className="py-3 px-4">{vendor.vendorName}</td>
                        <td className="py-3 px-4">{vendor.companyName}</td>
                        <td className="py-3 px-4">{vendor.vatNumber}</td>
                        <td className="py-3 px-4">{vendor.email}</td>
                        <td className="py-3 px-4">{vendor.phone}</td>
                        <td className="py-3 px-4">
                          <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                            {vendor.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleView(vendor, 'vendor')}
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vendor Modal */}
      <Dialog open={showAddVendorModal} onOpenChange={setShowAddVendorModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name</Label>
                <Input
                  id="vendorName"
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={vendorForm.companyName}
                  onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input
                  id="vatNumber"
                  value={vendorForm.vatNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, vatNumber: e.target.value })}
                  placeholder="Enter VAT number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={vendorForm.contactNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddVendorModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add End User Modal */}
      <Dialog open={showAddEndUserModal} onOpenChange={setShowAddEndUserModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New End User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEndUser}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Name</Label>
                <Input
                  id="userName"
                  value={endUserForm.name}
                  onChange={(e) => setEndUserForm({ ...endUserForm, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email ID</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={endUserForm.email}
                  onChange={(e) => setEndUserForm({ ...endUserForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userContact">Contact Number</Label>
                <Input
                  id="userContact"
                  type="tel"
                  value={endUserForm.contactNumber}
                  onChange={(e) => setEndUserForm({ ...endUserForm, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddEndUserModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Delivery Partner Modal */}
      <Dialog open={showAddDeliveryPartnerModal} onOpenChange={setShowAddDeliveryPartnerModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Delivery Partner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDeliveryPartner}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="partnerName">Name</Label>
                <Input
                  id="partnerName"
                  value={deliveryPartnerForm.name}
                  onChange={(e) => setDeliveryPartnerForm({ ...deliveryPartnerForm, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partnerMobile">Mobile Number</Label>
                <Input
                  id="partnerMobile"
                  type="tel"
                  value={deliveryPartnerForm.mobileNumber}
                  onChange={(e) => setDeliveryPartnerForm({ ...deliveryPartnerForm, mobileNumber: e.target.value })}
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drivingLicense">Driving License</Label>
                <Input
                  id="drivingLicense"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDeliveryPartnerForm({ 
                    ...deliveryPartnerForm, 
                    drivingLicense: e.target.files?.[0] || null 
                  })}
                  required
                />
                <p className="text-sm text-gray-500">Upload PDF, JPG, or PNG (Max 5MB)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workPermit">Work Permit</Label>
                <Input
                  id="workPermit"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDeliveryPartnerForm({ 
                    ...deliveryPartnerForm, 
                    workPermit: e.target.files?.[0] || null 
                  })}
                  required
                />
                <p className="text-sm text-gray-500">Upload PDF, JPG, or PNG (Max 5MB)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="partnerEmail">Email ID</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={deliveryPartnerForm.email}
                  onChange={(e) => setDeliveryPartnerForm({ ...deliveryPartnerForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDeliveryPartnerModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Partner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'end-user' && 'End User Details'}
              {selectedItem?.type === 'delivery-partner' && 'Delivery Partner Details'}
              {selectedItem?.type === 'store-manager' && 'Store Manager Details'}
              {selectedItem?.type === 'vendor' && 'Vendor Details'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {selectedItem && (
              <>
                {selectedItem.type === 'end-user' && (
                  <>
                    <div>
                      <Label className="text-gray-600">User ID</Label>
                      <p>{selectedItem.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Name</Label>
                      <p>{selectedItem.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p>{selectedItem.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Phone</Label>
                      <p>{selectedItem.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Revenue</Label>
                      <p>{selectedItem.revenue}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Total Orders</Label>
                      <p>{selectedItem.orders}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Join Date</Label>
                      <p>{selectedItem.joinDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p><Badge variant={selectedItem.status === 'Active' ? 'default' : 'secondary'}>{selectedItem.status}</Badge></p>
                    </div>
                  </>
                )}
                {selectedItem.type === 'delivery-partner' && (
                  <>
                    <div>
                      <Label className="text-gray-600">DP ID</Label>
                      <p>{selectedItem.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Name</Label>
                      <p>{selectedItem.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p>{selectedItem.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Phone</Label>
                      <p>{selectedItem.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Total Deliveries</Label>
                      <p>{selectedItem.deliveries}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Earnings</Label>
                      <p>{selectedItem.earnings}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Rating</Label>
                      <p>⭐ {selectedItem.rating}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p><Badge variant={selectedItem.status === 'Active' ? 'default' : 'secondary'}>{selectedItem.status}</Badge></p>
                    </div>
                  </>
                )}
                {selectedItem.type === 'store-manager' && (
                  <>
                    <div>
                      <Label className="text-gray-600">Manager ID</Label>
                      <p>{selectedItem.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Name</Label>
                      <p>{selectedItem.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p>{selectedItem.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Phone</Label>
                      <p>{selectedItem.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Store</Label>
                      <p>{selectedItem.store}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Experience</Label>
                      <p>{selectedItem.experience}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p><Badge variant={selectedItem.status === 'Active' ? 'default' : 'secondary'}>{selectedItem.status}</Badge></p>
                    </div>
                  </>
                )}
                {selectedItem.type === 'vendor' && (
                  <>
                    <div>
                      <Label className="text-gray-600">Vendor ID</Label>
                      <p>{selectedItem.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Vendor Name</Label>
                      <p>{selectedItem.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Company Name</Label>
                      <p>{selectedItem.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">VAT Number</Label>
                      <p>{selectedItem.vatNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Email</Label>
                      <p>{selectedItem.email}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Contact Number</Label>
                      <p>{selectedItem.phone}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <p><Badge variant={selectedItem.status === 'Active' ? 'default' : 'secondary'}>{selectedItem.status}</Badge></p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {selectedItem?.type} record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
