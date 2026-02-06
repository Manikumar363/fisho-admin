import React, { useState, useEffect } from 'react';
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

interface AddLocationProps {
  onBack: () => void;
  onSave: (location: {
    id: string;
    code: string;
    locationName: string;
    deliveryType: string[];
    nearestStore: string;
    ordersReceived: number;
    status: 'Active' | 'Inactive';
  }) => void;
}

const stores = [
  'Fisho Marine Drive',
  'Fisho Bandra West',
  'Fisho Andheri',
  'Fisho Juhu',
  'Fisho Powai'
];

export default function AddLocation({ onBack, onSave }: AddLocationProps) {
  const [formData, setFormData] = useState({
    locationName: '',
    nearestStore: '',
    status: true
  });

  const [expressDelivery, setExpressDelivery] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<{ _id: string; name: string }[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  useEffect(() => {
    setStoresLoading(true);
    apiFetch<{ success: boolean; stores: { _id: string; name: string }[]; message?: string }>('/api/stores')
      .then(res => {
        if (res.success && Array.isArray(res.stores)) {
          setStores(res.stores);
        } else {
          setStores([]);
          toast.error(res.message || 'Failed to fetch stores');
        }
      })
      .catch(() => {
        setStores([]);
        toast.error('Failed to fetch stores');
      })
      .finally(() => setStoresLoading(false));
  }, []);

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.locationName.trim()) {
      newErrors.locationName = 'Location name is required';
    }
    if (!formData.nearestStore) {
      newErrors.nearestStore = 'Please select a store';
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
      const selectedTypes = expressDelivery
        ? ['Express Delivery']
        : ['Next Day Delivery'];

      // Prepare the payload for the API
      const payload = {
        name: formData.locationName.trim(),
        expressDelivery: expressDelivery,
        nearByStore: formData.nearestStore 
      };

      console.log('Sending payload:', payload);

      // Call the POST API with proper error handling
      const response = await apiFetch<{
        success: boolean;
        community: {
          _id: string;
          id: number;
          name: string;
          expressDelivery: boolean;
          isActive: boolean;
        };
        message?: string;
      }>(
        '/api/community',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to create community');
      }

      // Prepare the location object with API response
      const newLocation = {
        id: `LOC-${String(response.community.id).padStart(3, '0')}`,
        code: response.community._id,
        locationName: response.community.name,
        deliveryType: response.community.expressDelivery ? ['Express Delivery'] : ['Next Day Delivery'],
        nearestStore: formData.nearestStore,
        ordersReceived: 0,
        status: (response.community.isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive'
      };

      toast.success(response.message || 'Location added successfully');
      onSave(newLocation);
    } catch (error: any) {
      console.error('Error adding location:', error);
      const errorMsg = error?.message || 'Failed to add location';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={loading}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl ml-2 font-bold">Add Delivery Location</h1>
          <p className="text-gray-600 ml-2 mt-1">Create a new delivery location for your service area</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className=' text-lg font-semibold'>Location Details</CardTitle>
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
                <p className="text-sm text-red-600 font-medium">{errors.locationName}</p>
              )}
            </div>

            {/* Express Delivery */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <Checkbox
                  id="expressDelivery"
                  checked={expressDelivery}
                  onCheckedChange={(checked) => setExpressDelivery(checked as boolean)}
                  disabled={loading}
                />
                <div className="flex-1">
                  <label
                    htmlFor="expressDelivery"
                    className="cursor-pointer"
                  >
                    <p className="text-sm font-medium">Express Delivery</p>
                    <p className="text-xs text-gray-500">Enable same-day delivery service (Default: Next Day Delivery)</p>
                  </label>
                </div>
              </div>
            </div>
            {/* Nearest Store */}
            <div className="space-y-2">
              <Label htmlFor="nearestStore">
                Select Nearest Store <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.nearestStore}
                onValueChange={handleStoreChange}
                disabled={loading || storesLoading}
              >
                <SelectTrigger className={errors.nearestStore ? 'border-red-500' : ''}>
                  <SelectValue placeholder={storesLoading ? "Loading stores..." : "Select a store"} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store._id} value={store._id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nearestStore && (
                <p className="text-sm text-red-500">{errors.nearestStore}</p>
              )}
            </div>  

            {/* Status Toggle 
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
            </div>*/}

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
                    Adding...
                  </>
                ) : (
                  'Save Location'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
