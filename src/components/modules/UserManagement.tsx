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
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function UserManagement() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('end-users');
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showAddEndUserModal, setShowAddEndUserModal] = useState(false);
  const [showAddDeliveryPartnerModal, setShowAddDeliveryPartnerModal] = useState(false);
  const [showAddSubadminModal, setShowAddSubadminModal] = useState(false);
  const [showEditSubadminModal, setShowEditSubadminModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeletedUsersModal, setShowDeletedUsersModal] = useState(false);
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingEndUser, setIsAddingEndUser] = useState(false);
  const [isAddingSubadmin, setIsAddingSubadmin] = useState(false);
  const [editingSubadminId, setEditingSubadminId] = useState<string | null>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [vendorForm, setVendorForm] = useState({
    vendorName: '',
    companyName: '',
    vatNumber: '',
    email: '',
    contactNumber: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deletedUsersSearchTerm, setDeletedUsersSearchTerm] = useState('');
  const [originalVendorForm, setOriginalVendorForm] = useState({
  vendorName: '',
  companyName: '',
  vatNumber: '',
  email: '',
  contactNumber: ''
});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    sortBy: 'recently-added'
  });
  const [endUserForm, setEndUserForm] = useState({
    firstName: '',
    lastName: '',
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

  const [subadminForm, setSubadminForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
    const [originalSubadminForm, setOriginalSubadminForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // End Users API integration
  const [endUsers, setEndUsers] = useState<any[]>([]);
  const [endUsersLoading, setEndUsersLoading] = useState(false);
  const [endUsersError, setEndUsersError] = useState<string | null>(null);
  const [endUsersPage, setEndUsersPage] = useState(1);
  const [endUsersTotalPages, setEndUsersTotalPages] = useState(1);

  // Deleted Users API integration
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [deletedUsersLoading, setDeletedUsersLoading] = useState(false);
  const [deletedUsersError, setDeletedUsersError] = useState<string | null>(null);
  const [deletedUsersPage, setDeletedUsersPage] = useState(1);
  const [deletedUsersTotalPages, setDeletedUsersTotalPages] = useState(1);
  const [deletedUsersTotalCount, setDeletedUsersTotalCount] = useState(0);

  // Vendors API integration
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState<string | null>(null);
  const [vendorsPage, setVendorsPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Store Managers API integration
  const [storeManagers, setStoreManagers] = useState<any[]>([]);
  const [storeManagersLoading, setStoreManagersLoading] = useState(false);
  const [storeManagersError, setStoreManagersError] = useState<string | null>(null);
  const [storeManagersPage, setStoreManagersPage] = useState(1);
  const [storeManagersTotalPages, setStoreManagersTotalPages] = useState(1);

  // Delivery Partners pagination
  const [deliveryPartnersPage, setDeliveryPartnersPage] = useState(1);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'end-users') {
      setActiveTab('end-users');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab !== 'end-users') return;
    setEndUsersLoading(true);
    setEndUsersError(null);
    apiFetch<{ success: boolean; users: any[]; pagination?: any; message?: string }>(`/api/user/all-users?page=${endUsersPage}&limit=${itemsPerPage}`)
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch users');
        setEndUsers(res.users || []);
        setEndUsersTotalPages(res.pagination?.totalPages || 1);
      })
      .catch(e => {
        setEndUsersError(e?.message || 'Failed to load users');
      })
      .finally(() => setEndUsersLoading(false));
  }, [activeTab, endUsersPage, itemsPerPage]);

  const fetchDeletedUsers = async () => {
    setDeletedUsersLoading(true);
    setDeletedUsersError(null);
    
    try {
      const res = await apiFetch<{
        success: boolean;
        users: any[];
        pagination?: any;
        message?: string;
      }>(`/api/user/deleted-users?page=${deletedUsersPage}&limit=10`);

      if (!res.success) throw new Error(res.message || 'Failed to fetch deleted users');

      setDeletedUsers(res.users || []);
      setDeletedUsersTotalPages(res.pagination?.totalPages || 1);
      setDeletedUsersTotalCount(res.pagination?.totalItems || 0);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load deleted users';
      setDeletedUsersError(msg);
      toast.error(msg);
    } finally {
      setDeletedUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'vendors') return;
    setVendorsLoading(true);
    setVendorsError(null);
    apiFetch<{ success: boolean; vendors: any[]; message?: string }>(`/api/vendors`)
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch vendors');
        setVendors(res.vendors || []);
      })
      .catch(e => {
        setVendorsError(e?.message || 'Failed to load vendors');
      })
      .finally(() => setVendorsLoading(false));
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'store-managers') return;
    setStoreManagersLoading(true);
    setStoreManagersError(null);
    apiFetch<{ success: boolean; subadmins: any[]; pagination?: any; message?: string }>(`/api/subadmin/all-subadmins?page=${storeManagersPage}&limit=${itemsPerPage}`)
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch store managers');
        setStoreManagers(res.subadmins || []);
        setStoreManagersTotalPages(res.pagination?.totalPages || 1);
      })
      .catch(e => {
        setStoreManagersError(e?.message || 'Failed to load store managers');
      })
      .finally(() => setStoreManagersLoading(false));
  }, [activeTab, storeManagersPage, itemsPerPage]);

  const deliveryPartners = [
    { id: 'DP-001', name: 'Mohammed Ali', email: 'ali@fisho.com', phone: '+91 98765 11111', deliveries: 342, earnings: '₹68,400', rating: 4.8, status: 'Active' },
    { id: 'DP-002', name: 'Suresh Babu', email: 'suresh@fisho.com', phone: '+91 98765 11112', deliveries: 298, earnings: '₹59,600', rating: 4.7, status: 'Active' },
    { id: 'DP-003', name: 'Ramesh Kumar', email: 'ramesh@fisho.com', phone: '+91 98765 11113', deliveries: 456, earnings: '₹91,200', rating: 4.9, status: 'Active' },
    { id: 'DP-004', name: 'Vikram Singh', email: 'vikram@fisho.com', phone: '+91 98765 11114', deliveries: 189, earnings: '₹37,800', rating: 4.6, status: 'Inactive' }
  ];

  const vendorsStatic = [
    { id: 'VN-001', vendorName: 'Coastal Fisheries Ltd', companyName: 'Coastal Fisheries Private Limited', vatNumber: 'VAT123456789', email: 'info@coastalfisheries.com', phone: '+91 98765 33331', status: 'Active' },
    { id: 'VN-002', vendorName: 'Marine Supplies Co', companyName: 'Marine Supplies Company', vatNumber: 'VAT987654321', email: 'contact@marinesupplies.com', phone: '+91 98765 33332', status: 'Active' },
    { id: 'VN-003', vendorName: 'Ocean Fresh Traders', companyName: 'Ocean Fresh Traders LLP', vatNumber: 'VAT456789123', email: 'sales@oceanfresh.com', phone: '+91 98765 33333', status: 'Active' }
  ];

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!vendorForm.vendorName || !vendorForm.companyName || !vendorForm.vatNumber || !vendorForm.email || !vendorForm.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        vendor?: any;
        message?: string;
      }>('/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name: vendorForm.vendorName,
          companyName: vendorForm.companyName,
          vatNumber: vendorForm.vatNumber,
          email: vendorForm.email,
          phone: vendorForm.contactNumber
        }),
      });

      if (!res.success) throw new Error(res.message || 'Failed to add vendor');

      // Show success message
      toast.success(res.message || 'Vendor added successfully');

      // Clear form and close modal
      setShowAddVendorModal(false);
      setVendorForm({
        vendorName: '',
        companyName: '',
        vatNumber: '',
        email: '',
        contactNumber: ''
      });

      // Refresh vendors list
      setVendorsLoading(true);
      const refreshRes = await apiFetch<{ success: boolean; vendors: any[]; message?: string }>('/api/vendors');
      if (refreshRes.success) {
        setVendors(refreshRes.vendors || []);
      }
      setVendorsLoading(false);
    } catch (e: any) {
      const msg = e?.message || 'Failed to add vendor';
      console.error('Add vendor error:', e);
      toast.error(msg);
    }
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingVendorId) return;

    // Validate required fields
    if (!vendorForm.vendorName || !vendorForm.companyName || !vendorForm.vatNumber || !vendorForm.email || !vendorForm.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        vendor?: any;
        message?: string;
      }>(`/api/vendors/${editingVendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: vendorForm.vendorName,
          companyName: vendorForm.companyName,
          vatNumber: vendorForm.vatNumber,
          email: vendorForm.email,
          phone: vendorForm.contactNumber
        }),
    });

    if (!res.success) throw new Error(res.message || 'Failed to update vendor');

    // Show success message
    toast.success(res.message || 'Vendor updated successfully');

    // Clear form and close modal
    setShowEditVendorModal(false);
    setEditingVendorId(null);
    setVendorForm({
      vendorName: '',
      companyName: '',
      vatNumber: '',
      email: '',
      contactNumber: ''
    });

    // Refresh vendors list
    setVendorsLoading(true);
    const refreshRes = await apiFetch<{ success: boolean; vendors: any[]; message?: string }>('/api/vendors');
    if (refreshRes.success) {
      setVendors(refreshRes.vendors || []);
    }
    setVendorsLoading(false);
    } catch (e: any) {
      const msg = e?.message || 'Failed to update vendor';
      console.error('Edit vendor error:', e);
      toast.error(msg);
    }
  };

  const handleAddEndUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endUserForm.firstName || !endUserForm.email || !endUserForm.contactNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAddingEndUser(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        user?: any;
        message?: string;
      }>('/api/user/create-user', {
        method: 'POST',
        body: JSON.stringify({
          firstName: endUserForm.firstName,
          lastName: endUserForm.lastName,
          phone: endUserForm.contactNumber,
          email: endUserForm.email
        }),
      });

      if (!res.success) throw new Error(res.message || 'Failed to create user');

      toast.success(res.message || 'User created successfully');
      setShowAddEndUserModal(false);
      setEndUserForm({
        firstName: '',
        lastName: '',
        email: '',
        contactNumber: ''
      });
      setEndUsersPage(1);
      const refreshRes = await apiFetch<{ success: boolean; users: any[]; pagination?: any; message?: string }>(`/api/user/all-users?page=1&limit=${itemsPerPage}`);
      if (refreshRes.success) {
        setEndUsers(refreshRes.users || []);
        setEndUsersTotalPages(refreshRes.pagination?.totalPages || 1);
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to create user';
      console.error('Create user error:', e);
      toast.error(msg);
    } finally {
      setIsAddingEndUser(false);
    }
  };

  const handleAddSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subadminForm.name || !subadminForm.email || !subadminForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsAddingSubadmin(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message?: string;
        user?: any;
      }>(`/api/subadmin/create-subadmin`, {
        method: 'POST',
        body: JSON.stringify({
          name: subadminForm.name,
          phone: subadminForm.phone,
          email: subadminForm.email,
        }),
      });

      if (!res.success) throw new Error(res.message || 'Failed to create subadmin');

      toast.success(res.message || 'Subadmin created successfully');
      setShowAddSubadminModal(false);
      setSubadminForm({ name: '', email: '', phone: '' });

      // Refresh store managers list
      setStoreManagersPage(1);
      const refreshRes = await apiFetch<{ success: boolean; subadmins: any[]; pagination?: any; message?: string }>(`/api/subadmin/all-subadmins?page=1&limit=${itemsPerPage}`);
      if (refreshRes.success) {
        setStoreManagers(refreshRes.subadmins || []);
        setStoreManagersTotalPages(refreshRes.pagination?.totalPages || 1);
      }
    } catch (e: any) {
      const msg = e?.message || 'Failed to create subadmin';
      console.error('Create subadmin error:', e);
      toast.error(msg);
    } finally {
      setIsAddingSubadmin(false);
    }
  };

  const handleOpenEditSubadmin = (manager: any) => {
    const formData = {
      name: manager.name || '',
      email: manager.email || '',
      phone: manager.phone || ''
    };
    setEditingSubadminId(manager._id);
    setSubadminForm(formData);
    setOriginalSubadminForm(formData); 
    setShowEditSubadminModal(true);
  };

  const handleEditSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubadminId) return;

    if (!subadminForm.name || !subadminForm.email || !subadminForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        message?: string;
        subadmin?: any;
      }>(`/api/subadmin/subadmin-by-id/${editingSubadminId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: subadminForm.name,
          email: subadminForm.email,
          phone: subadminForm.phone,
        }),
      });

      if (!res.success) throw new Error(res.message || 'Failed to update subadmin');

      toast.success(res.message || 'Subadmin updated successfully');

      // Close modal and reset
      setShowEditSubadminModal(false);
      setEditingSubadminId(null);

      // Refresh store managers list
      setStoreManagersLoading(true);
      const refreshRes = await apiFetch<{ success: boolean; subadmins: any[]; pagination?: any; message?: string }>(`/api/subadmin/all-subadmins?page=${storeManagersPage}&limit=${itemsPerPage}`);
      if (refreshRes.success) {
        setStoreManagers(refreshRes.subadmins || []);
        setStoreManagersTotalPages(refreshRes.pagination?.totalPages || 1);
      }
      setStoreManagersLoading(false);
    } catch (e: any) {
      const msg = e?.message || 'Failed to update subadmin';
      console.error('Edit subadmin error:', e);
      toast.error(msg);
    }
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

  const handleView = async (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setShowViewModal(true);

    // Fetch full user details for end-users
    if (type === 'end-user') {
      setIsLoadingView(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          user?: any;
          message?: string;
        }>(`/api/user/user-by-id/${item._id}`);

        if (!res.success) throw new Error(res.message || 'Failed to fetch user details');

        // Update selected item with full details
        setSelectedItem({
          ...res.user,
          type: 'end-user',
          id: res.user._id,
          name: `${res.user.firstName} ${res.user.lastName}`,
          phone: `${res.user.countryCode} ${res.user.phone}`,
          status: res.user.isActive ? 'Active' : 'Inactive'
        });
      } catch (e: any) {
        const msg = e?.message || 'Failed to load user details';
        console.error('Fetch user details error:', e);
        toast.error(msg);
      } finally {
        setIsLoadingView(false);
      }
    }
    
    // Fetch full vendor details for vendors
    if (type === 'vendor') {
      setIsLoadingView(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          vendor?: any;
          message?: string;
        }>(`/api/vendors/${item._id}`);

        if (!res.success) throw new Error(res.message || 'Failed to fetch vendor details');

        // Update selected item with full details
        setSelectedItem({
          ...res.vendor,
          type: 'vendor',
          id: res.vendor._id,
          vendorName: res.vendor.name,
          status: 'Active'
        });
      } catch (e: any) {
        const msg = e?.message || 'Failed to load vendor details';
        console.error('Fetch vendor details error:', e);
        toast.error(msg);
      } finally {
        setIsLoadingView(false);
      }
    }

    // Fetch full subadmin details for store-managers
    if (type === 'store-manager') {
      setIsLoadingView(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          subadmin?: any;
          message?: string;
        }>(`/api/subadmin/subadmin-by-id/${item._id}`);

        if (!res.success) throw new Error(res.message || 'Failed to fetch subadmin details');

        // Update selected item with full details
        setSelectedItem({
          ...res.subadmin,
          type: 'store-manager',
        });
      } catch (e: any) {
        const msg = e?.message || 'Failed to load subadmin details';
        console.error('Fetch subadmin details error:', e);
        toast.error(msg);
      } finally {
        setIsLoadingView(false);
      }
    }
  };

  const handleDelete = (item: any, type: string) => {
    setSelectedItem({ ...item, type });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      if (selectedItem.type === 'end-user') {
        // Delete end-user
        const res = await apiFetch<{
          success: boolean;
          message?: string;
        }>(`/api/user/delete-user/${selectedItem._id}`, {
          method: 'DELETE',
        });

        if (!res.success) throw new Error(res.message || 'Failed to delete user');

        toast.success(res.message || 'User deleted successfully');
        setShowDeleteDialog(false);
        setSelectedItem(null);
        
        // Refresh the users list
        setEndUsersPage(1);
        const refreshRes = await apiFetch<{ success: boolean; users: any[]; pagination?: any; message?: string }>(`/api/user/all-users?page=1&limit=${itemsPerPage}`);
        if (refreshRes.success) {
          setEndUsers(refreshRes.users || []);
          setEndUsersTotalPages(refreshRes.pagination?.totalPages || 1);
        }
      } else if (selectedItem.type === 'vendor') {
        // Delete vendor
        const res = await apiFetch<{
          success: boolean;
          message?: string;
        }>(`/api/vendors/${selectedItem._id}`, {
          method: 'DELETE',
        });

        if (!res.success) throw new Error(res.message || 'Failed to delete vendor');

        toast.success(res.message || 'Vendor deleted successfully');
        setShowDeleteDialog(false);
        setSelectedItem(null);
        
        // Refresh the vendors list
        const refreshRes = await apiFetch<{ success: boolean; vendors: any[]; message?: string }>('/api/vendors');
        if (refreshRes.success) {
          setVendors(refreshRes.vendors || []);
        }
      } else if (selectedItem.type === 'store-manager') {
        // Delete subadmin (store manager)
        const res = await apiFetch<{
          success: boolean;
          message?: string;
        }>(`/api/subadmin/subadmin-by-id/${selectedItem._id}`, {
          method: 'DELETE',
        });

        if (!res.success) throw new Error(res.message || 'Failed to delete subadmin');

        toast.success(res.message || 'Subadmin deleted successfully');
        setShowDeleteDialog(false);
        setSelectedItem(null);

        // Refresh the store managers list
        setStoreManagersLoading(true);
        const refreshRes = await apiFetch<{ success: boolean; subadmins: any[]; pagination?: any; message?: string }>(`/api/subadmin/all-subadmins?page=${storeManagersPage}&limit=${itemsPerPage}`);
        if (refreshRes.success) {
          setStoreManagers(refreshRes.subadmins || []);
          setStoreManagersTotalPages(refreshRes.pagination?.totalPages || 1);
        }
        setStoreManagersLoading(false);
      } else {
        toast.info('Delete functionality not yet implemented for this type');
        setShowDeleteDialog(false);
      }
    } catch (e: any) {
      const msg = e?.message || `Failed to delete ${selectedItem.type}`;
      console.error(`Delete ${selectedItem.type} error:`, e);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowDeletedUsers = () => {
    setShowDeletedUsersModal(true);
    setDeletedUsersSearchTerm('');
    fetchDeletedUsers();
  };

  const getFilteredDeletedUsers = () => {
    if (!deletedUsersSearchTerm.trim()) {
      return deletedUsers;
    }

    const term = deletedUsersSearchTerm.toLowerCase().trim();
    return deletedUsers.filter(user => {
      const userId = user._id?.toLowerCase() || '';
      const firstName = user.firstName?.toLowerCase() || '';
      const lastName = user.lastName?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const phone = user.phone?.toLowerCase() || '';
      const countryCode = user.countryCode?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      const fullPhone = `${countryCode} ${phone}`;
      
      return userId.includes(term) ||
             firstName.includes(term) ||
             lastName.includes(term) ||
             email.includes(term) ||
             phone.includes(term) ||
             fullName.includes(term) ||
             fullPhone.includes(term);
    });
  };

  const handleOpenEditVendor = (vendor: any) => {
    const formData = {
    vendorName: vendor.name,
    companyName: vendor.companyName,
    vatNumber: vendor.vatNumber,
    email: vendor.email,
    contactNumber: vendor.phone
  };
  setEditingVendorId(vendor._id);
  setVendorForm(formData);
  setOriginalVendorForm(formData);
  setShowEditVendorModal(true);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      sortBy: 'recently-added'
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== '';
  };

  // Filter functions
  const getFilteredEndUsers = () => {
    let filtered = endUsers;

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const userId = user._id?.toLowerCase() || '';
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const email = user.email?.toLowerCase() || '';
        const phone = user.phone?.toLowerCase() || '';
        const countryCode = user.countryCode?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`;
        const fullPhone = `${countryCode} ${phone}`;
        
        return userId.includes(term) ||
               firstName.includes(term) ||
               lastName.includes(term) ||
               email.includes(term) ||
               phone.includes(term) ||
               fullName.includes(term) ||
               fullPhone.includes(term);
      });
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(user => {
        const userStatus = user.isActive ? 'active' : 'inactive';
        return userStatus === filters.status;
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameB.localeCompare(nameA);
      });
    } else if (filters.sortBy === 'recently-added') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    return sorted;
  };

  const getFilteredDeliveryPartners = () => {
    let filtered = deliveryPartners;

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(partner => 
        partner.id?.toLowerCase().includes(term) ||
        partner.name?.toLowerCase().includes(term) ||
        partner.email?.toLowerCase().includes(term) ||
        partner.phone?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(partner => {
        const partnerStatus = partner.status?.toLowerCase();
        return partnerStatus === filters.status;
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    }

    return sorted;
  };

  const getPaginatedDeliveryPartners = () => {
    const filtered = getFilteredDeliveryPartners();
    const startIndex = (deliveryPartnersPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const deliveryPartnersTotalPages = Math.ceil(getFilteredDeliveryPartners().length / itemsPerPage);

  const getFilteredStoreManagers = () => {
    let filtered = storeManagers;

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(manager => {
        const managerId = manager._id?.toLowerCase() || '';
        const name = manager.name?.toLowerCase() || '';
        const email = manager.email?.toLowerCase() || '';
        const phone = manager.phone?.toLowerCase() || '';
        
        return managerId.includes(term) ||
               name.includes(term) ||
               email.includes(term) ||
               phone.includes(term);
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameB.localeCompare(nameA);
      });
    } else if (filters.sortBy === 'recently-added') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    return sorted;
  };

  const getFilteredVendors = () => {
    let filtered = vendors;

    // Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(vendor => {
        const vendorId = vendor._id?.toLowerCase() || '';
        const name = vendor.name?.toLowerCase() || '';
        const companyName = vendor.companyName?.toLowerCase() || '';
        const vatNumber = vendor.vatNumber?.toLowerCase() || '';
        const email = vendor.email?.toLowerCase() || '';
        const phone = vendor.phone?.toLowerCase() || '';
        
        return vendorId.includes(term) ||
               name.includes(term) ||
               companyName.includes(term) ||
               vatNumber.includes(term) ||
               email.includes(term) ||
               phone.includes(term);
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      });
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return nameB.localeCompare(nameA);
      });
    } else if (filters.sortBy === 'recently-added') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    return sorted;
  };

  const getPaginatedVendors = () => {
    const filtered = getFilteredVendors();
    const startIndex = (vendorsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const vendorsTotalPages = Math.ceil(getFilteredVendors().length / itemsPerPage);

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowFilterModal(true)}
              className={hasActiveFilters() ? 'border-blue-600 text-blue-600' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {hasActiveFilters() && <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Active</span>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        setSearchTerm(''); // Clear search when switching tabs
      }} className="w-full">
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowAddEndUserModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add End User
                </Button>
                <Button  
                  onClick={handleShowDeletedUsers}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deleted Users
                </Button>
              </div>
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
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endUsersLoading ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading users...</td></tr>
                    ) : endUsersError ? (
                      <tr><td colSpan={6} className="py-8 text-center text-red-600">{endUsersError}</td></tr>
                    ) : endUsers.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">No users found</td></tr>
                    ) : getFilteredEndUsers().length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-500">No users match your search</td></tr>
                    ) : (
                      getFilteredEndUsers().map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-blue-600">{user._id.substring(0, 8)}...</td>
                          <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                          <td className="py-3 px-4">{user.countryCode} {user.phone}</td>
                          <td className="py-3 px-4">{user.email}</td>
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
              {!endUsersLoading && !endUsersError && getFilteredEndUsers().length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((endUsersPage - 1) * itemsPerPage) + 1} to {Math.min(endUsersPage * itemsPerPage, getFilteredEndUsers().length)} of {getFilteredEndUsers().length} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEndUsersPage(prev => Math.max(1, prev - 1))}
                      disabled={endUsersPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">
                        Page {endUsersPage} of {endUsersTotalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEndUsersPage(prev => Math.min(endUsersTotalPages, prev + 1))}
                      disabled={endUsersPage === endUsersTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
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
                    {getFilteredDeliveryPartners().length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500">
                          No delivery partners found
                        </td>
                      </tr>
                    ) : (
                      getPaginatedDeliveryPartners().map((partner) => (
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
                    ))
                    )}
                  </tbody>
                </table>
              </div>
              {getFilteredDeliveryPartners().length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((deliveryPartnersPage - 1) * itemsPerPage) + 1} to {Math.min(deliveryPartnersPage * itemsPerPage, getFilteredDeliveryPartners().length)} of {getFilteredDeliveryPartners().length} partners
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryPartnersPage(prev => Math.max(1, prev - 1))}
                      disabled={deliveryPartnersPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">
                        Page {deliveryPartnersPage} of {deliveryPartnersTotalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeliveryPartnersPage(prev => Math.min(deliveryPartnersTotalPages, prev + 1))}
                      disabled={deliveryPartnersPage === deliveryPartnersTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store-managers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Store Managers</CardTitle>
              <Button 
                onClick={() => setShowAddSubadminModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subadmin
              </Button>
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
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeManagersLoading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading store managers...</td></tr>
                    ) : storeManagersError ? (
                      <tr><td colSpan={7} className="py-8 text-center text-red-600">{storeManagersError}</td></tr>
                    ) : storeManagers.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500">No store managers found</td></tr>
                    ) : getFilteredStoreManagers().length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-gray-500">No store managers match your search</td></tr>
                    ) : (
                      getFilteredStoreManagers().map((manager) => (
                        <tr key={manager._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-blue-600">{manager._id.substring(0, 8)}...</td>
                          <td className="py-3 px-4">{manager.name}</td>
                          <td className="py-3 px-4">{manager.phone}</td>
                          <td className="py-3 px-4">{manager.email}</td>
                          <td className="py-3 px-4 capitalize">{manager.role}</td>
                          <td className="py-3 px-4">
                            <Badge variant={manager.isActive ? 'default' : 'secondary'}>
                              {manager.isActive ? 'Active' : 'Inactive'}
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
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleOpenEditSubadmin(manager)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-gray-600" />
                              </button>
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleDelete(manager, 'store-manager')}
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
              {!storeManagersLoading && !storeManagersError && getFilteredStoreManagers().length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((storeManagersPage - 1) * itemsPerPage) + 1} to {Math.min(storeManagersPage * itemsPerPage, getFilteredStoreManagers().length)} of {getFilteredStoreManagers().length} managers
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStoreManagersPage(prev => Math.max(1, prev - 1))}
                      disabled={storeManagersPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">
                        Page {storeManagersPage} of {storeManagersTotalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStoreManagersPage(prev => Math.min(storeManagersTotalPages, prev + 1))}
                      disabled={storeManagersPage === storeManagersTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
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
                    {vendorsLoading ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">Loading vendors...</td></tr>
                    ) : vendorsError ? (
                      <tr><td colSpan={8} className="py-8 text-center text-red-600">{vendorsError}</td></tr>
                    ) : vendors.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">No vendors found</td></tr>
                    ) :  getFilteredVendors().length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-gray-500">No vendors match your search</td></tr>
                   )  : (
                      getPaginatedVendors().map((vendor) => (
                        <tr key={vendor._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-blue-600">{vendor._id.substring(0, 8)}...</td>
                          <td className="py-3 px-4">{vendor.name}</td>
                          <td className="py-3 px-4">{vendor.companyName}</td>
                          <td className="py-3 px-4">{vendor.vatNumber}</td>
                          <td className="py-3 px-4">{vendor.email}</td>
                          <td className="py-3 px-4">{vendor.phone}</td>
                          <td className="py-3 px-4">
                            <Badge variant="default">Active</Badge>
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
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleOpenEditVendor(vendor)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button 
                                className="p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleDelete(vendor, 'vendor')}
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
              {!vendorsLoading && !vendorsError && getFilteredVendors().length > 0 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((vendorsPage - 1) * itemsPerPage) + 1} to {Math.min(vendorsPage * itemsPerPage, getFilteredVendors().length)} of {getFilteredVendors().length} vendors
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVendorsPage(prev => Math.max(1, prev - 1))}
                      disabled={vendorsPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">
                        Page {vendorsPage} of {vendorsTotalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVendorsPage(prev => Math.min(vendorsTotalPages, prev + 1))}
                      disabled={vendorsPage === vendorsTotalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Vendor Modal */}
      <Dialog open={showAddVendorModal} onOpenChange={(open) => {
        setShowAddVendorModal(open);
        if (open) {
          setVendorForm({
            vendorName: '',
            companyName: '',
            vatNumber: '',
            email: '',
            contactNumber: ''
          });
        }
      }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name *</Label>
                <Input
                  id="vendorName"
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={vendorForm.companyName}
                  onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number *</Label>
                <Input
                  id="vatNumber"
                  value={vendorForm.vatNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, vatNumber: e.target.value })}
                  placeholder="Enter VAT number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email ID *</Label>
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
                <Label htmlFor="contactNumber">Contact Number *</Label>
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
              <Button type="button" variant="outline" onClick={() =>{ setShowAddVendorModal(false);
              setVendorForm({
                vendorName: '',
                companyName: '',
                vatNumber: '',
                email: '',
                contactNumber: ''
              });
           } }>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Add Vendor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Modal */}
      <Dialog open={showEditVendorModal} onOpenChange={(open) => {
  // Only close if the user explicitly closes it (open === false from close button)
  // Prevent closing on outside click by not calling setShowXModal
  if (!open) return;
}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditVendor}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editVendorName">Vendor Name</Label>
                <Input
                  id="editVendorName"
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                  placeholder="Enter vendor name"
                  autoComplete='off'
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCompanyName">Company Name</Label>
                <Input
                  id="editCompanyName"
                  value={vendorForm.companyName}
                  onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                  placeholder="Enter company name"
                  autoComplete='off'
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editVatNumber">VAT Number</Label>
                <Input
                  id="editVatNumber"
                  value={vendorForm.vatNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, vatNumber: e.target.value })}
                  placeholder="Enter VAT number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email ID</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={vendorForm.email}
                  onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editContactNumber">Contact Number</Label>
                <Input
                  id="editContactNumber"
                  type="tel"
                  value={vendorForm.contactNumber}
                  onChange={(e) => setVendorForm({ ...vendorForm, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditVendorModal(false)}>
                Cancel
              </Button>
              <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={
                !vendorForm.vendorName.trim() ||
                !vendorForm.companyName.trim() ||
                !vendorForm.vatNumber.trim() ||
                !vendorForm.email.trim() ||
                !vendorForm.contactNumber.trim() ||
                (vendorForm.vendorName === originalVendorForm.vendorName &&
                 vendorForm.companyName === originalVendorForm.companyName &&
                 vendorForm.vatNumber === originalVendorForm.vatNumber &&
                 vendorForm.email === originalVendorForm.email &&
                 vendorForm.contactNumber === originalVendorForm.contactNumber)
               }
              >
                Update Vendor
              </Button>
            </DialogFooter>
            
          </form>
          
        </DialogContent>
        
      </Dialog>

      {/* Add End User Modal */}
      <Dialog open={showAddEndUserModal} onOpenChange={(open) => {
        if (!open) {
          // Clear form when dialog closes
          setEndUserForm({
            firstName: '',
            lastName: '',
            email: '',
            contactNumber: ''
          });
          setShowAddEndUserModal(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New End User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEndUser}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={endUserForm.firstName}
                    onChange={(e) => setEndUserForm({ ...endUserForm, firstName: e.target.value })}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={endUserForm.lastName}
                    onChange={(e) => setEndUserForm({ ...endUserForm, lastName: e.target.value })}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email ID *</Label>
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
                <Label htmlFor="userContact">Contact Number *</Label>
                <Input
                  id="userContact"
                  type="tel"
                  value={endUserForm.contactNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEndUserForm({ ...endUserForm, contactNumber: value });
                  }}
                  placeholder="Enter 10-digit phone number"
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" 
              className="bg-gray-200 
                border-4 border-gray-300 
                text-gray-700 
                hover:bg-gray-200 
                hover:border-gray-400
                font-semibold 
                shadomw-md
                px-6 py-2
                transition-colors"
               onClick={() => {
                setShowAddEndUserModal(false);
                setEndUserForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  contactNumber: ''
                });
              }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  isAddingEndUser ||
                  !endUserForm.firstName.trim() ||
                  !endUserForm.lastName.trim() ||
                  !endUserForm.email.trim() ||
                  !endUserForm.contactNumber.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(endUserForm.email)
                }
              >
                {isAddingEndUser ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Delivery Partner Modal */}
      <Dialog open={showAddDeliveryPartnerModal} onOpenChange={(open) => {
  // Only close if the user explicitly closes it (open === false from close button)
  // Prevent closing on outside click by not calling setShowXModal
  if (!open) return;
}}>
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

      {/* Add Subadmin Modal */}
      <Dialog open={showAddSubadminModal} onOpenChange={(open) => {
        setShowAddSubadminModal(open);
        if (open) {
          setSubadminForm({ name: '', email: '', phone: '' });
        }
      }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add New Subadmin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubadmin}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subadminName">Name*</Label>
                <Input
                  id="subadminName"
                  value={subadminForm.name}
                  onChange={(e) => setSubadminForm({ ...subadminForm, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subadminEmail">Email ID*</Label>
                <Input
                  id="subadminEmail"
                  type="email"
                  value={subadminForm.email}
                  onChange={(e) => setSubadminForm({ ...subadminForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subadminPhone">Contact Number*</Label>
                <Input
                  id="subadminPhone"
                  type="tel"
                  value={subadminForm.phone}
                  onChange={(e) =>{
                    const value = e.target.value.replace(/[^0-9]/g, '');
                   setSubadminForm({ ...subadminForm, phone: value })}                    

                  } 

                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowAddSubadminModal(false);
                setSubadminForm({ name: '', email: '', phone: '' });
              }}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isAddingSubadmin  ||
                  !subadminForm.name.trim() ||
                  !subadminForm.email.trim() ||
                  !subadminForm.phone.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subadminForm.email)
                }
              >
                {isAddingSubadmin ? 'Adding...' : 'Add Subadmin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subadmin Modal */}
      <Dialog open={showEditSubadminModal} onOpenChange={(open) => {
 
  if (!open) return;
}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subadmin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubadmin}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editSubadminName">Name</Label>
                <Input
                  id="editSubadminName"
                  value={subadminForm.name}
                  onChange={(e) => setSubadminForm({ ...subadminForm, name: e.target.value })}
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSubadminEmail">Email ID</Label>
                <Input
                  id="editSubadminEmail"
                  type="email"
                  value={subadminForm.email}
                  onChange={(e) => setSubadminForm({ ...subadminForm, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSubadminPhone">Contact Number</Label>
                <Input
                  id="editSubadminPhone"
                  type="tel"
                  value={subadminForm.phone}
                  onChange={(e) => setSubadminForm({ ...subadminForm, phone: e.target.value })}
                  placeholder="Enter contact number"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditSubadminModal(false)}>
                Cancel
              </Button>
              <Button
               type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  !subadminForm.name.trim() ||
                  !subadminForm.email.trim() ||
                  !subadminForm.phone.trim() ||
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subadminForm.email) ||
                  (subadminForm.name === originalSubadminForm.name &&
                   subadminForm.email === originalSubadminForm.email &&
                   subadminForm.phone === originalSubadminForm.phone)
                }
              >
                Update Subadmin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedItem?.type === 'end-user' && 'End User Details'}
              {selectedItem?.type === 'delivery-partner' && 'Delivery Partner Details'}
              {selectedItem?.type === 'store-manager' && 'Store Manager Details'}
              {selectedItem?.type === 'vendor' && 'Vendor Details'}
            </DialogTitle>
          </DialogHeader>
          {isLoadingView ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              {selectedItem && (
                <>
                  {selectedItem.type === 'end-user' && (
                    <>
                      <div>
                        <Label className="text-gray-600">User ID</Label>
                        <p className="font-medium">{selectedItem._id || selectedItem.id}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Name</Label>
                        <p className="font-medium">{selectedItem.name || `${selectedItem.firstName} ${selectedItem.lastName}`}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Email</Label>
                        <p className="font-medium">{selectedItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Phone</Label>
                        <p className="font-medium">{selectedItem.phone}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Role</Label>
                        <p className="font-medium capitalize">{selectedItem.role || '—'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Verified</Label>
                        <p><Badge variant={selectedItem.isVerified ? 'default' : 'secondary'}>{selectedItem.isVerified ? 'Yes' : 'No'}</Badge></p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Blocked</Label>
                        <p><Badge variant={selectedItem.isBlocked ? 'destructive' : 'default'}>{selectedItem.isBlocked ? 'Yes' : 'No'}</Badge></p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Status</Label>
                        <p><Badge variant={selectedItem.status === 'Active' ? 'default' : 'secondary'}>{selectedItem.status}</Badge></p>
                      </div>
                      {selectedItem.addresses && selectedItem.addresses.length > 0 && (
                        <div className="col-span-2">
                          <Label className="text-gray-600">Addresses</Label>
                          <div className="mt-2 space-y-2">
                            {selectedItem.addresses.map((addr: any, idx: number) => (
                              <div key={addr._id || idx} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{addr.label}</Badge>
                                  {addr.isDefault && <Badge variant="default" className="text-xs">Default</Badge>}
                                </div>
                                <p className="text-sm">{addr.fullAddress}</p>
                                {addr.building && <p className="text-sm text-gray-600">Building: {addr.building}</p>}
                                {addr.floor && <p className="text-sm text-gray-600">Floor: {addr.floor}</p>}
                                {addr.flat && <p className="text-sm text-gray-600">Flat: {addr.flat}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                        <p className="font-medium">{selectedItem._id || selectedItem.id}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Name</Label>
                        <p className="font-medium">{selectedItem.name}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Email</Label>
                        <p className="font-medium">{selectedItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Phone</Label>
                        <p className="font-medium">{selectedItem.phone}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Role</Label>
                        <p className="font-medium capitalize">{selectedItem.role}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Status</Label>
                        <p><Badge variant={selectedItem.isActive ? 'default' : 'secondary'}>{selectedItem.isActive ? 'Active' : 'Inactive'}</Badge></p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Created At</Label>
                        <p className="font-medium">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : '—'}</p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Last Updated</Label>
                        <p className="font-medium">{selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleDateString() : '—'}</p>
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
          )}
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deleted Users Modal */}
      <Dialog open={showDeletedUsersModal} onOpenChange={setShowDeletedUsersModal}>
        <DialogContent className="max-w-4xl sm:max-w-5xl w-[80vw] sm:w-[70vw] max-h-[70vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-white">
            <DialogTitle>Deleted Users</DialogTitle>
          </DialogHeader>
          
          <div className="px-6 py-3 border-b bg-gray-50">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, phone, email, or user ID..."
                className="pl-10"
                value={deletedUsersSearchTerm}
                onChange={(e) => setDeletedUsersSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
              {deletedUsersLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : deletedUsersError ? (
                <div className="py-8 text-center text-red-600">{deletedUsersError}</div>
              ) : deletedUsers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No deleted users found</div>
              ) : getFilteredDeletedUsers().length === 0 ? (
                <div className="py-8 text-center text-gray-500">No results found for "{deletedUsersSearchTerm}"</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">User ID</th>
                        <th className="text-left py-3 px-4">User Name</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Phone Number</th>
                        <th className="text-left py-3 px-4">Delete Reason</th>
                        <th className="text-left py-3 px-4">Deleted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredDeletedUsers().map((user) => (
                        <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-blue-600">{user._id.substring(0, 8)}...</td>
                          <td className="py-3 px-4">{user.firstName} {user.lastName}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{user.countryCode} {user.phone}</td>
                          <td className="py-3 px-4">{user.deleteReason || '—'}</td>
                          <td className="py-3 px-4 text-sm">
                            {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>
          
          <DialogFooter className="border-t px-6 py-4 flex items-center justify-between bg-white">
            <div className="text-sm text-gray-600">
              {getFilteredDeletedUsers().length > 0 ? (
                <>
                  Showing {getFilteredDeletedUsers().length} of {deletedUsers.length} deleted users
                </>
              ) : (
                <span>Page {deletedUsersPage} of {deletedUsersTotalPages}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (deletedUsersPage > 1) {
                    setDeletedUsersPage(deletedUsersPage - 1);
                    fetchDeletedUsers();
                  }
                }}
                disabled={deletedUsersPage === 1 || deletedUsersLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (deletedUsersPage < deletedUsersTotalPages) {
                    setDeletedUsersPage(deletedUsersPage + 1);
                    fetchDeletedUsers();
                  }
                }}
                disabled={deletedUsersPage >= deletedUsersTotalPages || deletedUsersLoading}
              >
                Next
              </Button>
              <Button 
                onClick={() => setShowDeletedUsersModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {activeTab === 'end-users' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="statusFilter">Status</Label>
                  <select
                    id="statusFilter"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label>Sort By</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="recently-added"
                        name="sortBy"
                        value="recently-added"
                        checked={filters.sortBy === 'recently-added'}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="mr-3"
                      />
                      <label htmlFor="recently-added" className="cursor-pointer">Recently Added</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="name-asc"
                        name="sortBy"
                        value="name-asc"
                        checked={filters.sortBy === 'name-asc'}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="mr-3"
                      />
                      <label htmlFor="name-asc" className="cursor-pointer">Name (A to Z)</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="name-desc"
                        name="sortBy"
                        value="name-desc"
                        checked={filters.sortBy === 'name-desc'}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="mr-3"
                      />
                      <label htmlFor="name-desc" className="cursor-pointer">Name (Z to A)</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'vendors' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sort By</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="vendor-recently-added"
                      name="vendor-sortBy"
                      value="recently-added"
                      checked={filters.sortBy === 'recently-added'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="vendor-recently-added" className="text-sm font-normal cursor-pointer">
                      Recently Added
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="vendor-name-asc"
                      name="vendor-sortBy"
                      value="name-asc"
                      checked={filters.sortBy === 'name-asc'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="vendor-name-asc" className="text-sm font-normal cursor-pointer">
                      Name (A-Z)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="vendor-name-desc"
                      name="vendor-sortBy"
                      value="name-desc"
                      checked={filters.sortBy === 'name-desc'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="vendor-name-desc" className="text-sm font-normal cursor-pointer">
                      Name (Z-A)
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'delivery-partners' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dp-status" className="text-sm font-medium">Status</Label>
                  <select
                    id="dp-status"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="dp-name-asc"
                        name="dp-sortBy"
                        value="name-asc"
                        checked={filters.sortBy === 'name-asc'}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="dp-name-asc" className="text-sm font-normal cursor-pointer">
                        Name (A-Z)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="dp-name-desc"
                        name="dp-sortBy"
                        value="name-desc"
                        checked={filters.sortBy === 'name-desc'}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="dp-name-desc" className="text-sm font-normal cursor-pointer">
                        Name (Z-A)
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'store-managers' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sort By</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="sm-recently-added"
                      name="sm-sortBy"
                      value="recently-added"
                      checked={filters.sortBy === 'recently-added'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="sm-recently-added" className="text-sm font-normal cursor-pointer">
                      Recently Added
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="sm-name-asc"
                      name="sm-sortBy"
                      value="name-asc"
                      checked={filters.sortBy === 'name-asc'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="sm-name-asc" className="text-sm font-normal cursor-pointer">
                      Name (A-Z)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="sm-name-desc"
                      name="sm-sortBy"
                      value="name-desc"
                      checked={filters.sortBy === 'name-desc'}
                      onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="sm-name-desc" className="text-sm font-normal cursor-pointer">
                      Name (Z-A)
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
            >
              Clear Filters
            </Button>
            <Button 
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowFilterModal(false)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
