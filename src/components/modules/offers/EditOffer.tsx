import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'react-toastify';
import { apiFetch } from '../../../lib/api';

interface Offer {
  _id: string;
  couponName: string;
  couponDescription: string;
  discountPercentage: number;
  minimumOrderValue: number;
  expiryDate: string;
  usageLimitPerUser: number;
  totalUsageLimit: number;
  currentUsageCount: number;
  status: 'active' | 'inactive' | 'expired';
  applicableCategories: string[];
  excludedProducts: string[];
  createdAt: string;
  updatedAt: string;
}

interface EditOfferProps {
  offer: Offer;
  onBack: () => void;
  onSave: (offer: Offer) => void;
}

export default function EditOffer({ offer, onBack, onSave }: EditOfferProps) {
  const [formData, setFormData] = useState({
    couponName: offer.couponName,
    couponDescription: offer.couponDescription,
    discountPercentage: String(offer.discountPercentage),
    minimumOrderValue: String(offer.minimumOrderValue),
    expiryDate: offer.expiryDate.split('T')[0], // Format to YYYY-MM-DD
    usageLimitPerUser: String(offer.usageLimitPerUser),
    totalUsageLimit: String(offer.totalUsageLimit),
    status: offer.status
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.couponName.trim()) {
      newErrors.couponName = 'Coupon name is required';
    }

    if (!formData.couponDescription.trim()) {
      newErrors.couponDescription = 'Coupon description is required';
    }

    if (!formData.discountPercentage) {
      newErrors.discountPercentage = 'Discount percentage is required';
    } else if (Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 100) {
      newErrors.discountPercentage = 'Discount must be between 1 and 100';
    }

    if (!formData.minimumOrderValue) {
      newErrors.minimumOrderValue = 'Minimum order value is required';
    } else if (Number(formData.minimumOrderValue) < 0) {
      newErrors.minimumOrderValue = 'Minimum order value must be positive';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }

    if (!formData.usageLimitPerUser) {
      newErrors.usageLimitPerUser = 'Usage limit per user is required';
    } else if (Number(formData.usageLimitPerUser) <= 0) {
      newErrors.usageLimitPerUser = 'Usage limit must be greater than 0';
    }

    if (!formData.totalUsageLimit) {
      newErrors.totalUsageLimit = 'Total usage limit is required';
    } else if (Number(formData.totalUsageLimit) <= 0) {
      newErrors.totalUsageLimit = 'Total usage limit must be greater than 0';
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

    setIsSubmitting(true);
    try {
      const updateData = {
        couponName: formData.couponName.trim(),
        couponDescription: formData.couponDescription.trim(),
        discountPercentage: Number(formData.discountPercentage),
        minimumOrderValue: Number(formData.minimumOrderValue),
        expiryDate: formData.expiryDate,
        usageLimitPerUser: Number(formData.usageLimitPerUser),
        totalUsageLimit: Number(formData.totalUsageLimit),
        status: formData.status
      };

      const response = await apiFetch<{
        success: boolean;
        coupon: Offer;
        message: string;
      }>(`/api/coupons/update-coupon/${offer._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      if (response.success) {
        toast.success(response.message || 'Offer updated successfully');
        onSave(response.coupon);
      } else {
        toast.error('Failed to update offer');
      }
    } catch (error: any) {
      console.error('Error updating offer:', error);
      toast.error(error.message || 'Failed to update offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="mb-1">Edit Offer</h1>
          <p className="text-gray-600">Update offer details - {offer.couponName}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Name */}
              <div className="space-y-2">
                <Label htmlFor="couponName">
                  Coupon Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="couponName"
                  name="couponName"
                  placeholder="e.g., FISHO50"
                  value={formData.couponName}
                  onChange={handleChange}
                  className={errors.couponName ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.couponName && (
                  <p className="text-sm text-red-500">{errors.couponName}</p>
                )}
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">
                  Discount Percentage <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="discountPercentage"
                  name="discountPercentage"
                  type="number"
                  placeholder="e.g., 20"
                  min="1"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={handleChange}
                  className={errors.discountPercentage ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.discountPercentage && (
                  <p className="text-sm text-red-500">{errors.discountPercentage}</p>
                )}
              </div>

              {/* Minimum Order Value */}
              <div className="space-y-2">
                <Label htmlFor="minimumOrderValue">
                  Minimum Order Value (<span className="dirham-symbol">&#xea;</span>) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="minimumOrderValue"
                  name="minimumOrderValue"
                  type="number"
                  placeholder="e.g., 500"
                  min="0"
                  value={formData.minimumOrderValue}
                  onChange={handleChange}
                  className={errors.minimumOrderValue ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.minimumOrderValue && (
                  <p className="text-sm text-red-500">{errors.minimumOrderValue}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Expiry Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className={errors.expiryDate ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-500">{errors.expiryDate}</p>
                )}
              </div>

              {/* Usage Limit per User */}
              <div className="space-y-2">
                <Label htmlFor="usageLimitPerUser">
                  Usage Limit per User <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usageLimitPerUser"
                  name="usageLimitPerUser"
                  type="number"
                  placeholder="e.g., 3"
                  min="1"
                  value={formData.usageLimitPerUser}
                  onChange={handleChange}
                  className={errors.usageLimitPerUser ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.usageLimitPerUser && (
                  <p className="text-sm text-red-500">{errors.usageLimitPerUser}</p>
                )}
              </div>

              {/* Total Usage Limit */}
              <div className="space-y-2">
                <Label htmlFor="totalUsageLimit">
                  Total Usage Limit <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalUsageLimit"
                  name="totalUsageLimit"
                  type="number"
                  placeholder="e.g., 1000"
                  min="1"
                  value={formData.totalUsageLimit}
                  onChange={handleChange}
                  className={errors.totalUsageLimit ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.totalUsageLimit && (
                  <p className="text-sm text-red-500">{errors.totalUsageLimit}</p>
                )}
              </div>

              {/* Current Usage Count (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="currentUsageCount">Current Usage Count</Label>
                <Input
                  id="currentUsageCount"
                  value={offer.currentUsageCount}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as 'active' | 'inactive' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coupon Description */}
            <div className="space-y-2">
              <Label htmlFor="couponDescription">
                Coupon Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="couponDescription"
                name="couponDescription"
                placeholder="Enter a detailed description of the offer..."
                value={formData.couponDescription}
                onChange={handleChange}
                rows={4}
                className={errors.couponDescription ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {errors.couponDescription && (
                <p className="text-sm text-red-500">{errors.couponDescription}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Offer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
