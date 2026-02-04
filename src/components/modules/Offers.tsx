import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { toast } from 'react-toastify';
import AddOffer from './offers/AddOffer';
import EditOffer from './offers/EditOffer';
import ViewOffer from './offers/ViewOffer';
import { apiFetch } from '../../lib/api';

interface Offer {
  _id: string;
  id?: string;
  couponName: string;
  couponDescription: string;
  discountPercentage: number;
  minimumOrderValue: number;
  minOrderValue?: number;
  expiryDate: string;
  usageLimitPerUser: number;
  usageLimit?: number;
  totalUsageLimit: number;
  currentUsageCount: number;
  totalUsersAvailed?: number;
  status: 'active' | 'inactive' | 'expired';
  applicableCategories: string[];
  excludedProducts: string[];
  createdAt: string;
  updatedAt: string;
}

interface CouponsResponse {
  success: boolean;
  coupons: Offer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCoupons: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    activeCoupons: number;
    expiredCoupons: number;
    inactiveCoupons: number;
    totalCoupons: number;
  };
  message: string;
}

const Offers: React.FC = () => {
  const location = useLocation();
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [showAddProductVariant, setShowAddProductVariant] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeCoupons: 0,
    expiredCoupons: 0,
    inactiveCoupons: 0,
    totalCoupons: 0
  });

  // Check navigation state for auto-opening AddOffer
  useEffect(() => {
    const state = location.state as any;
    if (state?.mode === 'add') {
      setShowAddOffer(true);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiFetch<CouponsResponse>('/api/coupons/get-all');
      if (response.success) {
        setOffers(response.coupons);
        setStats(response.stats);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOffer = (newOffer: {
    couponName: string;
    couponDescription: string;
    discountPercentage: number;
    minOrderValue: number;
    expiryDate: string;
    usageLimit: number;
  }) => {
    // This will be implemented when you add the create API
    fetchCoupons();
    setShowAddOffer(false);
    toast.success('Offer created successfully');
  };

  const handleEditOffer = (updatedOffer: Offer): void => {
    // Update the local state with the updated offer
    setOffers(offers.map(o => o._id === updatedOffer._id ? updatedOffer : o));
    setEditingOffer(null);
    // Refresh the list to get latest stats
    fetchCoupons();
  };

  const handleDeleteOffer = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (offerToDelete) {
      try {
        const response = await apiFetch<{
          success: boolean;
          message: string;
        }>(`/api/coupons/delete-coupon/${offerToDelete}`, { 
          method: 'DELETE' 
        });

        if (response.success) {
          setOffers(offers.filter(offer => offer._id !== offerToDelete));
          toast.success(response.message || 'Offer deleted successfully');
          // Refresh stats after deletion
          fetchCoupons();
        } else {
          toast.error('Failed to delete offer');
        }
      } catch (error: any) {
        console.error('Error deleting offer:', error);
        toast.error(error.message || 'Failed to delete offer');
      }
    }
    setDeleteDialogOpen(false);
    setOfferToDelete(null);
  };

  const filteredOffers = offers.filter(offer =>
    offer.couponName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.couponDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'expired':
        return 'bg-red-100 text-red-700 hover:bg-red-100';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  const capitalizeFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  if (showAddOffer) {
    return <AddOffer onBack={() => setShowAddOffer(false)} onSave={handleAddOffer} />;
  }


  if (editingOffer) {
    return <EditOffer offer={editingOffer} onBack={() => setEditingOffer(null)} onSave={handleEditOffer} />;
  }

  if (viewingOffer) {
    return <ViewOffer offer={viewingOffer} onBack={() => setViewingOffer(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Offers Management</h1>
          <p className="text-gray-600">Create and manage discount offers and coupons</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowAddOffer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Offer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Coupons</div>
            <div className="text-2xl font-bold">{stats.totalCoupons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Active Coupons</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeCoupons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Expired Coupons</div>
            <div className="text-2xl font-bold text-red-600">{stats.expiredCoupons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Inactive Coupons</div>
            <div className="text-2xl font-bold text-gray-600">{stats.inactiveCoupons}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by offer ID, coupon name, or description..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading coupons...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Coupon Name</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Discount %</th>
                    <th className="text-left py-3 px-4">Min Order Value</th>
                    <th className="text-left py-3 px-4">Expiry Date</th>
                    <th className="text-left py-3 px-4">Usage Limit/User</th>
                    <th className="text-left py-3 px-4">Total Limit</th>
                    <th className="text-left py-3 px-4">Current Usage</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-gray-500">
                        No offers found
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((offer) => (
                      <tr key={offer._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{offer.couponName}</td>
                        <td className="py-3 px-4 max-w-xs truncate">{offer.couponDescription}</td>
                        <td className="py-3 px-4">{offer.discountPercentage}%</td>
                        <td className="py-3 px-4">
                          <span className="dirham-symbol mr-2">&#xea;</span>
                          {offer.minimumOrderValue}
                        </td>
                        <td className="py-3 px-4">
                          {new Date(offer.expiryDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-3 px-4">{offer.usageLimitPerUser}</td>
                        <td className="py-3 px-4">{offer.totalUsageLimit}</td>
                        <td className="py-3 px-4">{offer.currentUsageCount}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusBadgeClass(offer.status)}>
                            {capitalizeFirstLetter(offer.status)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingOffer(offer)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingOffer(offer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOffer(offer._id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface AddProductVariantProps {
  onBack?: () => void;
}

const AddProductVariant: React.FC<AddProductVariantProps> = ({ onBack }) => {
  return (
    <div>
      {/* Your existing AddProductVariant code here */}
      {/* Example: Add a Back button if you want to use the onBack prop */}
      {/* <button onClick={onBack}>Back</button> */}
    </div>
  );
};

export default Offers;
