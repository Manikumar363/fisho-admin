import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import AddStore from './store/AddStore';
import ViewStore from './store/ViewStore';
import EditStore from './store/EditStore';
import { apiFetch, getUserRole } from '../../lib/api';

export default function StoreMapping() {
  const [showAddStore, setShowAddStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [editingStore, setEditingStore] = useState<string | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const userRole = getUserRole();

  useEffect(() => {
    setStoresLoading(true);
    setStoresError(null);

    apiFetch<{ success: boolean; stores: any[]; message?: string }>(`/api/stores/`)
      .then(res => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch stores');
        setStores(res.stores || []);
      })
      .catch(e => {
        setStoresError(e?.message || 'Failed to load stores');
      })
      .finally(() => setStoresLoading(false));
  }, []);

  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return stores;
    const term = searchTerm.toLowerCase().trim();
    return stores.filter(store => {
      const name = store.name?.toLowerCase() || '';
      const address = store.address?.toLowerCase() || '';
      const managerName = store.manager?.name?.toLowerCase() || '';
      const managerEmail = store.manager?.email?.toLowerCase() || '';
      const contactNumber = store.contactNumber?.toLowerCase() || '';
      return (
        name.includes(term) ||
        address.includes(term) ||
        managerName.includes(term) ||
        managerEmail.includes(term) ||
        contactNumber.includes(term)
      );
    });
  }, [stores, searchTerm]);

  if (showAddStore) {
    return <AddStore 
      onBack={() => setShowAddStore(false)}
      onStoreCreated={(store) => {
        setStores(prev => [store, ...prev]);
        setShowAddStore(false);
      }}
    />;
  }

  if (editingStore) {
    return <EditStore 
      storeId={editingStore} 
      onBack={() => setEditingStore(null)}
      onStoreUpdated={(updatedStore) => {
        setStores(prev => prev.map(s => s._id === updatedStore._id ? updatedStore : s));
        setEditingStore(null);
      }}
    />;
  }

  if (selectedStore) {
    return <ViewStore storeId={selectedStore} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Store Mapping</h1>
          <p className="text-gray-600">Manage store locations and assignments</p>
        </div>
        {userRole === 'admin' && (
          <Button 
            onClick={() => setShowAddStore(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by store name, location, manager, or contact number..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Store ID</th>
                  <th className="text-left py-3 px-4">Store Name</th>
                  <th className="text-left py-3 px-4">Address</th>
                  <th className="text-left py-3 px-4">Contact Number</th>
                  <th className="text-left py-3 px-4">Manager</th>
                  <th className="text-left py-3 px-4">Manager Email</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Created At</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {storesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-600">Loading stores...</td>
                  </tr>
                ) : storesError ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-red-600">{storesError}</td>
                  </tr>
                ) : filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-500">No stores found</td>
                  </tr>
                ) : (
                  filteredStores.map((store) => (
                    <tr key={store._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(store._id);
                            toast.success('Store ID copied to clipboard');
                          }}
                          title={`Click to copy: ${store._id}`}
                        >
                          {store._id.substring(0, 8)}...
                        </button>
                      </td>
                      <td className="py-3 px-4">{store.name}</td>
                      <td className="py-3 px-4">{store.address}</td>
                      <td className="py-3 px-4">{store.phone || '—'}</td>
                      <td className="py-3 px-4">{store.manager?.name || '—'}</td>
                      <td className="py-3 px-4">{store.manager?.email || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={store.isActive ? 'default' : 'secondary'}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {userRole === 'admin' && (
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingStore(store._id)}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                          )}
                          <button 
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => setSelectedStore(store._id)}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          {userRole === 'admin' && (
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => {
                                setDeleteTargetId(store._id);
                                setShowDeleteDialog(true);
                              }}
                              disabled={isDeleting && deleteTargetId === store._id}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          )}
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
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Store</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this store? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!deleteTargetId) return;
                    setIsDeleting(true);
                    try {
                      const res = await apiFetch<{ success: boolean; message?: string }>(`/api/stores/${deleteTargetId}`, { method: 'DELETE' });
                      if (!res.success) {
                        const msg = res.message || 'Failed to delete store';
                        // close dialog then show error
                        setShowDeleteDialog(false);
                        setDeleteTargetId(null);
                        toast.error(msg);
                        return;
                      }
                      setStores(prev => prev.filter(s => s._id !== deleteTargetId));
                      // close dialog first so toast is visible above other content
                      setShowDeleteDialog(false);
                      setDeleteTargetId(null);
                      toast.success(res.message || 'Store deleted successfully');
                    } catch (err: any) {
                      console.error('Delete store error:', err);
                      // err may be an ApiError with {status, message} or something else
                      const msg = err?.message || (typeof err === 'string' ? err : 'Failed to delete store');
                      setShowDeleteDialog(false);
                      setDeleteTargetId(null);
                      toast.error(msg);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    </div>
  );
}
