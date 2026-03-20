import React, { useState, useEffect, useMemo } from 'react';
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
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  if (!baseUrl) return imagePath;
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${cleanBaseUrl}${cleanPath}`;
};

const formatPrice = (value: number): string => {
  if (!Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
};

interface Variant {
  variantId: {
    _id: string;
    name: string;
    image: string;
    notes: string;
    cutType: string;
    weight?: number;
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

const getCategoryMeta = (category: any): { id: string; name?: string } | null => {
  if (!category) return null;

  if (typeof category === 'string' || typeof category === 'number' || typeof category === 'bigint') {
    const id = String(category);
    return id ? { id } : null;
  }

  if (typeof category === 'object') {
    const id = String(category._id || category.id || '').trim();
    const name = typeof category.name === 'string' ? category.name : undefined;
    return id ? { id, name } : null;
  }

  return null;
};

export default function StoreBilling() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number | ''>(0);
  const [tax, setTax] = useState<number | ''>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invoiceSuccessMessage, setInvoiceSuccessMessage] = useState('');
  
  const [customerName, setCustomerName] = useState('');
  const [customerNumber, setCustomerNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('instore');
  
  // Sub-admin logic: set isSubAdmin and currentStoreId as needed
  const isSubAdmin = false; // TODO: Replace with actual logic
  const currentStoreId = '';
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(isSubAdmin ? currentStoreId : '');
  
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  const [storeInventory, setStoreInventory] = useState<StoreInventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [cutTypeNames, setCutTypeNames] = useState<Record<string, string>>({});

  // Fetch stores only for super-admin
  useEffect(() => {
    if (isSubAdmin) return;
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
  }, [isSubAdmin]);

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

  useEffect(() => {
    let active = true;
    apiFetch<{
      success: boolean;
      cutTypes?: Array<{ _id: string; name: string }>;
      cuttypes?: Array<{ _id: string; name: string }>;
      message?: string;
    }>('/api/cuttype')
      .then((res) => {
        if (!active || !res.success) return;
        const list = res.cutTypes || res.cuttypes || [];
        const nextMap = list.reduce<Record<string, string>>((acc, item) => {
          acc[item._id] = item.name;
          return acc;
        }, {});
        setCutTypeNames(nextMap);
      })
      .catch((err) => {
        console.error('Fetch cut types error:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  const getCutTypeName = (cutTypeId?: string) => {
    if (!cutTypeId) return 'Variant';
    return cutTypeNames[cutTypeId] || cutTypeId;
  };

  const availableCategories = useMemo(() => {
    if (!selectedStoreId) return [] as Array<{ id: string; name: string }>;

    const namesFromMaster = new Map(categories.map((c) => [c.id, c.name]));
    const result = new Map<string, string>();

    storeInventory.forEach((item) => {
      const meta = getCategoryMeta(item.productId?.category);
      if (!meta?.id) return;

      const resolvedName = namesFromMaster.get(meta.id) || meta.name || 'Unnamed';
      if (!result.has(meta.id)) {
        result.set(meta.id, resolvedName);
      }
    });

    return Array.from(result.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedStoreId, storeInventory, categories]);

  useEffect(() => {
    if (selectedCategoryId === 'all') return;
    const existsInStore = availableCategories.some((c) => c.id === selectedCategoryId);
    if (!existsInStore) {
      setSelectedCategoryId('all');
    }
  }, [availableCategories, selectedCategoryId]);

  // Filter inventory by category and search term
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredInventory = storeInventory.filter((item) => {
    const selectedIsAll = selectedCategoryId === 'all' || !selectedCategoryId;
    const categoryMeta = getCategoryMeta(item.productId.category);
    const matchesCategory = selectedIsAll || categoryMeta?.id === selectedCategoryId;
    const matchesSearch =
      !normalizedSearchTerm ||
      item.productId.name.toLowerCase().includes(normalizedSearchTerm) ||
      item.variants.some((variant) => {
        const variantName = variant.variantId.name?.toLowerCase() || '';
        const notes = variant.variantId.notes?.toLowerCase() || '';
        const cutTypeName = getCutTypeName(variant.variantId.cutType).toLowerCase();
        const weight = String(variant.variantId.weight || '');

        return (
          variantName.includes(normalizedSearchTerm) ||
          notes.includes(normalizedSearchTerm) ||
          cutTypeName.includes(normalizedSearchTerm) ||
          weight.includes(normalizedSearchTerm)
        );
      });

    return matchesCategory && matchesSearch && item.isActive && !item.isDeleted;
  });

  const addToCart = (inventoryItem: StoreInventoryItem, variant?: Variant) => {
    if (inventoryItem.totalStock <= 0) {
      toast.error('Product out of stock');
      return;
    }

    const variantWeight = variant?.variantId.weight;
    const cartItemId = variant 
      ? `${inventoryItem.productId._id}-${variant.variantId._id}-${variantWeight || 0}`
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
        weight: variantWeight,
        weightUnit: inventoryItem.productId.weightUnit,
        notes: variant?.variantId.notes,
        cutType: getCutTypeName(variant?.variantId.cutType),
        availableStock: inventoryItem.totalStock,
        productImage,
        variantImage,
      };
      setCart([...cart, newItem]);
      if (variant) {
        toast.success(`Added ${getCutTypeName(variant.variantId.cutType)} ${variantWeight || ''}${inventoryItem.productId.weightUnit}`);
      }
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

  const discountValue = discount === '' ? 0 : discount;
  const taxValue = tax === '' ? 0 : tax;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountValue) / 100;
  const taxAmount = ((subtotal - discountAmount) * taxValue) / 100;
  const total = subtotal - discountAmount + taxAmount;
  const hasCustomerDetails = customerName.trim().length > 0 && customerNumber.trim().length > 0;

  const handleCreateOrder = async () => {
    setInvoiceSuccessMessage('');

    // Validation
    if (!selectedStoreId) {
      toast.error('Please select a store');
      return;
    }

    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }

    const normalizedCustomerName = customerName.trim();
    const normalizedCustomerNumber = customerNumber.replace(/\D/g, '');

    if (!normalizedCustomerName) {
      toast.error('Please enter customer name');
      return;
    }

    if (!/^[A-Za-z ]+$/.test(normalizedCustomerName)) {
      toast.error('Customer name should contain only alphabets');
      return;
    }

    if (!normalizedCustomerNumber) {
      toast.error('Please enter customer number');
      return;
    }

    if (normalizedCustomerNumber.length !== 9) {
      toast.error('Customer number should be exactly 9 digits');
      return;
    }

    // Build selected products array
    const selectedProducts = cart.map((item) => ({
      productId: item.productId,
      variantId: item.variantId || '',
      name: item.variantName || item.productName,
      weight: item.weight || 0,
      totalPrice: item.price * item.quantity,
      quantityGrams: item.weight ? item.weight * item.quantity : item.quantity,
      pricePerKg: item.price,
    }));

    const orderPayload = {
      storeId: selectedStoreId,
      customerName: normalizedCustomerName,
      customerNumber: normalizedCustomerNumber,
      selectedProducts,
      subTotal: subtotal,
      discount: discountValue,
      discountAmount: discountAmount,
      tax: taxValue,
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
      setDiscount('');
      setTax('');
      setCustomerName('');
      setCustomerNumber('');
      setPaymentMethod('instore');

      const successMessage = invoiceNo
        ? `Invoice generated successfully! Invoice: ${invoiceNo}`
        : 'Invoice generated successfully!';
      setInvoiceSuccessMessage(successMessage);
      toast.success(successMessage);

      // Download receipt if available
      if (invoiceUrl) {
        window.open(invoiceUrl, '_blank');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create order';
      console.error('Create order error:', err);
      setInvoiceSuccessMessage('');
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
            <CardContent className="!pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Store Dropdown: Only for super-admin */}
                {!isSubAdmin && (
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
                )}

                {/* Category Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Category</label>
                  <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                    disabled={(!isSubAdmin && !selectedStoreId) || categoriesLoading || !!categoriesError}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : ((!isSubAdmin && !selectedStoreId) ? 'Select store first' : 'All categories')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                      {categoriesError && <SelectItem value="__error" disabled>{categoriesError}</SelectItem>}
                      {!categoriesLoading && !categoriesError && selectedStoreId && availableCategories.length === 0 && (
                        <SelectItem value="__none" disabled>No categories in this store</SelectItem>
                      )}
                      {availableCategories.map((c) => (
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
                     (!isSubAdmin && !selectedStoreId) ? 'Select store' :
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
            <CardContent className="!pb-2">
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
                <div className="space-y-4">
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
                          <p className="text-sm text-gray-500">Stock: {Number(inventoryItem.totalStock ?? 0).toFixed(2)} kg</p>
                        </div>
                      </div>

                      {/* Variants Grid */}
                      {inventoryItem.variants.length === 0 ? (
                        <div className="flex justify-end">
                          <Button
                            onClick={() => addToCart(inventoryItem)}
                            disabled={inventoryItem.totalStock <= 0}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add - <span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(inventoryItem.productId.cost)}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(
                            inventoryItem.variants
                              .filter((variant) => variant.isActive && !variant.isDeleted && variant.variantId.isActive)
                              .reduce<Record<string, Variant[]>>((acc, variant) => {
                                const cutTypeKey = variant.variantId.cutType || 'uncategorized';
                                if (!acc[cutTypeKey]) {
                                  acc[cutTypeKey] = [];
                                }
                                acc[cutTypeKey].push(variant);
                                return acc;
                              }, {})
                          ).map(([cutTypeId, groupedVariants]) => {
                            const sortedVariants = [...groupedVariants].sort(
                              (left, right) => (left.variantId.weight || 0) - (right.variantId.weight || 0)
                            );

                            return (
                              <div key={cutTypeId} className="rounded-xl border border-gray-200 p-4">
                                <div className="mb-3">
                                  <h4 className="text-sm font-semibold text-gray-900">{getCutTypeName(cutTypeId)}</h4>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Available weights: {sortedVariants
                                      .map((variant) => `${variant.variantId.weight || 0}${inventoryItem.productId.weightUnit}`)
                                      .join(', ')}
                                  </p>
                                </div>

                                <div className="flex gap-3 overflow-x-auto pb-1">
                                  {sortedVariants.map((variant) => (
                                    <button
                                      key={variant._id}
                                      onClick={() => addToCart(inventoryItem, variant)}
                                      disabled={inventoryItem.totalStock <= 0}
                                      className="flex min-w-[220px] flex-shrink-0 items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {variant.variantId.image && (
                                        <div className="flex-shrink-0">
                                          <ImageWithFallback
                                            src={getImageUrl(variant.variantId.image)}
                                            alt={variant.variantId.name}
                                            className="h-16 w-16 rounded-lg object-cover"
                                          />
                                        </div>
                                      )}

                                      <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900">
                                          {variant.variantId.weight || 0}{inventoryItem.productId.weightUnit}
                                        </p>
                                        {variant.variantId.notes && (
                                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{variant.variantId.notes}</p>
                                        )}

                                        <div className="mt-2 flex flex-col gap-1">
                                          {variant.variantId.discount > 0 && (
                                            <>
                                              <span className="text-xs text-gray-400 line-through">
                                                <span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(variant.variantId.displayPrice)}
                                              </span>
                                              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                {variant.variantId.discount}% off
                                              </span>
                                            </>
                                          )}
                                          <p className="mt-1 text-sm font-bold text-blue-600">
                                            <span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(variant.variantId.sellingPrice)}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex flex-shrink-0 items-center gap-1 text-sm font-medium text-blue-600">
                                        <Plus className="h-4 w-4" />
                                        Add
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
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
                {invoiceSuccessMessage && (
                  <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                    {invoiceSuccessMessage}
                  </div>
                )}

                {/* Customer Details */}
                <div className="space-y-2 pb-4 border-b border-gray-200">
                  <label className="text-sm text-gray-600">Customer Name</label>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value.replace(/[^A-Za-z ]/g, ''))}
                    disabled={cart.length === 0}
                  />
                  
                  <label className="text-sm text-gray-600 block mt-2">Customer Phone Number</label>
                  <Input
                    placeholder="Enter customer phone number"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    value={customerNumber}
                    onChange={(e) => setCustomerNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
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
                          {(item.cutType || item.weight) && (
                            <p className="text-xs text-gray-500 truncate">
                              {item.cutType || 'Variant'}
                              {item.weight ? ` • ${item.weight}${item.weightUnit || ''}` : ''}
                            </p>
                          )}
                          <p className="text-xs text-blue-600 mt-1"><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(item.price)} × {item.quantity}</p>
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
                        onChange={(e) => {
                          const next = e.target.value;
                          setDiscount(next === '' ? '' : Number(next));
                        }}
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
                        onChange={(e) => {
                          const next = e.target.value;
                          setTax(next === '' ? '' : Number(next));
                        }}
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
                    <span className="font-medium"><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountValue}%)</span>
                      <span>-<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {taxValue > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Tax ({taxValue}%)</span>
                      <span>+<span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-blue-600 font-bold text-lg"><span className="dirham-symbol mr-2">&#xea;</span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleCreateOrder}
                    disabled={cart.length === 0 || isSubmitting || !hasCustomerDetails}
                  >
                    {isSubmitting ? 'Processing...' : 'Generate Invoice'}
                    <Printer className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setCart([]);
                      setDiscount('');
                      setTax('');
                      setCustomerName('');
                      setCustomerNumber('');
                      setInvoiceSuccessMessage('');
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
