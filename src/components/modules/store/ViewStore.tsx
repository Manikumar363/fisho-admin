import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { apiFetch, getUserRole } from '../../../lib/api';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { toast } from 'react-toastify';
import { Plus} from 'lucide-react';

interface ViewStoreProps {
  storeId: string;
  onBack: () => void;
}

interface OrderItem {
  snapshot: {
    productName: string;
    variantName: string;
    priceAtPurchase: number;
    unitPriceAtPurchase: number;
    retailPriceAtPurchase: number;
    subtotal: number;
  };
  product: string;
  variant: string;
  quantity: number;
  _id: string;
}

interface Order {
  _id: string;
  pricing: {
    grandTotal: string;
    tax: string;
    discount: string;
    shipping: string;
  };
  shippingAddress: {
    name: string;
    phone: string;
  };
  payment: {
    method: string;
    status: string;
  };
  store: any;
  items: OrderItem[];
  orderType: string;
  invoiceUrl?: string;
  invoiceNo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ViewStore({ storeId, onBack }: ViewStoreProps) {
  const [selectedMonth, setSelectedMonth] = useState('december-2024');
  const [store, setStore] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState<boolean>(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<
    Array<{ id: string; inventoryId?: string; productName: string; variant: string; stock: number; alert: 'red' | 'green' }>
  >([]);
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [targetInventoryId, setTargetInventoryId] = useState<string | null>(null);
  const [addStockValue, setAddStockValue] = useState<string>('');
  const [addingStock, setAddingStock] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState({ productId: '', stock: '', categoryId: '' });
  const [addingProduct, setAddingProduct] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [productsOptions, setProductsOptions] = useState<Array<{ id: string; name: string; categoryId?: string }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  
  // Order history state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  const userRole = getUserRole();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setStore(null);

    apiFetch<{ success: boolean; store: any; message?: string }>(`/api/stores/${storeId}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch store');
        setStore(res.store);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch store';
        console.error('Fetch store error:', err);
        setError(msg);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    let active = true;
    setInventoryLoading(true);
    setInventoryError(null);
    setInventory([]);

    apiFetch<{ success: boolean; storeInventory: any[]; message?: string }>(`/api/store-inventory/${storeId}`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch inventory');

        const toIdString = (value: any): string | null => {
          if (value == null) return null;
          const t = typeof value;
          if (t === 'string' || t === 'number' || t === 'bigint') return String(value);
          if (t === 'object') {
            if (typeof value._id === 'string') return value._id;
            if (typeof value.$oid === 'string') return value.$oid;
            if (typeof value.id === 'string') return value.id;
          }
          return null;
        };

        const short = (val: any) => {
          const s = toIdString(val);
          return s ? `#${s.slice(-6)}` : '—';
        };

        const productLabel = (prod: any) => {
          if (prod && typeof prod === 'object' && typeof prod.name === 'string') return prod.name;
          return short(prod);
        };

        const variantLabelFrom = (variantObj: any) => {
          if (variantObj && typeof variantObj === 'object' && typeof variantObj.name === 'string') return variantObj.name;
          return short(variantObj);
        };

        const normalized = (res.storeInventory || []).map((it, idx) => {
          const variants = Array.isArray(it.variants) ? it.variants : [];
          let variantLabel = '—';
          if (variants.length === 1) {
            variantLabel = variantLabelFrom(variants[0]?.variantId);
          } else if (variants.length > 1) {
            variantLabel = `${variants.length} variants`;
          }
          const stock = Number(it.totalStock ?? 0);
          const invId = toIdString(it._id);
          const idStr = invId || `${toIdString(it.productId) || 'row'}-${idx}`;
          return {
            id: idStr,
            inventoryId: invId || undefined,
            productName: productLabel(it.productId),
            variant: variantLabel,
            stock,
            alert: (stock < 10 ? 'red' : 'green') as 'red' | 'green',
          };
        });
        setInventory(normalized);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch inventory';
        console.error('Fetch store inventory error:', err);
        setInventoryError(msg);
      })
      .finally(() => {
        if (active) setInventoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId]);

  // Fetch order history
  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    setOrdersError(null);
    setOrders([]);

    // Debug: Log the storeId being used
    console.log('Fetching orders for storeId:', storeId);

