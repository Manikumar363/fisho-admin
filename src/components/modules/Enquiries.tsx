import React, { useState } from 'react';
import { Search, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
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

interface Enquiry {
  id: string;
  date: string;
  name: string;
  email: string;
  mobile: string;
  platform: 'Web' | 'Mobile';
  message: string;
  subject?: string;
}

export default function Enquiries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([
    {
      id: 'ENQ-001',
      date: '2025-12-16',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      mobile: '+91 98765 43210',
      platform: 'Web',
      subject: 'Bulk Order Inquiry',
      message: 'I am interested in placing a bulk order for fresh prawns. Can you provide pricing for 50kg and delivery options to South Mumbai?'
    },
    {
      id: 'ENQ-002',
      date: '2025-12-16',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      mobile: '+91 87654 32109',
      platform: 'Mobile',
      subject: 'Product Availability',
      message: 'Do you have fresh salmon available? Also, what are your delivery timings for Bandra area?'
    },
    {
      id: 'ENQ-003',
      date: '2025-12-15',
      name: 'Amit Patel',
      email: 'amit.patel@example.com',
      mobile: '+91 76543 21098',
      platform: 'Web',
      subject: 'Partnership Opportunity',
      message: 'I run a restaurant in Juhu and would like to discuss a potential partnership for regular seafood supply. Please contact me at your earliest convenience.'
    },
    {
      id: 'ENQ-004',
      date: '2025-12-15',
      name: 'Sneha Desai',
      email: 'sneha.desai@example.com',
      mobile: '+91 65432 10987',
      platform: 'Mobile',
      subject: 'Delivery Issue',
      message: 'I placed an order yesterday but haven\'t received any update on delivery status. Order ID: ORD-12345'
    },
    {
      id: 'ENQ-005',
      date: '2025-12-14',
      name: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      mobile: '+91 54321 09876',
      platform: 'Web',
      subject: 'Product Quality Feedback',
      message: 'The pomfret I received was excellent quality. Would like to know if you offer a subscription service for weekly deliveries?'
    },
    {
      id: 'ENQ-006',
      date: '2025-12-14',
      name: 'Anjali Mehta',
      email: 'anjali.mehta@example.com',
      mobile: '+91 43210 98765',
      platform: 'Mobile',
      subject: 'Refund Request',
      message: 'I received a damaged product in my last order. Need assistance with refund process.'
    },
    {
      id: 'ENQ-007',
      date: '2025-12-13',
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      mobile: '+91 32109 87654',
      platform: 'Web',
      subject: 'Franchise Inquiry',
      message: 'Interested in opening a Fisho franchise in Pune. Would like to know more about franchise opportunities and requirements.'
    },
    {
      id: 'ENQ-008',
      date: '2025-12-13',
      name: 'Kavita Reddy',
      email: 'kavita.reddy@example.com',
      mobile: '+91 21098 76543',
      platform: 'Mobile',
      subject: 'App Technical Issue',
      message: 'Unable to apply discount coupon on mobile app. Getting error message. Please help.'
    },
    {
      id: 'ENQ-009',
      date: '2025-12-12',
      name: 'Suresh Nair',
      email: 'suresh.nair@example.com',
      mobile: '+91 10987 65432',
      platform: 'Web',
      subject: 'Custom Order Request',
      message: 'Need 30kg of cleaned and marinated fish for a family function on Dec 25th. Can you arrange?'
    },
    {
      id: 'ENQ-010',
      date: '2025-12-12',
      name: 'Meera Iyer',
      email: 'meera.iyer@example.com',
      mobile: '+91 09876 54321',
      platform: 'Mobile',
      subject: 'Payment Gateway Issue',
      message: 'Payment was deducted from my account but order status shows failed. Need urgent resolution.'
    }
  ]);

  const handleDeleteEnquiry = (enquiryId: string) => {
    setEnquiryToDelete(enquiryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (enquiryToDelete) {
      setEnquiries(enquiries.filter(enquiry => enquiry.id !== enquiryToDelete));
      toast.success('Enquiry deleted successfully');
    }
    setDeleteDialogOpen(false);
    setEnquiryToDelete(null);
  };

  const filteredEnquiries = enquiries.filter(enquiry =>
    enquiry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enquiry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    enquiry.mobile.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-gray-900">Enquiries</h1>
          <p className="text-gray-500">Manage customer enquiries and support requests</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, email, or mobile number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-gray-600">Mobile Number</th>
                  <th className="px-6 py-4 text-left text-gray-600">Platform</th>
                  <th className="px-6 py-4 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEnquiries.length > 0 ? (
                  filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-900">
                        {formatDate(enquiry.date)}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {enquiry.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {enquiry.email}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {enquiry.mobile}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={enquiry.platform === 'Web' ? 'default' : 'secondary'}
                          className={
                            enquiry.platform === 'Web'
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                          }
                        >
                          {enquiry.platform}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingEnquiry(enquiry)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEnquiry(enquiry.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No enquiries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Enquiry Dialog */}
      <Dialog open={viewingEnquiry !== null} onOpenChange={() => setViewingEnquiry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
            <DialogDescription>
              View complete enquiry information
            </DialogDescription>
          </DialogHeader>
          {viewingEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Enquiry ID</label>
                  <p className="text-gray-900">{viewingEnquiry.id}</p>
                </div>
                <div>
                  <label className="text-gray-600">Date</label>
                  <p className="text-gray-900">{formatDate(viewingEnquiry.date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Name</label>
                  <p className="text-gray-900">{viewingEnquiry.name}</p>
                </div>
                <div>
                  <label className="text-gray-600">Platform</label>
                  <Badge
                    variant={viewingEnquiry.platform === 'Web' ? 'default' : 'secondary'}
                    className={
                      viewingEnquiry.platform === 'Web'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                    }
                  >
                    {viewingEnquiry.platform}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600">Email</label>
                  <p className="text-gray-900">{viewingEnquiry.email}</p>
                </div>
                <div>
                  <label className="text-gray-600">Mobile Number</label>
                  <p className="text-gray-900">{viewingEnquiry.mobile}</p>
                </div>
              </div>

              {viewingEnquiry.subject && (
                <div>
                  <label className="text-gray-600">Subject</label>
                  <p className="text-gray-900">{viewingEnquiry.subject}</p>
                </div>
              )}

              <div>
                <label className="text-gray-600">Message</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {viewingEnquiry.message}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Enquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this enquiry? This action cannot be undone.
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
