import React, { useState } from 'react';
import { Search, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import AddStore from './store/AddStore';
import ViewStore from './store/ViewStore';

export default function StoreMapping() {
  const [showAddStore, setShowAddStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  const stores = [
    { 
      id: 'STR-001', 
      name: 'Fisho Marine Drive', 
      location: 'Marine Drive, Mumbai', 
      manager: 'Rajesh Kumar', 
      contact: '+91 98765 43210',
      revenue: '₹45,230',
      inventoryAlerts: 3,
      status: 'Active'
    },
    { 
      id: 'STR-002', 
      name: 'Fisho Bandra West', 
      location: 'Bandra West, Mumbai', 
      manager: 'Priya Sharma', 
      contact: '+91 98765 43211',
      revenue: '₹38,650',
      inventoryAlerts: 1,
      status: 'Active'
    },
    { 
      id: 'STR-003', 
      name: 'Fisho Andheri', 
      location: 'Andheri East, Mumbai', 
      manager: 'Mohammed Syed', 
      contact: '+91 98765 43212',
      revenue: '₹52,100',
      inventoryAlerts: 5,
      status: 'Active'
    },
    { 
      id: 'STR-004', 
      name: 'Fisho Juhu', 
      location: 'Juhu Beach, Mumbai', 
      manager: 'Anjali Desai', 
      contact: '+91 98765 43213',
      revenue: '₹31,890',
      inventoryAlerts: 0,
      status: 'Active'
    },
    { 
      id: 'STR-005', 
      name: 'Fisho Powai', 
      location: 'Powai, Mumbai', 
      manager: 'Suresh Nair', 
      contact: '+91 98765 43214',
      revenue: '₹28,450',
      inventoryAlerts: 2,
      status: 'Inactive'
    }
  ];

  if (showAddStore) {
    return <AddStore onBack={() => setShowAddStore(false)} />;
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
        <Button 
          onClick={() => setShowAddStore(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by store name, location, or manager..."
              className="pl-10"
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
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-left py-3 px-4">Manager</th>
                  <th className="text-left py-3 px-4">Contact Number</th>
                  <th className="text-left py-3 px-4">Today's Revenue</th>
                  <th className="text-left py-3 px-4">Inventory Alerts</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-blue-600">{store.id}</td>
                    <td className="py-3 px-4">{store.name}</td>
                    <td className="py-3 px-4">{store.location}</td>
                    <td className="py-3 px-4">{store.manager}</td>
                    <td className="py-3 px-4">{store.contact}</td>
                    <td className="py-3 px-4">{store.revenue}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        store.inventoryAlerts > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {store.inventoryAlerts}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={store.status === 'Active' ? 'default' : 'secondary'}>
                        {store.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded"
                          onClick={() => setSelectedStore(store.id)}
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
