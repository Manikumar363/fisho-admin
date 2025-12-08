import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Switch } from '../../ui/switch';

interface AddStoreProps {
  onBack: () => void;
}

export default function AddStore({ onBack }: AddStoreProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    storeName: '',
    storeId: '',
    storeLocation: '',
    storeAddress: '',
    managerName: '',
    managerContact: '',
    managerEmail: '',
    operatingHours: '',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Store data:', formData);
    // Add store logic here
    navigate('/store-mapping');
  };

  const handleBack = () => {
    navigate('/store-mapping');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="mb-2">Add New Store</h1>
          <p className="text-gray-600">Enter store details and manager information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  placeholder="Enter store name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeId">Store ID</Label>
                <Input
                  id="storeId"
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  placeholder="Auto-generated or enter custom ID"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeLocation">Store Location</Label>
                <Input
                  id="storeLocation"
                  value={formData.storeLocation}
                  onChange={(e) => setFormData({ ...formData, storeLocation: e.target.value })}
                  placeholder="Enter location (e.g., Bandra West, Mumbai)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operatingHours">Store Operating Hours</Label>
                <Input
                  id="operatingHours"
                  value={formData.operatingHours}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  placeholder="e.g., 9:00 AM - 9:00 PM"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeAddress">Store Address</Label>
              <Textarea
                id="storeAddress"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                placeholder="Enter complete store address"
                rows={3}
                required
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-4">Manager Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="managerName">Store Manager Name</Label>
                  <Input
                    id="managerName"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="Enter manager name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerContact">Manager Contact Number</Label>
                  <Input
                    id="managerContact"
                    type="tel"
                    value={formData.managerContact}
                    onChange={(e) => setFormData({ ...formData, managerContact: e.target.value })}
                    placeholder="Enter contact number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managerEmail">Manager Email</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="storeStatus">Store Status</Label>
                  <p className="text-sm text-gray-500">Set the store as active or inactive</p>
                </div>
                <Switch
                  id="storeStatus"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
                </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Store
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}