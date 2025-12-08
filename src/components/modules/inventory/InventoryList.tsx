import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ImageWithFallback } from '../../figma/ImageWithFallback';

export default function InventoryList() {
  const inventoryItems = [
    {
      id: 1,
      name: 'Tiger Prawns',
      species: 'Prawns',
      cutType: 'Whole Cleaned',
      weight: '500g',
      deliveryTypes: ['Express', 'Next-Day'],
      actualPrice: 450,
      discountedPrice: 380,
      quantity: 125,
      status: 'In Stock',
      image: 'seafood prawns'
    },
    {
      id: 2,
      name: 'Salmon Fillet',
      species: 'Fish',
      cutType: 'Fillet',
      weight: '250g',
      deliveryTypes: ['Next-Day'],
      actualPrice: 650,
      discountedPrice: 590,
      quantity: 45,
      status: 'In Stock',
      image: 'salmon fish'
    },
    {
      id: 3,
      name: 'King Fish',
      species: 'Fish',
      cutType: 'Curry Cut',
      weight: '500g',
      deliveryTypes: ['Express', 'Next-Day'],
      actualPrice: 380,
      discountedPrice: 320,
      quantity: 8,
      status: 'Low Stock',
      image: 'fish market'
    },
    {
      id: 4,
      name: 'Mud Crab',
      species: 'Crab',
      cutType: 'Whole',
      weight: '1kg',
      deliveryTypes: ['Next-Day'],
      actualPrice: 850,
      discountedPrice: 750,
      quantity: 0,
      status: 'Out of Stock',
      image: 'crab seafood'
    },
    {
      id: 5,
      name: 'Pomfret',
      species: 'Fish',
      cutType: 'Whole Cleaned',
      weight: '500g',
      deliveryTypes: ['Express', 'Next-Day'],
      actualPrice: 420,
      discountedPrice: 380,
      quantity: 67,
      status: 'In Stock',
      image: 'fish fresh'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Inventory Items List</h1>
        <p className="text-gray-600">Comprehensive view of all inventory items</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by product name, species, or SKU..."
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Product Image</th>
                  <th className="text-left py-3 px-4">Product Name</th>
                  <th className="text-left py-3 px-4">Species</th>
                  <th className="text-left py-3 px-4">Cut Type</th>
                  <th className="text-left py-3 px-4">Weight</th>
                  <th className="text-left py-3 px-4">Delivery Types</th>
                  <th className="text-left py-3 px-4">Actual Price</th>
                  <th className="text-left py-3 px-4">Discounted Price</th>
                  <th className="text-left py-3 px-4">Quantity</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <ImageWithFallback
                        src={`https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=100&h=100&fit=crop`}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="py-3 px-4">{item.species}</td>
                    <td className="py-3 px-4">{item.cutType}</td>
                    <td className="py-3 px-4">{item.weight}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {item.deliveryTypes.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">₹{item.actualPrice}</td>
                    <td className="py-3 px-4">₹{item.discountedPrice}</td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          item.status === 'In Stock'
                            ? 'default'
                            : item.status === 'Low Stock'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4 text-blue-600" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded">
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
