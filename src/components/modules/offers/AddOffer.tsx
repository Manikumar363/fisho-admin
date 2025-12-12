import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';

interface AddOfferProps {
  onBack: () => void;
  onSave: (offer: {
    couponName: string;
    couponDescription: string;
    discountPercentage: number;
    minOrderValue: number;
    expiryDate: string;
    usageLimit: number;
  }) => void;
}

export default function AddOffer({ onBack, onSave }: AddOfferProps) {
  const [formData, setFormData] = useState({
    couponName: '',
    couponDescription: '',
    discountPercentage: '',
    minOrderValue: '',
    expiryDate: '',
    usageLimit: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.minOrderValue) {
      newErrors.minOrderValue = 'Minimum order value is required';
    } else if (Number(formData.minOrderValue) < 0) {
      newErrors.minOrderValue = 'Minimum order value must be positive';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (new Date(formData.expiryDate) < new Date()) {
      newErrors.expiryDate = 'Expiry date must be in the future';
    }

    if (!formData.usageLimit) {
      newErrors.usageLimit = 'Usage limit is required';
    } else if (Number(formData.usageLimit) <= 0) {
      newErrors.usageLimit = 'Usage limit must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    onSave({
      couponName: formData.couponName.trim(),
      couponDescription: formData.couponDescription.trim(),
      discountPercentage: Number(formData.discountPercentage),
      minOrderValue: Number(formData.minOrderValue),
      expiryDate: formData.expiryDate,
      usageLimit: Number(formData.usageLimit)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="mb-1">Add New Offer</h1>
          <p className="text-gray-600">Create a new discount offer or coupon</p>
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
                />
                {errors.discountPercentage && (
                  <p className="text-sm text-red-500">{errors.discountPercentage}</p>
                )}
              </div>

              {/* Minimum Order Value */}
              <div className="space-y-2">
                <Label htmlFor="minOrderValue">
                  Minimum Order Value (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="minOrderValue"
                  name="minOrderValue"
                  type="number"
                  placeholder="e.g., 500"
                  min="0"
                  value={formData.minOrderValue}
                  onChange={handleChange}
                  className={errors.minOrderValue ? 'border-red-500' : ''}
                />
                {errors.minOrderValue && (
                  <p className="text-sm text-red-500">{errors.minOrderValue}</p>
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
                />
                {errors.expiryDate && (
                  <p className="text-sm text-red-500">{errors.expiryDate}</p>
                )}
              </div>

              {/* Usage Limit per User */}
              <div className="space-y-2">
                <Label htmlFor="usageLimit">
                  Usage Limit per User <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  placeholder="e.g., 3"
                  min="1"
                  value={formData.usageLimit}
                  onChange={handleChange}
                  className={errors.usageLimit ? 'border-red-500' : ''}
                />
                {errors.usageLimit && (
                  <p className="text-sm text-red-500">{errors.usageLimit}</p>
                )}
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
              />
              {errors.couponDescription && (
                <p className="text-sm text-red-500">{errors.couponDescription}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Save Offer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
