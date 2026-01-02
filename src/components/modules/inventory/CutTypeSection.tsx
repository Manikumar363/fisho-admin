import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { Label } from '../../ui/label';
import { apiFetch } from '../../../lib/api';
import { toast } from 'react-toastify';

interface CutType {
  id: string;
  name: string;
  slug: string;
  order: number;
  status: 'Active' | 'Inactive';
  isDeleted: boolean;
  dateCreated: string;
  lastUpdated: string;
}

const mapCutType = (ct: any): CutType => ({
  id: ct._id,
  name: ct.name,
  slug: ct.slug || 'N/A',
  order: ct.order ?? 0,
  status: ct.isActive ? 'Active' : 'Inactive',
  isDeleted: Boolean(ct.isDeleted),
  dateCreated: new Date(ct.createdAt).toISOString().split('T')[0],
  lastUpdated: new Date(ct.updatedAt).toISOString().split('T')[0],
});

type CutTypeSectionProps = {
  openAdd?: boolean;
  onAddClose?: () => void;
  resetAdd?: () => void;
};

export default function CutTypeSection({ openAdd, onAddClose, resetAdd }: CutTypeSectionProps) {
  const [cutTypes, setCutTypes] = useState<CutType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCutType, setEditingCutType] = useState<CutType | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCutType, setDeletingCutType] = useState<CutType | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingCutType, setViewingCutType] = useState<CutType | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const fetchCutTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        cutTypes?: Array<{
          _id: string;
          name: string;
          order: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        }>;
        message?: string;
      }>('/api/cuttype');

      if (!res?.success) throw new Error(res?.message || 'Failed to fetch cut types');

      setCutTypes((res.cutTypes || []).map(mapCutType));
    } catch (e: any) {
      const msg = e?.message || 'Failed to load cut types';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutTypes();
  }, []);

  // Open add dialog when parent triggers
  useEffect(() => {
    if (openAdd) {
      setAddOpen(true);
    } else {
      setAddOpen(false);
    }
  }, [openAdd]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cutTypes;
    return cutTypes.filter((ct) => ct.name.toLowerCase().includes(q));
  }, [cutTypes, searchQuery]);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        cutType?: {
          _id: string;
          name: string;
          order: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        };
        message?: string;
      }>(
        '/api/cuttype',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }
      );

      if (!res?.success || !res.cutType) throw new Error(res?.message || 'Failed to create cut type');

      const created = mapCutType(res.cutType);
      setCutTypes((prev) => [created, ...prev]);
      setNewName('');
      setAddOpen(false);
      toast.success(res.message || 'Cut type created successfully');
    } catch (e: any) {
      const msg = e?.message || 'Failed to create cut type';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingCutType) return;
    const name = editName.trim();
    if (!name) {
      toast.error('Name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        cutType?: {
          _id: string;
          name: string;
          order: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        };
        message?: string;
      }>(
        `/api/cuttype/${editingCutType.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }
      );

      if (!res?.success || !res.cutType) throw new Error(res?.message || 'Failed to update cut type');

      const updated = mapCutType(res.cutType);
      setCutTypes((prev) => prev.map((ct) => (ct.id === updated.id ? updated : ct)));
      setEditName('');
      setEditingCutType(null);
      setEditOpen(false);
      toast.success(res.message || 'Cut type updated successfully');
    } catch (e: any) {
      const msg = e?.message || 'Failed to update cut type';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (cutType: CutType) => {
    setEditingCutType(cutType);
    setEditName(cutType.name);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCutType) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        cutType?: {
          _id: string;
          name: string;
          order: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        };
        message?: string;
      }>(
        `/api/cuttype/${deletingCutType.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!res?.success) throw new Error(res?.message || 'Failed to delete cut type');

      setCutTypes((prev) => prev.filter((ct) => ct.id !== deletingCutType.id));
      setDeletingCutType(null);
      setDeleteOpen(false);
      toast.success(res.message || 'Cut type deleted successfully');
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete cut type';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (cutType: CutType) => {
    setDeletingCutType(cutType);
    setDeleteOpen(true);
  };

  const fetchCutTypeById = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        cutType?: {
          _id: string;
          name: string;
          order: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        };
        message?: string;
      }>(`/api/cuttype/${id}`);

      if (!res?.success || !res.cutType) throw new Error(res?.message || 'Failed to fetch cut type');

      const mapped = mapCutType(res.cutType);
      setViewingCutType(mapped);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load cut type details';
      toast.error(msg);
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openViewDialog = (cutType: CutType) => {
    setViewOpen(true);
    setViewingCutType(cutType);
    fetchCutTypeById(cutType.id);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search cut types..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Cut Types ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Serial No</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      <div className="inline-flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading cut types...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-red-600">{error}</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">No cut types found</td>
                  </tr>
                ) : (
                  filtered.map((ct, index) => (
                    <tr key={ct.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4 font-medium">{ct.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="View cut type"
                            onClick={() => openViewDialog(ct)}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit cut type"
                            onClick={() => openEditDialog(ct)}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Delete cut type"
                            onClick={() => openDeleteDialog(ct)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onOpenChange={(next) => {
          setAddOpen(next);
          if (!next) onAddClose?.();
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Cut Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cutTypeName">Name *</Label>
              <Input
                id="cutTypeName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Whole Cut"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddOpen(false);
                onAddClose?.();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-fit px-3 text-sm"
              onClick={async () => {
                await handleAdd();
                resetAdd?.();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Add Cut Type'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) {
            setEditingCutType(null);
            setEditName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Cut Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCutTypeName">Name *</Label>
              <Input
                id="editCutTypeName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Whole Cut"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditingCutType(null);
                setEditName('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 w-fit px-3 text-sm" onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Cut Type'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={viewOpen}
        onOpenChange={(next) => {
          setViewOpen(next);
          if (!next) setViewingCutType(null);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Cut Type Details</DialogTitle>
          </DialogHeader>
          {viewLoading ? (
            <div className="py-8 text-center text-gray-500">
              <div className="inline-flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Loading details...
              </div>
            </div>
          ) : viewingCutType ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-600">Name</Label>
                <p className="text-sm font-medium mt-1">{viewingCutType.name}</p>
              </div>
              <div>
                <Label className="text-gray-600">Last Updated</Label>
                <p className="text-sm mt-1">{viewingCutType.lastUpdated}</p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the cut type "{deletingCutType?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
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
