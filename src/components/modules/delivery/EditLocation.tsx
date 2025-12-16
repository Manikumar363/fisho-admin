import React, { useState } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Checkbox } from '../../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { toast } from 'sonner';
import { apiFetch } from '../../../lib/api';

interface DeliveryLocation {
  id: string;
  code: string;
  locationName: string;
  deliveryType: string[];
  nearestStore: string;
  ordersReceived: number;
  status: 'Active' | 'Inactive';
}

interface EditLocationProps {
  location: DeliveryLocation;
  onBack: () => void;
  onSave: (location: DeliveryLocation) => void;
}

const stores = [
  'Fisho Marine Drive',
  'Fisho Bandra West',
  'Fisho Andheri',
  'Fisho Juhu',
  'Fisho Powai'
];

export default function EditLocation({ location, onBack, onSave }: EditLocationProps) {
  const [formData, setFormData] = useState({
    locationName: location.locationName,
    nearestStore: location.nearestStore,
    status: location.status === 'Active'
  });

  const [deliveryTypes, setDeliveryTypes] = useState({
    express: location.deliveryType.includes('Express Delivery'),
    nextDay: location.deliveryType.includes('Next Day Delivery')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleStoreChange = (value: string) => {
    setFormData(prev => ({ ...prev, nearestStore: value }));
    if (errors.nearestStore) {
      setErrors(prev => ({ ...prev, nearestStore: '' }));
    }
  };

  const handleDeliveryTypeChange = (type: 'express' | 'nextDay', checked: boolean) => {
    setDeliveryTypes(prev => ({ ...prev, [type]: checked }));
    if (errors.deliveryType) {
      setErrors(prev => ({ ...prev, deliveryType: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }

    if (!deliveryTypes.express && !deliveryTypes.nextDay) {
      newErrors.deliveryType = 'Please select at least one delivery type';
    }

    if (!formData.nearestStore) {
      newErrors.nearestStore = 'Please select a nearest store';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const selectedTypes = [];
      if (deliveryTypes.express) selectedTypes.push('Express Delivery');
      if (deliveryTypes.nextDay) selectedTypes.push('Next Day Delivery');

      // Prepare the payload for the API
      const payload = {
        name: formData.locationName.trim(),
        expressDelivery: deliveryTypes.express,
        isActive: formData.status
      };

      // Call the PUT API
      const response = await apiFetch<{
        success: boolean;
        community: any;
        message?: string;
      }>(
        `/api/community/${location.code}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload)
        }
      );

      // Update the location locally
      const updatedLocation: DeliveryLocation = {
        ...location,
        locationName: formData.locationName.trim(),
        deliveryType: selectedTypes,
        nearestStore: formData.nearestStore,
        status: formData.status ? 'Active' : 'Inactive'
      };

      toast.success(response.message || 'Location updated successfully');
      onSave(updatedLocation);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to update location';
      toast.error(errorMsg);
      console.error('Error updating location:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="mb-1">Edit Delivery Location</h1>
          <p className="text-gray-600">Update location details - {location.id}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="locationName">
                Location Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="locationName"
                name="locationName"
                placeholder="e.g., Bandra West"
                value={formData.locationName}
                onChange={handleChange}
                className={errors.locationName ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.locationName && (
                <p className="text-sm text-red-500">{errors.locationName}</p>
              )}
            </div>

            {/* Delivery Type */}
            <div className="space-y-3">
              <Label>
                Delivery Type <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <Checkbox
                    id="express"
                    checked={deliveryTypes.express}
                    onCheckedChange={(checked) => handleDeliveryTypeChange('express', checked as boolean)}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="express"
                      className="cursor-pointer"
                    >
                      <p className="text-sm">Express Delivery</p>
                      <p className="text-xs text-gray-500">Same-day delivery service</p>
                    </label>
                  </div>
                </div>

                <div className="flex items-center space-x-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <Checkbox
                    id="nextDay"
                    checked={deliveryTypes.nextDay}
                    onCheckedChange={(checked) => handleDeliveryTypeChange('nextDay', checked as boolean)}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="nextDay"
                      className="cursor-pointer"
                    >
                      <p className="text-sm">Next Day Delivery</p>
                      <p className="text-xs text-gray-500">Delivery within 24 hours</p>
                    </label>
                  </div>
                </div>
              </div>
              {errors.deliveryType && (
                <p className="text-sm text-red-500">{errors.deliveryType}</p>
              )}
            </div>

            {/* Nearest Store */}
            <div className="space-y-2">
              <Label htmlFor="nearestStore">
                Select Nearest Store <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.nearestStore}
                onValueChange={handleStoreChange}
                disabled={loading}
              >
                <SelectTrigger className={errors.nearestStore ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store} value={store}>
                      {store}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nearestStore && (
                <p className="text-sm text-red-500">{errors.nearestStore}</p>
              )}
            </div>

            {/* Orders Received (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="ordersReceived">Orders Received</Label>
              <Input
                id="ordersReceived"
                value={location.ordersReceived}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
              <div className="space-y-0.5">
                <Label htmlFor="status">Status</Label>
                <p className="text-sm text-gray-500">
                  {formData.status ? 'Location is active and accepting orders' : 'Location is inactive'}
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked }))}
                disabled={loading}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Location'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