    apiFetch<{ 
      success: boolean; 
      data: Order[]; 
      pagination: { page: number; limit: number; total: number; pages: number };
      message?: string 
    }>(`/api/order/order-history?storeId=${storeId}&orderType=pos&page=${currentPage}&limit=20`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch order history');
        console.log('Received orders:', res.data.length, 'orders for store:', storeId);
        setOrders(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalOrders(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch order history';
        console.error('Fetch order history error:', err);
        setOrdersError(msg);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [storeId, currentPage]);

  // Load categories when add product dialog opens
  useEffect(() => {
    if (!addProductOpen || categories.length > 0) return;
    let active = true;
    setCategoriesLoading(true);
    setCategoriesError(null);
    apiFetch<{ success: boolean; categories?: any[]; message?: string }>(`/api/categories`)
      .then((res) => {
        if (!active) return;
        if (!res.success) throw new Error(res.message || 'Failed to fetch categories');
        const mapped = (res.categories || []).map((c) => ({ id: String(c._id || c.id || ''), name: c.name || 'Unnamed' })).filter(c => c.id);
        setCategories(mapped);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch categories';
        console.error('Fetch categories error:', err);
        setCategoriesError(msg);
      })
      .finally(() => {
        setCategoriesLoading(false);
      });
    return () => { active = false; };
  }, [addProductOpen, categories.length]);

  // Load products when category changes in add product dialog
  useEffect(() => {
    if (!addProductOpen || !addProductForm.categoryId) {
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
            return String(catId || '') === addProductForm.categoryId;
          })
          .map((p) => ({ id: String(p._id || p.id || ''), name: p.name || 'Unnamed', categoryId: String((typeof p.category === 'object' ? p.category?._id || p.category?.id : p.category) || '') }))
          .filter(p => p.id);
        setProductsOptions(mapped);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.message || 'Failed to fetch products';
        console.error('Fetch products error:', err);
        setProductsError(msg);
      })
      .finally(() => {
        setProductsLoading(false);
      });
    return () => { active = false; };
  }, [addProductOpen, addProductForm.categoryId]);

  // Reset loading/errors when dialog closes so reopening is clean
  useEffect(() => {
    if (!addProductOpen) {
      setCategoriesLoading(false);
      setProductsLoading(false);
      setCategoriesError(null);
      setProductsError(null);
    }
  }, [addProductOpen]);

  const headerTitle = useMemo(() => {
    if (loading) return 'Loading store...';
    if (error) return 'Store unavailable';
    return store?.name || 'Store details';
  }, [loading, error, store?.name]);

  const headerSubtitle = useMemo(() => {
    if (loading) return 'Fetching store details';
    if (error) return error;
    const address = store?.address ? store.address : '—';
    const manager = store?.manager?.name ? `Managed by ${store.manager.name}` : 'Manager not assigned';
    return `${address} • ${manager}`;
  }, [loading, error, store?.address, store?.manager?.name]);

  const openAddStock = (invId?: string) => {
    if (!invId) return;
    setTargetInventoryId(invId);
    setAddStockValue('');
    setAddStockOpen(true);
  };

  const handleConfirmAddStock = async () => {
    if (!targetInventoryId) return;
    const valueNum = Number(addStockValue);
    if (!Number.isFinite(valueNum) || valueNum <= 0) {
      toast.error('Enter a valid stock quantity (> 0).');
      return;
    }
    setAddingStock(true);
    try {
      const res = await apiFetch<{ success: boolean; inventory: any; message?: string }>(
        `/api/store-inventory/add`,
        {
          method: 'POST',
          body: JSON.stringify({ inventoryId: targetInventoryId, stock: valueNum })
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to add stock');
      const inv = res.inventory;
      const total = Number(inv?.totalStock ?? NaN);
      setInventory(prev => prev.map(item =>
        item.inventoryId === inv?._id
          ? { ...item, stock: Number.isFinite(total) ? total : item.stock, alert: (Number.isFinite(total) && total < 10 ? 'red' : 'green') }
          : item
      ));
      setAddStockOpen(false);
      setTargetInventoryId(null);
      setAddStockValue('');
      toast.success(res.message || 'Inventory updated successfully');
    } catch (err: any) {
      const msg = err?.message || 'Failed to add stock';
      toast.error(msg);
    } finally {
      setAddingStock(false);
    }
  };

  const handleConfirmAddProduct = async () => {
    const productIdVal = addProductForm.productId.trim();
    const stockVal = Number(addProductForm.stock);
    if (!addProductForm.categoryId) {
      toast.error('Category is required.');
      return;
    }
    if (!productIdVal) {
      toast.error('Product is required.');
      return;
    }
    if (!Number.isFinite(stockVal) || stockVal <= 0) {
      toast.error('Enter a valid stock quantity (> 0).');
      return;
    }
    setAddingProduct(true);
    try {
      const res = await apiFetch<{ success: boolean; storeInventory?: any; message?: string }>(
        `/api/store-inventory/`,
        {
          method: 'POST',
          body: JSON.stringify({ storeId, productId: productIdVal, stock: stockVal })
        }
      );
      if (!res.success) throw new Error(res.message || 'Failed to add product inventory');
      
      // Refetch inventory to get properly populated product/variant names
      const inventoryRes = await apiFetch<{ success: boolean; storeInventory: any[]; message?: string }>(`/api/store-inventory/${storeId}`);
      
      if (inventoryRes.success) {
        const toIdString = (value: any): string | null => {
          if (value == null) return null;
          const t = typeof value;
          if (t === 'string' || t === 'number' || t === 'bigint') return String(value);
          if (t === 'object') {
            if (typeof value._id === 'string') return value._id;
            if (typeof value.$oid === 'string') return value.$oid;
            if (typeof value.id === 'string') return value.id;
          }
          return null;
        };

        const short = (val: any) => {
          const s = toIdString(val);
          return s ? `#${s.slice(-6)}` : '—';
        };

        const productLabel = (prod: any) => {
          if (prod && typeof prod === 'object' && typeof prod.name === 'string') return prod.name;
          return short(prod);
        };

        const variantLabelFrom = (variantObj: any) => {
          if (variantObj && typeof variantObj === 'object' && typeof variantObj.name === 'string') return variantObj.name;
          return short(variantObj);
        };

        const normalized = (inventoryRes.storeInventory || []).map((it, idx) => {
          const variants = Array.isArray(it.variants) ? it.variants : [];
          let variantLabel = '—';
          if (variants.length === 1) {
            variantLabel = variantLabelFrom(variants[0]?.variantId);
          } else if (variants.length > 1) {
            variantLabel = `${variants.length} variants`;
          }
          const stock = Number(it.totalStock ?? 0);
          const invId = toIdString(it._id);
          const idStr = invId || `${toIdString(it.productId) || 'row'}-${idx}`;
          return {
            id: idStr,
            inventoryId: invId || undefined,
            productName: productLabel(it.productId),
            variant: variantLabel,
            stock,
            alert: (stock < 10 ? 'red' : 'green') as 'red' | 'green',
          };
        });
        setInventory(normalized);
      }
      
      setAddProductOpen(false);
      setAddProductForm({ productId: '', stock: '', categoryId: '' });
      toast.success(res.message || 'Product inventory added successfully');
    } catch (err: any) {
      const msg = err?.message || 'Failed to add product inventory';
      toast.error(msg);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDownloadLedger = () => {
    console.log('Downloading ledger for month:', selectedMonth);
    // Download logic here
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (
      <>
        <span className="dirham-symbol mr-2">&#xea;</span>
        {num.toFixed(2)}
      </>
    );
  };

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered') return 'default';
    if (statusLower === 'processing' || statusLower === 'pending') return 'secondary';
    if (statusLower === 'cancelled' || statusLower === 'failed') return 'destructive';
    return 'outline';
  };

  const handleViewInvoice = (invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      toast.info('Invoice not available');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="mb-2">{headerTitle}</h1>
          <p className="text-gray-600">{headerSubtitle}</p>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="py-6 text-gray-600">Loading store details...</CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-6 text-red-600">{error}</CardContent>
        </Card>
      )}

      {/* Store Inventory Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Inventory</CardTitle>
          {userRole === 'admin' && (
            <Button
              onClick={() => setAddProductOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product Inventory
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-left py-3 px-4">Variant</th>
                  <th className="text-left py-3 px-4">Available Stock (kg)</th>
                  <th className="text-left py-3 px-4">Inventory Alert</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryLoading ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-600">Loading inventory...</td>
                  </tr>
                ) : inventoryError ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-red-600">{inventoryError}</td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center text-gray-500">No inventory found</td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{item.productName}</td>
                      <td className="py-3 px-4 text-gray-600">{item.variant}</td>
                      <td className="py-3 px-4">{item.stock} kg</td>
                      <td className="py-3 px-4">
                        {item.alert === 'red' ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <div className="w-3 h-3 rounded-full bg-red-600"></div>
                            <span>Low Stock</span>
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            <span>In Stock</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {userRole === 'admin' && (
                          <Button
                            size="sm"
                            onClick={() => openAddStock(item.inventoryId)}
                            disabled={!item.inventoryId}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Add Stock
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addStockOpen} onOpenChange={setAddStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Quantity to add (kg)</label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="e.g., 5"
              value={addStockValue}
              onChange={(e) => setAddStockValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddStockOpen(false)} disabled={addingStock}>Cancel</Button>
            <Button onClick={handleConfirmAddStock} disabled={addingStock || !targetInventoryId} className="bg-blue-600 hover:bg-blue-700 text-white">
              {addingStock ? 'Adding…' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Inventory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Category</label>
              <Select
                value={addProductForm.categoryId}
                onValueChange={(val) => {
                  setAddProductForm({ categoryId: val, productId: '', stock: addProductForm.stock });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={categoriesLoading ? 'Loading categories...' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categoriesLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                  {categoriesError && <SelectItem value="__error" disabled>{categoriesError}</SelectItem>}
                  {!categoriesLoading && !categoriesError && categories.length === 0 && (
                    <SelectItem value="__none" disabled>No categories</SelectItem>
                  )}
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600">Product</label>
              <Select
                value={addProductForm.productId}
                onValueChange={(val) => setAddProductForm({ ...addProductForm, productId: val })}
                disabled={!addProductForm.categoryId || productsLoading || !!productsError}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={productsLoading ? 'Loading products...' : (!addProductForm.categoryId ? 'Select category first' : 'Select product')} />
                </SelectTrigger>
                <SelectContent>
                  {productsLoading && <SelectItem value="__loading" disabled>Loading...</SelectItem>}
                  {productsError && <SelectItem value="__error" disabled>{productsError}</SelectItem>}
                  {!productsLoading && !productsError && productsOptions.length === 0 && addProductForm.categoryId && (
                    <SelectItem value="__none" disabled>No products for this category</SelectItem>
                  )}
                  {productsOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Initial Stock (kg)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="e.g., 50"
                value={addProductForm.stock}
                onChange={(e) => setAddProductForm({ ...addProductForm, stock: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddProductOpen(false)} disabled={addingProduct}>Cancel</Button>
            <Button onClick={handleConfirmAddProduct} disabled={addingProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
              {addingProduct ? 'Adding…' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Orders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Store Orders (POS)</CardTitle>
          <div className="text-sm text-gray-600">
            Total: {totalOrders} orders
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Invoice No</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Total Amount</th>
                  <th className="text-left py-3 px-4">Payment</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-600">Loading orders...</td>
                  </tr>
                ) : ordersError ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-red-600">{ordersError}</td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-4 px-4 text-center text-gray-500">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-blue-600 font-mono text-sm">{order.invoiceNo}</td>
                      <td className="py-3 px-4 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{order.shippingAddress?.name || '—'}</div>
                          <div className="text-xs text-gray-500">{order.shippingAddress?.phone || '—'}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{order.items?.length || 0} items</td>
                      <td className="py-3 px-4 font-medium">{formatCurrency(order.pricing?.grandTotal || 0)}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <Badge 
                            variant={order.payment?.status === 'paid' ? 'default' : 'secondary'}
                            className="text-xs mt-1"
                          >
                            {order.payment?.status || 'pending'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-700">
                          {order.orderType === 'pos' || order.orderType === 'instore' ? 'Instore' : order.orderType || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {order.invoiceUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewInvoice(order.invoiceUrl)}
                            className="text-xs"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Invoice
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!ordersLoading && !ordersError && orders.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ledger Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Store Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Download the complete ledger report for the selected month
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current Selection: {selectedMonth === 'december-2024' ? 'December 2024' : 
                  selectedMonth === 'november-2024' ? 'November 2024' : 
                  selectedMonth === 'october-2024' ? 'October 2024' : 
                  selectedMonth === 'september-2024' ? 'September 2024' : 'August 2024'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="december-2024">December 2024</SelectItem>
                  <SelectItem value="november-2024">November 2024</SelectItem>
                  <SelectItem value="october-2024">October 2024</SelectItem>
                  <SelectItem value="september-2024">September 2024</SelectItem>
                  <SelectItem value="august-2024">August 2024</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleDownloadLedger}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Ledger
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
