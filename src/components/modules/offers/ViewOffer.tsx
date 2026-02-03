import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Percent, IndianRupee, Users, Tag, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
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

interface ViewOfferProps {
  offer: Offer;
  onBack: () => void;
}

export default function ViewOffer({ offer, onBack }: ViewOfferProps) {
  const [couponData, setCouponData] = useState<Offer>(offer);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCouponDetails();
  }, [offer._id]);

  const fetchCouponDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch<{
        success: boolean;
        coupon: Offer;
        message: string;
      }>(`/api/coupons/get-coupon/${offer._id}`);

      if (response.success) {
        setCouponData(response.coupon);
      } else {
        setError('Failed to fetch coupon details');
        toast.error('Failed to fetch coupon details');
      }
    } catch (err: any) {
      console.error('Error fetching coupon:', err);
      setError(err.message || 'Failed to fetch coupon details');
      toast.error(err.message || 'Failed to fetch coupon details');
    } finally {
      setLoading(false);
    }
  };

  const expiryDate = new Date(couponData.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2';
      case 'expired':
        return 'bg-red-100 text-red-700 hover:bg-red-100 px-4 py-2';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100 px-4 py-2';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100 px-4 py-2';
    }
  };

  const capitalizeFirstLetter = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const usagePercentage = couponData.totalUsageLimit > 0 
    ? ((couponData.currentUsageCount / couponData.totalUsageLimit) * 100).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="mb-1">Offer Details</h1>
            <p className="text-gray-600">Loading offer information...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">Loading coupon details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="mb-1">Offer Details</h1>
            <p className="text-gray-600">Error loading offer</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-red-500">{error}</div>
            <Button onClick={fetchCouponDetails} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="mb-1">Offer Details</h1>
          <p className="text-gray-600">View complete offer information and usage statistics</p>
        </div>
        <Badge className={getStatusBadgeClass(couponData.status)}>
          {capitalizeFirstLetter(couponData.status)}
        </Badge>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Current Usage</div>
                <div className="text-2xl font-bold">{couponData.currentUsageCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Limit</div>
                <div className="text-2xl font-bold">{couponData.totalUsageLimit}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Percent className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Usage Rate</div>
                <div className="text-2xl font-bold">{usagePercentage}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offer Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Offer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Coupon ID</p>
                  <p className="font-mono text-sm">{couponData._id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Coupon Name</p>
                  <p className="font-semibold">{couponData.couponName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Percent className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Discount Percentage</p>
                  <p className="font-semibold">{couponData.discountPercentage}%</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Minimum Order Value</p>
                  <p className="font-semibold">
                    <span className="dirham-symbol">&#xea;</span>{couponData.minimumOrderValue}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                  <p className="font-semibold">
                    {expiryDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {couponData.status === 'active' && daysUntilExpiry > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {daysUntilExpiry} days remaining
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Usage Limit per User</p>
                  <p className="font-semibold">
                    {couponData.usageLimitPerUser} {couponData.usageLimitPerUser === 1 ? 'time' : 'times'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Total Usage Limit</p>
                  <p className="font-semibold">{couponData.totalUsageLimit} uses</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Created At</p>
                  <p className="font-semibold">
                    {new Date(couponData.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Description</p>
            <p className="text-gray-800">{couponData.couponDescription}</p>
          </div>

          {couponData.applicableCategories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Applicable Categories</p>
              <div className="flex flex-wrap gap-2">
                {couponData.applicableCategories.map((category, index) => (
                  <Badge key={index} variant="outline" className="text-blue-600 border-blue-600">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {couponData.excludedProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Excluded Products</p>
              <div className="flex flex-wrap gap-2">
                {couponData.excludedProducts.map((product, index) => (
                  <Badge key={index} variant="outline" className="text-red-600 border-red-600">
                    {product}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
