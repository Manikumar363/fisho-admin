import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-toastify';

export default function StoreBilling() {
  const [cart, setCart] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  
  // Store selection
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  // Category selection
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  
  // Product selection
  const [productsOptions, setProductsOptions] = useState<Array<{ id: string; name: string; price: number; categoryId?: string }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch stores on mount
  useEffect(() => {
    let active = true;
    setStoresLoading(true);
    setStoresError(null);
    apiFetch<{ success: boolean; stores?: any[]; message?: string }>(`/api/stores/`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch stores');
        const mapped = (res.stores || []).map((s) => ({ 
          id: String(s._id || s.id || ''), 
          name: s.name || 'Unnamed Store' 
        })).filter(s => s.id);
        setStores(mapped);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch stores';
        console.error('Fetch stores error:', err);
        setStoresError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setStoresLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Fetch categories when store is selected
  useEffect(() => {
    if (!selectedStoreId) {
      setCategories([]);
      setSelectedCategoryId('');
      return;
    }
    let active = true;
    setCategoriesLoading(true);
    setCategoriesError(null);
    apiFetch<{ success: boolean; categories?: any[]; message?: string }>(`/api/categories`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch categories');
        const mapped = (res.categories || []).map((c) => ({ 
          id: String(c._id || c.id || ''), 
          name: c.name || 'Unnamed' 
        })).filter(c => c.id);
        setCategories(mapped);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch categories';
        console.error('Fetch categories error:', err);
        setCategoriesError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
    return () => { active = false; };
  }, [selectedStoreId]);

  // Fetch products when category is selected
  useEffect(() => {
    if (!selectedStoreId || !selectedCategoryId) {
      setProductsOptions([]);
      return;
    }
    let active = true;
    setProductsLoading(true);
    setProductsError(null);
    apiFetch<{ success: boolean; products?: any[]; message?: string }>(`/api/products`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch products');
        const mapped = (res.products || [])
          .filter((p) => {
            const cat = p.category;
            const catId = typeof cat === 'object' ? cat?._id || cat?.id : cat;
            return String(catId || '') === selectedCategoryId;
          })
          .map((p) => ({ 
            id: String(p._id || p.id || ''), 
            name: p.name || 'Unnamed', 
            price: Number(p.price || 0),
            categoryId: String((typeof p.category === 'object' ? p.category?._id || p.category?.id : p.category) || '') 
          }))
          .filter(p => p.id);
        setProductsOptions(mapped);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch products';
        console.error('Fetch products error:', err);
        setProductsError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setProductsLoading(false);
      });
    return () => { active = false; };
  }, [selectedStoreId, selectedCategoryId]);

  const products = [
    { id: 1, name: 'Tiger Prawns', weight: '500g', price: 380 },
    { id: 2, name: 'Salmon Fillet', weight: '250g', price: 590 },
    { id: 3, name: 'King Fish', weight: '500g', price: 320 },
    { id: 4, name: 'Pomfret', weight: '500g', price: 380 },
    { id: 5, name: 'Mud Crab', weight: '1kg', price: 750 }
  ];

  const addToCart = (product: any) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Store Billing (Digital POS)</h1>
        <p className="text-gray-600">Point of Sale system for in-store billing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Store, Category, Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Store & Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Store Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Store</label>
                  <Select
                    value={selectedStoreId}
                    onValueChange={(val) => {
                      setSelectedStoreId(val);
                      setSelectedCategoryId('');
                      setCart([]);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={storesLoading ? 'Loading stores...' : 'Select store'} />
                    </SelectTrigger>
                    <SelectContent>
                      {storesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                      {storesError && <SelectItem value="__error" disabled>{storesError}</SelectItem>}
                      {!storesLoading && !storesError && stores.length === 0 && (
                        <SelectItem value="__none" disabled>No stores</SelectItem>
                      )}
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Category</label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={(val) => {
                      setSelectedCategoryId(val);
                    }}
                    disabled={!selectedStoreId || categoriesLoading || !!categoriesError}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : (!selectedStoreId ? 'Select store first' : 'Select category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                      {categoriesError && <SelectItem value="__error" disabled>{categoriesError}</SelectItem>}
                      {!categoriesLoading && !categoriesError && categories.length === 0 && selectedStoreId && (
                        <SelectItem value="__none" disabled>No categories</SelectItem>
                      )}
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Filter Info */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Products</label>
                  <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {productsLoading ? 'Loading...' : 
                     !selectedStoreId || !selectedCategoryId ? 'Select category' :
                     `${productsOptions.length} available`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search products by name or scan barcode..."
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStoreId || !selectedCategoryId ? (
                <p className="text-center text-gray-500 py-8">Please select a store and category to view products</p>
              ) : productsLoading ? (
                <p className="text-center text-gray-500 py-8">Loading products...</p>
              ) : productsError ? (
                <p className="text-center text-red-500 py-8">{productsError}</p>
              ) : productsOptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No products found for this category</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {productsOptions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h4 className="mb-1">{product.name}</h4>
                      <p className="text-blue-600">₹{product.price}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cart Items */}
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items in cart</p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h5>{item.name}</h5>
                          <p className="text-sm text-blue-600">₹{item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-red-100 rounded ml-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount */}
                <div className="pt-4 border-t border-gray-200">
                  <Label className="mb-2 block">Discount %</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span className="text-blue-600">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={cart.length === 0}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCart([]);
                      setDiscount(0);
                    }}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className, ...props }: any) {
  return (
    <label className={`text-sm ${className || ''}`} {...props}>
      {children}
    </label>
  );
}
