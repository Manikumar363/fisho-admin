import React, { useState } from 'react';
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
import { toast } from 'sonner';
import AddOffer from './offers/AddOffer';
import EditOffer from './offers/EditOffer';
import ViewOffer from './offers/ViewOffer';

interface Offer {
  id: string;
  couponName: string;
  couponDescription: string;
  discountPercentage: number;
  minOrderValue: number;
  expiryDate: string;
  usageLimit: number;
  totalUsersAvailed: number;
  status: 'Active' | 'Expired';
}

export default function Offers() {
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [offers, setOffers] = useState<Offer[]>([
    {
      id: 'OFF-001',
      couponName: 'FISHO50',
      couponDescription: 'Get 50% off on your first order',
      discountPercentage: 50,
      minOrderValue: 500,
      expiryDate: '2025-12-31',
      usageLimit: 1,
      totalUsersAvailed: 234,
      status: 'Active'
    },
    {
      id: 'OFF-002',
      couponName: 'WELCOME20',
      couponDescription: 'Welcome bonus - 20% off on orders above ₹1000',
      discountPercentage: 20,
      minOrderValue: 1000,
      expiryDate: '2025-06-30',
      usageLimit: 3,
      totalUsersAvailed: 567,
      status: 'Active'
    },
    {
      id: 'OFF-003',
      couponName: 'BULK15',
      couponDescription: 'Bulk order discount - 15% off on orders above ₹5000',
      discountPercentage: 15,
      minOrderValue: 5000,
      expiryDate: '2025-12-31',
      usageLimit: 5,
      totalUsersAvailed: 89,
      status: 'Active'
    },
    {
      id: 'OFF-004',
      couponName: 'NEWYEAR25',
      couponDescription: 'New Year Special - 25% off on all orders',
      discountPercentage: 25,
      minOrderValue: 750,
      expiryDate: '2025-01-15',
      usageLimit: 2,
      totalUsersAvailed: 1023,
      status: 'Expired'
    },
    {
      id: 'OFF-005',
      couponName: 'SEAFOOD30',
      couponDescription: 'Premium seafood - 30% off on orders above ₹2000',
      discountPercentage: 30,
      minOrderValue: 2000,
      expiryDate: '2025-12-31',
      usageLimit: 3,
      totalUsersAvailed: 456,
      status: 'Active'
    },
    {
      id: 'OFF-006',
      couponName: 'FLASH40',
      couponDescription: 'Flash sale - 40% off for limited time',
      discountPercentage: 40,
      minOrderValue: 1500,
      expiryDate: '2025-03-31',
      usageLimit: 1,
      totalUsersAvailed: 789,
      status: 'Active'
    },
    {
      id: 'OFF-007',
      couponName: 'LOYALTY10',
      couponDescription: 'Loyalty reward - 10% off on all orders',
      discountPercentage: 10,
      minOrderValue: 300,
      expiryDate: '2025-12-31',
      usageLimit: 10,
      totalUsersAvailed: 1834,
      status: 'Active'
    },
    {
      id: 'OFF-008',
      couponName: 'SUMMER35',
      couponDescription: 'Summer special - 35% off on fresh catch',
      discountPercentage: 35,
      minOrderValue: 1200,
      expiryDate: '2024-12-31',
      usageLimit: 2,
      totalUsersAvailed: 345,
      status: 'Expired'
    }
  ]);

  const handleAddOffer = (newOffer: Omit<Offer, 'id' | 'totalUsersAvailed' | 'status'>) => {
    const offer: Offer = {
      id: `OFF-${String(offers.length + 1).padStart(3, '0')}`,
      ...newOffer,
      totalUsersAvailed: 0,
      status: new Date(newOffer.expiryDate) > new Date() ? 'Active' : 'Expired'
    };
    setOffers([...offers, offer]);
    setShowAddOffer(false);
    toast.success('Offer created successfully');
  };

  const handleEditOffer = (updatedOffer: Offer) => {
    setOffers(offers.map(offer => 
      offer.id === updatedOffer.id ? {
        ...updatedOffer,
        status: new Date(updatedOffer.expiryDate) > new Date() ? 'Active' : 'Expired'
      } : offer
    ));
    setEditingOffer(null);
    toast.success('Offer updated successfully');
  };

  const handleDeleteOffer = (offerId: string) => {
    setOfferToDelete(offerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (offerToDelete) {
      setOffers(offers.filter(offer => offer.id !== offerToDelete));
      toast.success('Offer deleted successfully');
    }
    setDeleteDialogOpen(false);
    setOfferToDelete(null);
  };

  const filteredOffers = offers.filter(offer =>
    offer.couponName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.couponDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Button 
          onClick={() => setShowAddOffer(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Offer
        </Button>
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Offer ID</th>
                  <th className="text-left py-3 px-4">Coupon Name</th>
                  <th className="text-left py-3 px-4">Discount %</th>
                  <th className="text-left py-3 px-4">Min Order Value</th>
                  <th className="text-left py-3 px-4">Expiry Date</th>
                  <th className="text-left py-3 px-4">Usage Limit</th>
                  <th className="text-left py-3 px-4">Total Users Availed</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-500">
                      No offers found
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer) => (
                    <tr key={offer.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{offer.id}</td>
                      <td className="py-3 px-4">{offer.couponName}</td>
                      <td className="py-3 px-4">{offer.discountPercentage}%</td>
                      <td className="py-3 px-4">₹{offer.minOrderValue}</td>
                      <td className="py-3 px-4">
                        {new Date(offer.expiryDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">{offer.usageLimit}</td>
                      <td className="py-3 px-4">{offer.totalUsersAvailed}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={offer.status === 'Active' ? 'default' : 'secondary'}
                          className={
                            offer.status === 'Active'
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          }
                        >
                          {offer.status}
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
                            onClick={() => handleDeleteOffer(offer.id)}
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
}
