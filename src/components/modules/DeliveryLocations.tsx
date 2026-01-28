import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Eye, Loader, Filter } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';
import AddLocation from './delivery/AddLocation';
import EditLocation from './delivery/EditLocation';

interface DeliveryLocation {
  id: string;
  code: string;
  locationName: string;
  deliveryType: string[];
  nearestStore: string;
  ordersReceived: number;
  status: 'Active' | 'Inactive';
}

interface ApiCommunity {
  _id: string;
  id: number;
  name: string;
  expressDelivery: boolean;
  isActive: boolean;
  nearByStore?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryLocations() {
  const navigate = useNavigate();
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<DeliveryLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewData, setViewData] = useState<ApiCommunity | null>(null);
  const [viewCode, setViewCode] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    deliveryType: '',
    status: '',
    sortBy: 'name-asc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Store list of stores
  const [stores, setStores] = useState<{ _id: string; name: string }[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);

  // Store raw communities
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);

  // Fetch stores
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

  // Fetch communities
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<{ success: boolean; communities: ApiCommunity[]; message?: string }>(
          '/api/community'
        );
        if (!mounted) return;
        setCommunities(data?.communities || []);
      } catch (e: any) {
        if (!mounted) return;
        const status = e?.status;
        const msg = e?.message || 'Failed to load communities';
        setError(msg);
        toast.error(msg);
        if (status === 401) {
          navigate('/login');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Map communities to locations with store name
  useEffect(() => {
    const mapped: DeliveryLocation[] = (communities || []).map((c) => {
      const storeObj = c.nearByStore
        ? stores.find(s => s._id === c.nearByStore)
        : null;
      const storeName = storeObj ? storeObj.name : (typeof c.nearByStore === 'string' ? c.nearByStore : '-');
      return {
        id: `LOC-${String(c.id ?? c._id).padStart(3, '0')}`,
        code: String(c._id || ''),
        locationName: c.name,
        deliveryType: c.expressDelivery ? ['Express Delivery'] : ['Next Day Delivery'],
        nearestStore: storeName,
        ordersReceived: 0,
        status: c.isActive ? 'Active' : 'Inactive',
      };
    });
    setLocations(mapped);
  }, [communities, stores]);

  const handleAddLocation = (newLocation: {
    id: string;
    code: string;
    locationName: string;
    deliveryType: string[];
    nearestStore: string;
    ordersReceived: number;
    status: 'Active' | 'Inactive';
  }) => {
    setLocations([...locations, newLocation]);
    setShowAddLocation(false);
    toast.success('Location added successfully');
  };

  const handleEditLocation = (updatedLocation: Omit<DeliveryLocation, 'code'> & { code?: string }) => {
    const locationToUpdate: DeliveryLocation = {
      ...updatedLocation,
      code: updatedLocation.code || editingLocation?.code || ''
    };
    setLocations(locations.map(location => 
      location.id === locationToUpdate.id ? locationToUpdate : location
    ));
    setEditingLocation(null);
    toast.success('Location updated successfully');
  };

  const handleDeleteLocation = (location: DeliveryLocation) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!locationToDelete?.code) return;

    setDeleteLoading(true);
    try {
      const response = await apiFetch<{
        success: boolean;
        community: any;
        message?: string;
      }>(
        `/api/community/${locationToDelete.code}`,
        {
          method: 'DELETE'
        }
      );

      // Remove from local state
      setLocations(locations.filter(location => location.code !== locationToDelete.code));
      toast.success(response.message || 'Location deleted successfully');
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to delete location';
      toast.error(errorMsg);
      console.error('Error deleting location:', err);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const getDeliveryTypeDisplay = (types: string[]) => {
    if (types.length === 2) {
      return 'Both';
    }
    return types[0]?.replace(' Delivery', '') || '';
  };

  const clearFilters = () => {
    setFilters({
      deliveryType: '',
      status: '',
      sortBy: 'name-asc'
    });
  };

  const hasActiveFilters = () => {
    return filters.deliveryType !== '' || filters.status !== '' || filters.sortBy !== 'name-asc';
  };

  const filteredLocations = useMemo(() => {
    let filtered = locations.filter(location =>
      location.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.nearestStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply delivery type filter
    if (filters.deliveryType) {
      if (filters.deliveryType === 'both') {
        filtered = filtered.filter(location => location.deliveryType.length === 2);
      } else if (filters.deliveryType === 'express') {
        filtered = filtered.filter(location => 
          location.deliveryType.includes('Express Delivery') && location.deliveryType.length === 1
        );
      } else if (filters.deliveryType === 'next-day') {
        filtered = filtered.filter(location => 
          location.deliveryType.includes('Next Day Delivery') && location.deliveryType.length === 1
        );
      }
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(location => 
        location.status.toLowerCase() === filters.status
      );
    }

    // Apply sorting
    const sorted = [...filtered];
    if (filters.sortBy === 'name-asc') {
      sorted.sort((a, b) => a.locationName.localeCompare(b.locationName, undefined, { sensitivity: 'base' }));
    } else if (filters.sortBy === 'name-desc') {
      sorted.sort((a, b) => b.locationName.localeCompare(a.locationName, undefined, { sensitivity: 'base' }));
    }

    return sorted;
  }, [locations, searchQuery, filters]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  
  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLocations.slice(startIndex, endIndex);
  }, [filteredLocations, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const openView = async (code: string) => {
    setViewCode(code);
    setViewOpen(true);
    setViewLoading(true);
    setViewError(null);
    setViewData(null);
    try {
      const res = await apiFetch<{ success: boolean; community: ApiCommunity; message?: string }>(
        `/api/community/${code}`
      );
      setViewData(res.community);
    } catch (e: any) {
      const status = e?.status;
      const msg = e?.message || 'Failed to fetch community';
      setViewError(msg);
      toast.error(msg);
      if (status === 401) navigate('/login');
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewCode(null);
    setViewData(null);
    setViewError(null);
    setViewLoading(false);
  };

  if (showAddLocation) {
    return <AddLocation onBack={() => setShowAddLocation(false)} onSave={handleAddLocation} />;
  }

  if (editingLocation) {
    return <EditLocation location={editingLocation} onBack={() => setEditingLocation(null)} onSave={handleEditLocation} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Delivery Location Management</h1>
          <p className="text-gray-600">Manage delivery locations and service areas</p>
        </div>
        <Button 
          onClick={() => setShowAddLocation(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by location name, store, or location ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowFilterModal(true)}
              className={hasActiveFilters() ? 'border-blue-600 text-blue-600' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {hasActiveFilters() && <span className="ml-1 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Active</span>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading communities…</div>
            ) : (
              <div style={{ maxHeight: 400, overflow: 'auto' }}>
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Location ID</th>
                      <th className="text-left py-3 px-4">Location Name</th>
                      <th className="text-left py-3 px-4">Delivery Type</th>
                      <th className="text-left py-3 px-4">Nearest Store</th>
                      <th className="text-left py-3 px-4">Orders Received</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {error ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-red-600">{error}</td>
                      </tr>
                    ) : paginatedLocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">
                          No locations found
                        </td>
                      </tr>
                    ) : (
                      paginatedLocations.map((location) => (
                        <tr key={location.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{location.id}</td>
                          <td className="py-3 px-4">{location.locationName}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                location.deliveryType.length === 2
                                  ? 'border-blue-600 text-blue-600'
                                  : location.deliveryType[0] === 'Express Delivery'
                                  ? 'border-orange-600 text-orange-600'
                                  : 'border-green-600 text-green-600'
                              }
                            >
                              {getDeliveryTypeDisplay(location.deliveryType)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{location.nearestStore}</td>
                          <td className="py-3 px-4">{location.ordersReceived}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={location.status === 'Active' ? 'default' : 'secondary'}
                              className={
                                location.status === 'Active'
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                              }
                            >
                              {location.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => location.code ? openView(location.code) : toast.error('No community id available')}
                                disabled={!location.code}
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLocation(location)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLocation(location)}
                                disabled={deleteLoading}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && !error && filteredLocations.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLocations.length)} of {filteredLocations.length} locations
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-gray-900">"{locationToDelete?.locationName}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-70"
            >
              {deleteLoading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Location Dialog */}
      <Dialog open={viewOpen} onOpenChange={(o) => (o ? setViewOpen(true) : closeView())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Community Details</DialogTitle>
            <DialogDescription>View delivery location information</DialogDescription>
          </DialogHeader>

          {viewLoading && <div className="py-4 text-gray-500">Loading…</div>}
          {!viewLoading && viewError && (
            <div className="py-2 text-red-600">{viewError}</div>
          )}
          {!viewLoading && !viewError && viewData && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name</span>
                <span className="font-medium">{viewData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Express Delivery</span>
                <span className="font-medium">{viewData.expressDelivery ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium">{viewData.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Numeric ID</span>
                <span className="font-medium">{viewData.id}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeView}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="deliveryType" className="text-sm font-medium">Delivery Type</label>
              <select
                id="deliveryType"
                value={filters.deliveryType}
                onChange={(e) => setFilters({ ...filters, deliveryType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Delivery Types</option>
                <option value="express">Express Delivery</option>
                <option value="next-day">Next Day Delivery</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Sort By</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="name-asc"
                    name="sortBy"
                    value="name-asc"
                    checked={filters.sortBy === 'name-asc'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="name-asc" className="text-sm font-normal cursor-pointer">
                    Name (A-Z)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="name-desc"
                    name="sortBy"
                    value="name-desc"
                    checked={filters.sortBy === 'name-desc'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor="name-desc" className="text-sm font-normal cursor-pointer">
                    Name (Z-A)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters()}
            >
              Clear Filters
            </Button>
            <Button 
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowFilterModal(false)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
