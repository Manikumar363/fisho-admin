import React, { useEffect, useState } from 'react';
import { Eye, Plus, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { TabsContent } from '../ui/tabs';
import { apiFetch } from '../../lib/api';

type DeliveryPartnerForm = {
  name: string;
  mobileNumber: string;
  drivingLicense: File | null;
  workPermit: File | null;
  email: string;
};

type Filters = {
  status: string;
  sortBy: string;
};

interface DeliveryPartnersSectionProps {
  searchTerm: string;
  filters: Filters;
  deliveryPartnersPage: number;
  setDeliveryPartnersPage: React.Dispatch<React.SetStateAction<number>>;
  setShowAddDeliveryPartnerModal: React.Dispatch<React.SetStateAction<boolean>>;
  showAddDeliveryPartnerModal: boolean;
  deliveryPartnerForm: DeliveryPartnerForm;
  setDeliveryPartnerForm: React.Dispatch<React.SetStateAction<DeliveryPartnerForm>>;
  handleAddDeliveryPartner: (e: React.FormEvent) => void;
  handleView: (item: any, type: string) => void;
  handleDelete: (item: any, type: string) => void;
}

type DeliveryPartnerApiUser = {
  _id: string;
  email: string;
  phone: string;
  countryCode?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isBlocked?: boolean;
};

type DeliveryPartnerListItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  deliveries: number;
  earnings: string;
  rating: number;
};

const staticMetrics = [
  { deliveries: 342, earnings: '₹68,400', rating: 4.8 },
  { deliveries: 298, earnings: '₹59,600', rating: 4.7 },
  { deliveries: 456, earnings: '₹91,200', rating: 4.9 },
  { deliveries: 189, earnings: '₹37,800', rating: 4.6 },
];

export default function DeliveryPartnersSection({
  searchTerm,
  filters,
  deliveryPartnersPage,
  setDeliveryPartnersPage,
  setShowAddDeliveryPartnerModal,
  showAddDeliveryPartnerModal,
  deliveryPartnerForm,
  setDeliveryPartnerForm,
  handleAddDeliveryPartner,
  handleView,
  handleDelete,
}: DeliveryPartnersSectionProps) {
  const apiLimit = 15;
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('page', String(deliveryPartnersPage));
    params.append('limit', String(apiLimit));

    apiFetch<{
      success: boolean;
      users: DeliveryPartnerApiUser[];
      pagination?: { page: number; limit: number; totalItems: number; totalPages: number };
      message?: string;
    }>(`/api/delivery-partner/all-users?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch delivery partners');

        const mapped = (res.users || []).map((user, index) => {
          const metrics = staticMetrics[index % staticMetrics.length];
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed';
          const phone = `${user.countryCode || ''} ${user.phone || ''}`.trim();
          const status: 'Active' | 'Inactive' = user.isActive && !user.isBlocked ? 'Active' : 'Inactive';

          return {
            id: user._id,
            name,
            email: user.email || '—',
            phone: phone || '—',
            status,
            deliveries: metrics.deliveries,
            earnings: metrics.earnings,
            rating: metrics.rating,
          };
        });

        setDeliveryPartners(mapped);
        setTotalItems(res.pagination?.totalItems || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || 'Failed to fetch delivery partners');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [deliveryPartnersPage]);

  const getFilteredDeliveryPartners = () => {
    let filtered = deliveryPartners;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((partner) =>
        partner.id?.toLowerCase().includes(term) ||
        partner.name?.toLowerCase().includes(term) ||
        partner.email?.toLowerCase().includes(term) ||
        partner.phone?.toLowerCase().includes(term)
      );
    }

    if (filters.status) {
      filtered = filtered.filter((partner) => {
        const partnerStatus = partner.status?.toLowerCase();
        return partnerStatus === filters.status;
      });
    }

    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => b.name.toLowerCase().localeCompare(a.name.toLowerCase()));
    }

    return sorted;
  };

  const getPaginatedDeliveryPartners = () => {
    return getFilteredDeliveryPartners();
  };

  const filteredCount = getFilteredDeliveryPartners().length;
  const deliveryPartnersTotalPages = Math.max(1, totalPages);
  const pageStart = totalItems === 0 ? 0 : (deliveryPartnersPage - 1) * apiLimit + 1;
  const pageEnd = totalItems === 0 ? 0 : Math.min((deliveryPartnersPage - 1) * apiLimit + filteredCount, totalItems);

  return (
    <>
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
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        Loading delivery partners...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : getFilteredDeliveryPartners().length === 0 ? (
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
            {!loading && !error && getFilteredDeliveryPartners().length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {pageStart} to {pageEnd} of {totalItems} partners
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeliveryPartnersPage((prev) => Math.max(1, prev - 1))}
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
                    onClick={() => setDeliveryPartnersPage((prev) => Math.min(deliveryPartnersTotalPages, prev + 1))}
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

      <Dialog
        open={showAddDeliveryPartnerModal}
        onOpenChange={(open) => {
          if (!open) return;
        }}
      >
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
                  onChange={(e) =>
                    setDeliveryPartnerForm({
                      ...deliveryPartnerForm,
                      drivingLicense: e.target.files?.[0] || null,
                    })
                  }
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
                  onChange={(e) =>
                    setDeliveryPartnerForm({
                      ...deliveryPartnerForm,
                      workPermit: e.target.files?.[0] || null,
                    })
                  }
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
    </>
  );
}
