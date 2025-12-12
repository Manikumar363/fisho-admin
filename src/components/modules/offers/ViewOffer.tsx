import React from 'react';
import { ArrowLeft, Calendar, Percent, IndianRupee, Users, Tag, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

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

interface ViewOfferProps {
  offer: Offer;
  onBack: () => void;
}

// Mock data for users who availed the offer
const generateMockUsers = (count: number) => {
  const users = [];
  const names = ['Rajesh Kumar', 'Priya Sharma', 'Mohammed Ali', 'Anjali Patel', 'Suresh Nair', 
                 'Deepika Singh', 'Arjun Reddy', 'Meera Krishnan', 'Vikram Mehta', 'Pooja Desai'];
  
  for (let i = 0; i < Math.min(count, 20); i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    users.push({
      id: `USR-${String(i + 1).padStart(4, '0')}`,
      name: names[i % names.length],
      orderId: `ORD-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: `₹${Math.floor(Math.random() * 5000) + 500}`
    });
  }
  
  return users;
};

export default function ViewOffer({ offer, onBack }: ViewOfferProps) {
  const users = generateMockUsers(offer.totalUsersAvailed);
  
  const expiryDate = new Date(offer.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

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
        <Badge
          variant={offer.status === 'Active' ? 'default' : 'secondary'}
          className={
            offer.status === 'Active'
              ? 'bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-100 px-4 py-2'
          }
        >
          {offer.status}
        </Badge>
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
                  <p className="text-sm text-gray-600 mb-1">Offer ID</p>
                  <p>{offer.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Coupon Name</p>
                  <p>{offer.couponName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Percent className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Discount Percentage</p>
                  <p>{offer.discountPercentage}%</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Minimum Order Value</p>
                  <p>₹{offer.minOrderValue}</p>
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
                  <p>
                    {expiryDate.toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {offer.status === 'Active' && daysUntilExpiry > 0 && (
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
                  <p>{offer.usageLimit} {offer.usageLimit === 1 ? 'time' : 'times'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Total Users Availed</p>
                  <p>{offer.totalUsersAvailed} users</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Description</p>
            <p className="text-gray-800">{offer.couponDescription}</p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usage Statistics</CardTitle>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {offer.totalUsersAvailed} Total Users
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {offer.totalUsersAvailed === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No users have availed this offer yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">User ID</th>
                    <th className="text-left py-3 px-4">User Name</th>
                    <th className="text-left py-3 px-4">Order ID</th>
                    <th className="text-left py-3 px-4">Order Amount</th>
                    <th className="text-left py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{user.id}</td>
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.orderId}</td>
                      <td className="py-3 px-4">{user.amount}</td>
                      <td className="py-3 px-4">{user.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {offer.totalUsersAvailed > 20 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Showing 20 of {offer.totalUsersAvailed} users
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
