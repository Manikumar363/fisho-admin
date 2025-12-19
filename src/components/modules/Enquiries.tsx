import React, { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Loader } from 'lucide-react';
import { apiFetch } from '../../lib/api';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  const fetchEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        querys?: Array<{
          _id: string;
          firstName: string;
          lastName: string;
          platform?: string;
          email: string;
          phone: string;
          message: string;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
        }>;
        message?: string;
      }>('/api/query/get-all');

      if (!res?.success) throw new Error(res?.message || 'Failed to fetch enquiries');

      const mapped = (res.querys || [])
        .filter(q => !q.isDeleted)
        .map(q => ({
          id: q._id,
          date: new Date(q.createdAt).toISOString().split('T')[0],
          name: `${q.firstName} ${q.lastName}`.trim(),
          email: q.email,
          mobile: q.phone,
          platform: (q.platform || 'Web') as 'Web' | 'Mobile',
          message: q.message,
        }));

      setEnquiries(mapped);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load enquiries';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDeleteEnquiry = (enquiryId: string) => {
    setEnquiryToDelete(enquiryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!enquiryToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        query?: {
          _id: string;
          isDeleted: boolean;
        };
        message?: string;
      }>(`/api/query/delete-query/${enquiryToDelete}`, {
        method: 'DELETE',
      });

      if (!res?.success) throw new Error(res?.message || 'Failed to delete enquiry');

      setEnquiries(enquiries.filter(enquiry => enquiry.id !== enquiryToDelete));
      toast.success(res.message || 'Enquiry deleted successfully');
      setDeleteDialogOpen(false);
      setEnquiryToDelete(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete enquiry';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
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
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading enquiries...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : filteredEnquiries.length > 0 ? (
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Deleting...
                </span>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
