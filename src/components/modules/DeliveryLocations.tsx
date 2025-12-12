import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import AddLocation from './delivery/AddLocation';
import EditLocation from './delivery/EditLocation';

interface DeliveryLocation {
  id: string;
  locationName: string;
  deliveryType: string[];
  nearestStore: string;
  ordersReceived: number;
  status: 'Active' | 'Inactive';
}

export default function DeliveryLocations() {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState<DeliveryLocation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [locations, setLocations] = useState<DeliveryLocation[]>([
    {
      id: 'LOC-001',
      locationName: 'Bandra West',
      deliveryType: ['Express Delivery', 'Next Day Delivery'],
      nearestStore: 'Fisho Bandra West',
      ordersReceived: 1245,
      status: 'Active'
    },
    {
      id: 'LOC-002',
      locationName: 'Andheri East',
      deliveryType: ['Express Delivery', 'Next Day Delivery'],
      nearestStore: 'Fisho Andheri',
      ordersReceived: 2103,
      status: 'Active'
    },
    {
      id: 'LOC-003',
      locationName: 'Marine Drive',
      deliveryType: ['Next Day Delivery'],
      nearestStore: 'Fisho Marine Drive',
      ordersReceived: 856,
      status: 'Active'
    },
    {
      id: 'LOC-004',
      locationName: 'Juhu',
      deliveryType: ['Express Delivery'],
      nearestStore: 'Fisho Juhu',
      ordersReceived: 743,
      status: 'Active'
    },
    {
      id: 'LOC-005',
      locationName: 'Powai',
      deliveryType: ['Next Day Delivery'],
      nearestStore: 'Fisho Powai',
      ordersReceived: 512,
      status: 'Inactive'
    },
    {
      id: 'LOC-006',
      locationName: 'Colaba',
      deliveryType: ['Express Delivery', 'Next Day Delivery'],
      nearestStore: 'Fisho Marine Drive',
      ordersReceived: 934,
      status: 'Active'
    },
    {
      id: 'LOC-007',
      locationName: 'Worli',
      deliveryType: ['Express Delivery'],
      nearestStore: 'Fisho Marine Drive',
      ordersReceived: 678,
      status: 'Active'
    },
    {
      id: 'LOC-008',
      locationName: 'Goregaon',
      deliveryType: ['Next Day Delivery'],
      nearestStore: 'Fisho Andheri',
      ordersReceived: 421,
      status: 'Active'
    },
    {
      id: 'LOC-009',
      locationName: 'Malad',
      deliveryType: ['Express Delivery', 'Next Day Delivery'],
      nearestStore: 'Fisho Andheri',
      ordersReceived: 567,
      status: 'Inactive'
    },
    {
      id: 'LOC-010',
      locationName: 'Versova',
      deliveryType: ['Express Delivery'],
      nearestStore: 'Fisho Andheri',
      ordersReceived: 823,
      status: 'Active'
    }
  ]);

  const handleAddLocation = (newLocation: Omit<DeliveryLocation, 'id' | 'ordersReceived'>) => {
    const location: DeliveryLocation = {
      id: `LOC-${String(locations.length + 1).padStart(3, '0')}`,
      ...newLocation,
      ordersReceived: 0
    };
    setLocations([...locations, location]);
    setShowAddLocation(false);
    toast.success('Location added successfully');
  };

  const handleEditLocation = (updatedLocation: DeliveryLocation) => {
    setLocations(locations.map(location => 
      location.id === updatedLocation.id ? updatedLocation : location
    ));
    setEditingLocation(null);
    toast.success('Location updated successfully');
  };

  const handleDeleteLocation = (locationId: string) => {
    setLocationToDelete(locationId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      setLocations(locations.filter(location => location.id !== locationToDelete));
      toast.success('Location deleted successfully');
    }
    setDeleteDialogOpen(false);
    setLocationToDelete(null);
  };

  const getDeliveryTypeDisplay = (types: string[]) => {
    if (types.length === 2) {
      return 'Both';
    }
    return types[0]?.replace(' Delivery', '') || '';
  };

  const filteredLocations = locations.filter(location =>
    location.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.nearestStore.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by location name, store, or location ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
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
                {filteredLocations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No locations found
                    </td>
                  </tr>
                ) : (
                  filteredLocations.map((location) => (
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
                            onClick={() => setEditingLocation(location)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location.id)}
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this delivery location? This action cannot be undone.
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
