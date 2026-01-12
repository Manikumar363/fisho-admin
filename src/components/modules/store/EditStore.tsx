import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Key } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { apiFetch } from '../../../lib/api';
import { toast } from 'react-toastify';

interface EditStoreProps {
  storeId: string;
  onBack: () => void;
  onStoreUpdated?: (store: any) => void;
}

export default function EditStore({ storeId, onBack, onStoreUpdated }: EditStoreProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    location: { lat: 0, lng: 0 },
    managerName: '',
    managerMobile: '',
    managerEmail: '',
    managerAddress: '',
    contactNumber: '',
    isActive: true,
    acceptOnlineOrders: true,
    acceptWalkinOrders: true
  });

  useEffect(() => {
    setLoading(true);
    apiFetch<{ success: boolean; store: any; message?: string }>(`/api/stores/${storeId}`)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch store');
        const store = res.store;
        setFormData({
          name: store.name || '',
          address: store.address || '',
          location: store.location || { lat: 0, lng: 0 },
          managerName: store.manager?.name || '',
          managerMobile: store.manager?.mobile || '',
          managerEmail: store.manager?.email || '',
          managerAddress: store.manager?.address || '',
          contactNumber: store.contactNumber || '',
          isActive: store.isActive !== false,
          acceptOnlineOrders: store.acceptOnlineOrders !== false,
          acceptWalkinOrders: store.acceptWalkinOrders !== false
        });
      })
      .catch((err) => {
        const msg = err?.message || 'Failed to load store';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; store: any; message?: string }>(
        `/api/stores/${storeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            location: formData.location,
            manager: {
              name: formData.managerName,
              mobile: formData.managerMobile,
              email: formData.managerEmail,
              address: formData.managerAddress
            },
            contactNumber: formData.contactNumber,
            isActive: formData.isActive,
            acceptOnlineOrders: formData.acceptOnlineOrders,
            acceptWalkinOrders: formData.acceptWalkinOrders
          })
        }
      );

      if (!res.success) throw new Error(res.message || 'Failed to update store');
      
      toast.success(res.message || 'Store updated successfully');
      if (onStoreUpdated && res.store) {
        onStoreUpdated(res.store);
      }
      onBack();
    } catch (err: any) {
      const msg = err?.message || 'Failed to update store';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6 text-gray-600">Loading store details...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store Mapping
        </Button>
        <div>
          <h1 className="mb-1">Edit Store</h1>
          <p className="text-gray-600">Update store information and manager details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Store Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input 
                  id="storeName" 
                  placeholder="e.g., Fisho Marine Drive"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="storeLocation">Store Location (Text)</Label>
                <Input 
                  id="storeLocation" 
                  placeholder="e.g., Marine Drive, Mumbai"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Google Maps Integration */}
            <div>
              <Label htmlFor="mapPin">Store Map Pin (Google Maps)</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input 
                    id="mapPin" 
                    placeholder="Enter Google Maps URL or coordinates" 
                    defaultValue="https://maps.google.com/?q=18.943523,72.823469"
                    required
                  />
                  <Button type="button" variant="outline">
                    <MapPin className="w-4 h-4 mr-2" />
                    Update Location
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Paste a Google Maps link or select location on map
                </p>
              </div>
            </div>

            {/* Map Preview Placeholder */}
            <div className="border rounded-lg p-4 bg-gray-50 h-64 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Map preview: Marine Drive, Mumbai</p>
                <p className="text-sm">Google Maps integration</p>
              </div>
            </div>

            {/* Manager Details */}
            <div className="border-t pt-6">
              <h3 className="mb-4">Store Manager Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="managerName">Manager Name</Label>
                  <Input 
                    id="managerName" 
                    placeholder="Enter manager name"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input 
                    id="mobileNumber" 
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.managerMobile}
                    onChange={(e) => setFormData({ ...formData, managerMobile: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contactNumber">Store Contact Number</Label>
                  <Input 
                    id="contactNumber" 
                    type="tel"
                    placeholder="+91 22 12345678"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="emailId">Email ID</Label>
                  <Input 
                    id="emailId" 
                    type="email"
                    placeholder="manager@fisho.com"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="managerAddress">Address of Store Manager</Label>
                  <Textarea 
                    id="managerAddress" 
                    placeholder="Enter complete residential address" 
                    rows={3}
                    value={formData.managerAddress}
                    onChange={(e) => setFormData({ ...formData, managerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Password Reset */}
            <div className="border-t pt-6">
              <h3 className="mb-4">Store Portal Access</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <Label>Change Password for Store Portal</Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Update the login password for store manager portal access
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input 
                            id="newPassword" 
                            type="password"
                            placeholder="Enter new password" 
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input 
                            id="confirmPassword" 
                            type="password"
                            placeholder="Re-enter password" 
                          />
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="mt-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Settings */}
            <div className="border-t pt-6">
              <h3 className="mb-4">Store Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="activeStatus">Store Status</Label>
                    <p className="text-sm text-gray-600">Activate or deactivate this store</p>
                  </div>
                  <Switch 
                    id="activeStatus" 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="onlineOrders">Accept Online Orders</Label>
                    <p className="text-sm text-gray-600">Enable customers to place orders</p>
                  </div>
                  <Switch 
                    id="onlineOrders" 
                    checked={formData.acceptOnlineOrders}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptOnlineOrders: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="walkinOrders">Accept Walk-in Orders</Label>
                    <p className="text-sm text-gray-600">Enable store billing for walk-in customers</p>
                  </div>
                  <Switch 
                    id="walkinOrders" 
                    checked={formData.acceptWalkinOrders}
                    onCheckedChange={(checked) => setFormData({ ...formData, acceptWalkinOrders: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t pt-6">
              <h3 className="mb-4">Store Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Today's Revenue</p>
                  <p><span className="dirham-symbol">&#xea;</span>45,230</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Current Stock Quantity</p>
                  <p>450 units</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Orders Today</p>
                  <p>34 orders</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={onBack}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={submitting}>
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
