import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Printer, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-toastify';

// Utility function to get full image URL
const getImageUrl = (imagePath?: string): string | undefined => {
  if (!imagePath) return undefined;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  if (!baseUrl) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

interface Variant {
  variantId: {
    _id: string;
    name: string;
    image: string;
    notes: string;
    cutType: string;
    displayPrice: number;
    sellingPrice: number;
    profit: number;
    discount: number;
    isActive: boolean;
  };
  isActive: boolean;
  isDeleted: boolean;
  _id: string;
}

interface StoreInventoryItem {
  _id: string;
  storeId: string;
  productId: {
    _id: string;
    name: string;
    description: string;
    category: string;
    image: string;
    stock: number;
    cost: number;
    defaultProfit: number;
    defaultDiscount: number;
    availableWeights: number[];
    weightUnit: string;
    isActive: boolean;
  };
  variants: Variant[];
  isActive: boolean;
  isDeleted: boolean;
  totalStock: number;
}

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  cutType?: string;
  notes?: string;
  availableStock: number;
  productImage?: string;
  variantImage?: string;
}

interface WeightSelectionModal {
  isOpen: boolean;
  inventoryItem: StoreInventoryItem | null;
  variant: Variant | null;
  availableWeights: number[];
  weightUnit: string;
}

export default function StoreBilling() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('instore');
  
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const [storeInventory, setStoreInventory] = useState<StoreInventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  // Weight selection modal state
  const [weightModal, setWeightModal] = useState<WeightSelectionModal>({
    isOpen: false,
    inventoryItem: null,
    variant: null,
    availableWeights: [],
    weightUnit: '',
  });

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
      setSelectedCategoryId('all');
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

  // Fetch store inventory when store is selected
  useEffect(() => {
    if (!selectedStoreId) {
      setStoreInventory([]);
      return;
    }
    let active = true;
    setInventoryLoading(true);
    setInventoryError(null);
    apiFetch<{ success: boolean; storeInventory?: StoreInventoryItem[]; message?: string }>(
      `/api/store-inventory/${selectedStoreId}`
    )
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch store inventory');
        setStoreInventory(res.storeInventory || []);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch store inventory';
        console.error('Fetch store inventory error:', err);
        setInventoryError(msg);
        toast.error(msg);
      })
      .finally(() => {
        setInventoryLoading(false);
      });
    return () => { active = false; };
  }, [selectedStoreId]);

  // Filter inventory by category and search term
  const filteredInventory = storeInventory.filter((item) => {
    const matchesCategory = !selectedCategoryId || item.productId.category === selectedCategoryId;
    const matchesSearch = !searchTerm || 
      item.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variants.some(v => v.variantId.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch && item.isActive && !item.isDeleted;
  });

  const openWeightModal = (inventoryItem: StoreInventoryItem, variant: Variant) => {
    const availableWeights = inventoryItem.productId.availableWeights || [];
    setWeightModal({
      isOpen: true,
      inventoryItem,
      variant,
      availableWeights,
      weightUnit: inventoryItem.productId.weightUnit,
    });
  };

  const closeWeightModal = () => {
    setWeightModal({
      isOpen: false,
      inventoryItem: null,
      variant: null,
      availableWeights: [],
      weightUnit: '',
    });
  };

  const addToCartWithWeight = (weight: number) => {
    if (!weightModal.inventoryItem || !weightModal.variant) return;

    const inventoryItem = weightModal.inventoryItem;
    const variant = weightModal.variant;

    if (inventoryItem.totalStock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const cartItemId = `${inventoryItem.productId._id}-${variant.variantId._id}-${weight}`;

    const productName = inventoryItem.productId.name;
    const variantName = variant.variantId.name;
    const price = variant.variantId.sellingPrice;
    const productImage = getImageUrl(inventoryItem.productId.image);
    const variantImage = getImageUrl(variant.variantId.image);

    const existing = cart.find((item) => item.id === cartItemId);
    
    if (existing) {
      if (existing.quantity >= inventoryItem.totalStock) {
        toast.error('Cannot add more than available stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: inventoryItem.productId._id,
        variantId: variant.variantId._id,
        productName,
        variantName,
        price,
        quantity: 1,
        weight,
        weightUnit: inventoryItem.productId.weightUnit,
        notes: variant.variantId.notes,
        cutType: variant.variantId.cutType,
        availableStock: inventoryItem.totalStock,
        productImage,
        variantImage,
      };
      setCart([...cart, newItem]);
      toast.success(`Added ${variantName} (${weight}${inventoryItem.productId.weightUnit})`);
    }

    closeWeightModal();
  };

  const addToCart = (inventoryItem: StoreInventoryItem, variant?: Variant) => {
    if (inventoryItem.totalStock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const cartItemId = variant 
      ? `${inventoryItem.productId._id}-${variant.variantId._id}`
      : inventoryItem.productId._id;

    const productName = inventoryItem.productId.name;
    const variantName = variant?.variantId.name;
    const price = variant?.variantId.sellingPrice || inventoryItem.productId.cost;
    const productImage = getImageUrl(inventoryItem.productId.image);
    const variantImage = getImageUrl(variant?.variantId.image);

    const existing = cart.find((item) => item.id === cartItemId);
    
    if (existing) {
      if (existing.quantity >= inventoryItem.totalStock) {
        toast.error('Cannot add more than available stock');
        return;
      }
      setCart(
        cart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem: CartItem = {
        id: cartItemId,
        productId: inventoryItem.productId._id,
        variantId: variant?.variantId._id,
        productName,
        variantName,
        price,
        quantity: 1,
        notes: variant?.variantId.notes,
        cutType: variant?.variantId.cutType,
        availableStock: inventoryItem.totalStock,
        productImage,
        variantImage,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = Math.max(0, item.quantity + delta);
            if (newQuantity > item.availableStock) {
              toast.error('Cannot exceed available stock');
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * tax) / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleCreateOrder = async () => {
    // Validation
    if (!selectedStoreId) {
      toast.error('Please select a store');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    if (!customerNumber.trim()) {
      toast.error('Please enter customer number');
      return;
    }

    // Build selected products array
    const selectedProducts = cart.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || '',
      name: item.variantName || item.productName,
      totalPrice: item.price * item.quantity,
      quantityGrams: item.weight ? item.weight * item.quantity : item.quantity,
      pricePerKg: item.price,
    }));

    const orderPayload = {
      storeId: selectedStoreId,
      customerName: customerName.trim(),
      customerNumber: customerNumber.trim(),
      selectedProducts,
      subTotal: subtotal,
      discount,
      discountAmount: discountAmount,
      tax,
      totalPayable: total,
      paymentMethod,
      paymentStatus: 'paid',
    };

    setIsSubmitting(true);
    try {
      const res = await apiFetch<any>('/api/order/create-pos-order', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (!res.success) {
        throw new Error(res.message || 'Failed to create order');
      }

      const invoiceUrl = res.data?.receiptUrl || res.data?.order?.invoiceUrl;
      const invoiceNo = res.data?.invoiceNo || res.data?.order?.invoiceNo;

      // Reset form
      setCart([]);
      setDiscount(0);
      setTax(0);
      setCustomerName('');
      setCustomerNumber('');
      setPaymentMethod('instore');

      toast.success(`Order created successfully! Invoice: ${invoiceNo}`);

      // Download receipt if available
      if (invoiceUrl) {
        window.open(invoiceUrl, '_blank');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create order';
      console.error('Create order error:', err);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">Store Billing (Digital POS)</h1>
        <p className="text-gray-600">Point of Sale system for in-store billing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Store & Category Selection */}
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
                      setSelectedCategoryId('all');
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
                      setSelectedCategoryId(val === 'all' ? '' : val);
                    }}
                    disabled={!selectedStoreId || categoriesLoading || !!categoriesError}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : (!selectedStoreId ? 'Select store first' : 'All categories')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                      {categoriesError && <SelectItem value="__error" disabled>{categoriesError}</SelectItem>}
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Product Count Info */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Products</label>
                  <div className="flex items-center h-10 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600">
                    {inventoryLoading ? 'Loading...' : 
                     !selectedStoreId ? 'Select store' :
                     `${filteredInventory.length} available`}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedStoreId ? (
                <p className="text-center text-gray-500 py-8">Please select a store to view products</p>
              ) : inventoryLoading ? (
                <p className="text-center text-gray-500 py-8">Loading products...</p>
              ) : inventoryError ? (
                <p className="text-center text-red-500 py-8">{inventoryError}</p>
              ) : filteredInventory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No products found</p>
              ) : (
                <div className="space-y-6">
                  {filteredInventory.map((inventoryItem) => (
                    <div key={inventoryItem._id}>
                      {/* Product Header */}
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                        {inventoryItem.productId.image && (
                          <div className="flex-shrink-0">
                            <ImageWithFallback
                              src={getImageUrl(inventoryItem.productId.image)}
                              alt={inventoryItem.productId.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{inventoryItem.productId.name}</h3>
                          <p className="text-sm text-gray-500">Stock: {inventoryItem.totalStock} {inventoryItem.productId.weightUnit}</p>
                        </div>
                      </div>

                      {/* Variants Grid */}
                      {inventoryItem.variants.length === 0 ? (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              // For base products without variants
                              const availableWeights = inventoryItem.productId.availableWeights || [];
                              if (availableWeights.length > 0) {
                                openWeightModal(inventoryItem, {
                                  variantId: { _id: '', name: inventoryItem.productId.name, image: '', notes: '', cutType: '', displayPrice: inventoryItem.productId.cost, sellingPrice: inventoryItem.productId.cost, profit: 0, discount: 0, isActive: true },
                                  isActive: true,
                                  isDeleted: false,
                                  _id: '',
                                } as Variant);
                              }
                            }}
                            disabled={inventoryItem.totalStock <= 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add - <span className="dirham-symbol mr-2">&#xea;</span>{inventoryItem.productId.cost}
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {inventoryItem.variants
                            .filter(v => v.isActive && !v.isDeleted && v.variantId.isActive)
                            .map((variant) => (
                              <button
                                key={variant._id}
                                onClick={() => openWeightModal(inventoryItem, variant)}
                                disabled={inventoryItem.totalStock <= 0}
                                className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                              >
                                {variant.variantId.image && (
                                  <div className="flex-shrink-0">
                                    <ImageWithFallback
                                      src={getImageUrl(variant.variantId.image)}
                                      alt={variant.variantId.name}
                                      className="w-24 h-24 rounded-lg object-cover"
                                    />
                                  </div>
                                )}
                                
                                <div className="w-full text-center">
                                  <p className="font-medium text-xs line-clamp-2">{variant.variantId.name}</p>
                                  {variant.variantId.notes && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{variant.variantId.notes}</p>
                                  )}
                                  
                                  <div className="mt-2 flex flex-col items-center gap-1">
                                    {variant.variantId.discount > 0 && (
                                      <>
                                        <span className="text-xs line-through text-gray-400">
                                          <span className="dirham-symbol mr-2">&#xea;</span>{variant.variantId.displayPrice}
                                        </span>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">
                                          {variant.variantId.discount}% off
                                        </span>
                                      </>
                                    )}
                                    <p className="text-blue-600 font-bold text-sm mt-1">
                                      <span className="dirham-symbol mr-2">&#xea;</span>{variant.variantId.sellingPrice}
                                    </p>
                                  </div>
                                </div>

                                <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus className="w-3 h-3" />
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing Summary Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Billing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Customer Details */}
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <label className="text-sm text-gray-600">Customer Name</label>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={cart.length === 0}
                  />
                  
                  <label className="text-sm text-gray-600 block mt-2">Customer Phone</label>
                  <Input
                    placeholder="Enter customer phone"
                    type="tel"
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value)}
                    disabled={cart.length === 0}
                  />
                </div>

                {/* Cart Items */}
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">No items in cart</p>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        {/* Cart Item Image */}
                        {(item.variantImage || item.productImage) && (
                          <div className="flex-shrink-0">
                            <ImageWithFallback
                              src={item.variantImage || item.productImage!}
                              alt={item.variantName || item.productName}
                              className="w-12 h-12 rounded object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.productName}</p>
                          {item.variantName && (
                            <p className="text-xs text-gray-500 truncate">{item.variantName}</p>
                          )}
                          {item.weight && (
                            <p className="text-xs text-gray-500">{item.weight} {item.weightUnit}</p>
                          )}
                          <p className="text-xs text-blue-600 mt-1"><span className="dirham-symbol mr-2">&#xea;</span>{item.price} × {item.quantity}</p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-0.5 hover:bg-gray-200 rounded text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-0.5 hover:bg-gray-200 rounded text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-0.5 hover:bg-red-100 rounded ml-0.5"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Discount & Tax */}
                <div className="pt-2 space-y-2 border-t border-gray-200">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 block mb-1">Discount %</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-600 block mb-1">Tax %</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={tax}
                        onChange={(e) => setTax(Number(e.target.value))}
                        min="0"
                        max="100"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* <div className="space-y-2"> 
                    <label className="text-xs text-gray-600 block">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instore">In Store</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>*/}
                </div>

                {/* Summary */}
                <div className="pt-2 space-y-2 text-sm border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium"><span className="dirham-symbol mr-2">&#xea;</span>{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-<span className="dirham-symbol mr-2">&#xea;</span>{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Tax ({tax}%)</span>
                      <span>+<span className="dirham-symbol mr-2">&#xea;</span>{taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-blue-600 font-bold text-lg"><span className="dirham-symbol mr-2">&#xea;</span>{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCreateOrder}
                    disabled={cart.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Generate Invoice'}
                    <Printer className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCart([]);
                      setDiscount(0);
                      setTax(0);
                      setCustomerName('');
                      setCustomerNumber('');
                    }}
                    disabled={isSubmitting}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Weight Selection Modal */}
      {weightModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-2 border-gray-200 shadow-5xl bg-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Select Weight</CardTitle>
              <button
                onClick={closeWeightModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product/Variant Info */}
              <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                {weightModal.variant?.variantId.image && (
                  <ImageWithFallback
                    src={getImageUrl(weightModal.variant.variantId.image)}
                    alt={weightModal.variant.variantId.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{weightModal.variant?.variantId.name}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    <span className="dirham-symbol mr-1">&#xea;</span>
                    {weightModal.variant?.variantId.sellingPrice}
                  </p>
                </div>
              </div>

              {/* Weight Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Available Weights:</p>
                <div className="grid grid-cols-3 gap-2">
                  {weightModal.availableWeights.map((weight) => (
                    <button
                      key={weight}
                      onClick={() => addToCartWithWeight(weight)}
                      className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                    >
                      <div className="font-semibold text-blue-600">{weight}</div>
                      <div className="text-xs text-gray-500">{weightModal.weightUnit}</div>
                      <div className="text-xs text-blue-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3 h-3 inline mr-1" />
                        Add
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="outline"
                onClick={closeWeightModal}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
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
