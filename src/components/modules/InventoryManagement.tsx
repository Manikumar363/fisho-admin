import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, ChevronRight, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, GripVertical, Eye, Loader, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { apiFetch, API_BASE_URL } from '../../lib/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CutTypeSection from './inventory/CutTypeSection';
import AddProductVariant from './inventory/AddProductVariant';
import InventoryAlerts from './inventory/InventoryAlerts';

const IMAGE_BASE = ((import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_BASE_URL) as string | undefined;

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('categories');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryViewModal, setShowCategoryViewModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [isLoadingCategoryView, setIsLoadingCategoryView] = useState(false);
  const [viewingVariant, setViewingVariant] = useState<any>(null);
  const [isLoadingVariantView, setIsLoadingVariantView] = useState(false);
  const [openCutTypeAdd, setOpenCutTypeAdd] = useState(false);
  const [productSortOption, setProductSortOption] = useState('recent');
  const [variantSortOption, setVariantSortOption] = useState('recent');
  const [insertedProductId, setInsertedProductId] = useState<string | null>(null);
  const [insertedVariantId, setInsertedVariantId] = useState<string | null>(null);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [variantsPage, setVariantsPage] = useState(1);
  const [showAddProductVariant, setShowAddProductVariant] = useState(false);
  const [productCutTypeImages, setProductCutTypeImages] = useState<{ [cutType: string]: File | null }>({});
  const [existingCutTypeImages, setExistingCutTypeImages] = useState<{ [cutType: string]: string }>({});
  const [existingVariantIds, setExistingVariantIds] = useState<{ [key: string]: string }>({});
  const [productVariantRows, setProductVariantRows] = useState<{
    [key: string]: {
      costPricePerKg: string;
      profitPercent: string;
      displayPrice: string;
      discountPercent: string;
      sellingPrice: string;
      featured: boolean;
      bestSeller: boolean;
      expressDelivery: boolean;
      nextDayDelivery: boolean;
      festivOffer: boolean;
      notes: string;
    }
  }>({});
  const CATEGORIES_PAGE_SIZE = 20;
  const PRODUCTS_PAGE_SIZE = 20;
  const VARIANTS_PAGE_SIZE = 20;
  

  // Category state
  const [categoryForm, setCategoryForm] = useState({
    speciesName: '',
    speciesIcon: null as File | null,
    existingIcon: '',
    existingIconUrl: '',
    description: '',
    availability: true
  });

  // Product state
  const [productForm, setProductForm] = useState({
    category: '',
    productName: '',
    productImage: null as File | null,
    existingImage: '',
    existingImageUrl: '',
    description: '',
    nutritionFacts: '',
    cutTypes: [] as string[],
    currentCutType: '',
    availableWeights: [] as number[],
    currentWeight: '',
    availableStock: '',
    defaultProfit: '',
    defaultDiscount: '',
    costPricePerKg: '',
    availability: true,
    featured: false,
    bestseller: false,
    isExpressDelivery: false
  });
  // Original category form state (for change detection)
const [originalCategoryForm, setOriginalCategoryForm] = useState({
  speciesName: '',
  speciesIcon: null as File | null,
  existingIcon: '',
  description: '',
  availability: true
});

// Original product form state (for change detection)
const [originalProductForm, setOriginalProductForm] = useState({
  category: '',
  productName: '',
  productImage: null as File | null,
  existingImage: '',
  description: '',
  nutritionFacts: '',
  cutTypes: [] as string[],
  availableWeights: [] as number[],
  availableStock: '',
  defaultProfit: '',
  defaultDiscount: '',
  costPricePerKg: '',
  availability: true,
  featured: false,
  bestseller: false,
  isExpressDelivery: false
});

// Original variant form state (for change detection)
const [originalVariantForm, setOriginalVariantForm] = useState({
  species: '',
  product: '',
  productName: '',
  variantImage: null as File | null,
  existingImage: '',
  cutType: '',
  featured: false,
  bestSeller: false,
  isExpressDelivery: false,
  isNextDayDelivery: false,
  isSpecial: false,
  costPrice: '',
  profit: '',
  displayPrice: '',
  discount: '',
  sellingPrice: '',
  notes: '',
  availability: true
});

  // Fetch cut types for product form
  const [cutTypesData, setCutTypesData] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingCutTypes, setLoadingCutTypes] = useState(false);

  useEffect(() => {
    const fetchCutTypes = async () => {
      setLoadingCutTypes(true);
      try {
        // Use the backend-specified endpoint
        const res = await apiFetch<{
          success: boolean;
          cutTypes?: Array<{ _id: string; name: string; isActive?: boolean }>;
          cuttypes?: Array<{ _id: string; name: string; isActive?: boolean }>;
          message?: string;
        }>('/api/cuttype');

        const list = (res.cutTypes || res.cuttypes || []) as Array<{ _id: string; name: string; isActive?: boolean }>;
        setCutTypesData(list.filter(ct => ct.isActive !== false));
      } catch (e: any) {
        console.error('Failed to fetch cut types:', e);
      } finally {
        setLoadingCutTypes(false);
      }
    };
    if (activeTab === 'products' || activeTab === 'variants') fetchCutTypes();
  }, [activeTab]);

  // Variant state (for add/edit modal forms)
  const [variantForm, setVariantForm] = useState({
    species: '',
    product: '',
    productName: '',
    variantImage: null as File | null,
    existingImage: '',
    existingImageUrl: '',
    cutType: '',
    weight: '',
    featured: false,
    bestSeller: false,
    isExpressDelivery: false,
    isNextDayDelivery: false,
    isSpecial: false,
    costPrice: '',
    profit: '',
    displayPrice: '',
    discount: '',
    sellingPrice: '',
    notes: '',
    availability: true
  });


  // Products loaded for selected species (category) in Variant modal
  const [variantProducts, setVariantProducts] = useState<Array<{ id: string; name: string; costPrice?: number; profit?: number; discount?: number; cutTypeIds?: string[] }>>([]);
  const [loadingVariantProducts, setLoadingVariantProducts] = useState(false);

  // When species (category) changes in variant form, fetch products for that category
  useEffect(() => {
    const fetchProductsByCategory = async () => {
      if (!variantForm.species) {
        setVariantProducts([]);
        return;
      }

      setLoadingVariantProducts(true);
      try {
        const res = await apiFetch<{
          success: boolean;
          products?: Array<{ _id: string; name: string; cost?: number; defaultProfit?: number; defaultDiscount?: number; availableCutTypes?: Array<{ _id: string; name: string }> }>;
        }>(`/api/products/category/${variantForm.species}`);

        if (res.success && res.products) {
          setVariantProducts((res.products || []).map(p => ({ 
            id: p._id, 
            name: p.name, 
            costPrice: p.cost, 
            profit: p.defaultProfit, 
            discount: p.defaultDiscount,
            cutTypeIds: (p.availableCutTypes || []).map(ct => ct._id)
          })));
        } else {
          setVariantProducts([]);
        }
      } catch (e: any) {
        console.error('Failed to fetch products for category:', e);
        setVariantProducts([]);
      } finally {
        setLoadingVariantProducts(false);
      }
    };

    fetchProductsByCategory();
  }, [variantForm.species]);

  // Categories state
  const [categories, setCategories] = useState<Array<{
    id: string;
    icon: string | any;
    iconPath?: string;
    name: string;
    availability: 'Available' | 'Unavailable';
    dateCreated: string;
    lastUpdated: string;
  }>>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [dragOverCategoryIndex, setDragOverCategoryIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError(null);
      try {
        const res = await apiFetch<{
          success: boolean;
          categories?: Array<{
            _id: string;
            name: string;
            description?: string;
            image?: string;
            order?: number;
            isActive: boolean;
            isDeleted?: boolean;
            createdAt: string;
            updatedAt: string;
            slug?: string;
          }>;
          message?: string;
        }>('/api/categories');

        if (!res.success) throw new Error(res.message || 'Failed to fetch categories');

        const mapped = (res.categories || []).map((c) => {
          const raw = c.image || '';
          const icon = raw ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${raw}` : raw) : '🗂️';
          return {
            id: c._id,
            icon,
            iconPath: raw,
            name: c.name,
            availability: (c.isActive ? 'Available' : 'Unavailable') as 'Available' | 'Unavailable',
            dateCreated: new Date(c.createdAt).toISOString().split('T')[0],
            lastUpdated: new Date(c.updatedAt).toISOString().split('T')[0],
          };
        });
        setCategories(mapped);
      } catch (e: any) {
        const msg = e?.message || 'Failed to load categories';
        setCategoriesError(msg);
        toast.error(msg);
      } finally {
        setCategoriesLoading(false);
      }
    };

    // Also load categories for Products and Variants tabs so the forms have options
    if (activeTab === 'categories' || activeTab === 'products' || activeTab === 'variants') fetchCategories();
  }, [activeTab]);

  // Load products when Products tab is active
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchVariants(); // Also fetch variants so we can populate pricing table on edit
    }
  }, [activeTab]);

  // Load variants when Variants tab is active
  useEffect(() => {
    if (activeTab === 'variants') {
      fetchVariants();
      fetchProducts(); // Also fetch products so we have data when editing variants
    }
  }, [activeTab]);

  const fetchVariants = async () => {
    setVariantsLoading(true);
    setVariantsError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        variants?: Array<{
          _id: string;
          name: string;
          image?: string;
          product: {
            _id: string;
            name: string;
            category?: string | { _id: string; name: string };
            image?: string;
            cost?: number;
          };
          cutType: {
            _id: string;
            name: string;
          };
          featured: boolean;
          bestSeller: boolean;
          notes?: string;
          profit: number;
          weight?: number;
          costPrice?: number;
          discount: number;
          displayPrice: number;
          sellingPrice: number;
          isActive: boolean;
          isExpressDelivery?: boolean;
          isNextDayDelivery?: boolean;
          special?: boolean;
          createdAt: string;
          updatedAt: string;
        }>;
        message?: string;
      }>('/api/variants');

      if (!res.success) throw new Error(res.message || 'Failed to fetch variants');

      const mapped = (res.variants || []).map((v) => {
        // Extract category/species from product
        let species = '—';
        const catAny = v.product?.category;
        if (catAny && typeof catAny === 'object') {
          species = catAny.name || '—';
        }

        // Extract the raw image path (strip IMAGE_BASE if present)
        let rawImagePath = v.image || '';
        if (rawImagePath && IMAGE_BASE && rawImagePath.startsWith(IMAGE_BASE)) {
          rawImagePath = rawImagePath.substring(IMAGE_BASE.length);
        }

        return {
          id: v._id,
          variantName: v.name,
          product: v.product?.name || '—',
          species,
          cutType: v.cutType?.name || '—',
          cutTypeId: v.cutType?._id,
          featured: v.featured || false,
          bestSeller: v.bestSeller || false,
          isExpressDelivery: v.isExpressDelivery || false,
          isNextDayDelivery: v.isNextDayDelivery || false,
          special: v.special || false,
          costPrice: v.costPrice || 0,
          profit: v.profit || 0,
          discount: v.discount || 0,
          displayPrice: v.displayPrice || 0,
          sellingPrice: v.sellingPrice || 0,
          notes: v.notes,
          image: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${rawImagePath}` : v.image) : undefined,
          imagePath: rawImagePath || undefined,
          status: v.isActive ? 'Active' : 'Inactive',
          lastUpdated: new Date(v.updatedAt).toISOString().split('T')[0],
          weight: v.weight || 0,
        };
      });
      setVariants(mapped);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load variants';
      setVariantsError(msg);
      toast.error(msg);
    } finally {
      setVariantsLoading(false);
    }
  };

  const [products, setProducts] = useState<Array<{
    id: string;
    image: string;
    imagePath?: string;
    name: string;
    species: string;
    categoryId?: string;
    cutTypes: string[];
    cutTypeIds?: string[];
    stock: number;
    costPrice: number;
    profit: number;
    discount: number;
    status: string;
    lastUpdated: string;
    description?: string;
    nutritionFacts?: string;
    availability?: boolean;
    weightUnit?: string;
    availableWeights?: number[];
    featured?: boolean;
    bestseller?: boolean;
    isExpressDelivery?: boolean;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fallback ID generator (rarely needed if _id present)
  const cryptoRandomId = () => Math.random().toString(36).slice(2);

  const fetchProducts = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      type ProductRes = {
        success: boolean;
        products?: Array<{
          _id: string;
          name: string;
          description?: string;
          nutritionFacts?: string;
          category?: { _id: string; name: string; image?: string };
          availableCutTypes?: Array<{ _id: string; name: string }>;
          stock: number;
          lowStockThreshold?: number;
          cost: number;
          defaultProfit: number;
          defaultDiscount: number;
          availableWeights?: number[];
          weightUnit?: string;
          image?: string;
          isActive: boolean;
          featured?: boolean;
          bestSeller?: boolean;
          isExpressDelivery?: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
          id?: string;
        }>;
        message?: string;
      };

      let res: ProductRes | null = null;
      try {
        res = await apiFetch<ProductRes>('/api/products');
      } catch (err: any) {
        if (err?.status === 404) {
          // Some backends require trailing slash
          res = await apiFetch<ProductRes>('/api/products/');
        } else {
          throw err;
        }
      }

      if (!res?.success) throw new Error(res?.message || 'Failed to fetch products');

      const mapped = (res.products || []).map((p) => {
        const raw = p.image || '';
        const image = raw ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${raw}` : raw) : '';

        // Handle both shapes: category as object or as string id (or categoryId field)
        let catId: string | undefined = undefined;
        let species = '—';
        const catAny = (p as any).category;
        if (catAny && typeof catAny === 'object') {
          catId = String(catAny._id || catAny.id || '');
          species = catAny.name || '—';
        } else if (typeof catAny === 'string') {
          catId = String(catAny);
          // species will remain '—' if name not provided; list still shows correctly by id
        } else if ((p as any).categoryId) {
          catId = String((p as any).categoryId);
        }

        const cutTypes = (p.availableCutTypes || []).map((ct) => ct.name);
        const cutTypeIds = (p.availableCutTypes || []).map((ct) => ct._id);
        const low = typeof p.lowStockThreshold === 'number' ? p.lowStockThreshold : undefined;
        const status = !p.isActive
          ? 'Inactive'
          : typeof low === 'number' && p.stock <= low
          ? 'Low Stock'
          : 'Active';
        return {
          id: (p as any)._id || p.id || cryptoRandomId(),
          image,
          imagePath: raw,
          name: p.name,
          species,
          categoryId: catId,
          cutTypes,
          cutTypeIds,
          stock: p.stock,
          costPrice: p.cost,
          profit: p.defaultProfit,
          discount: p.defaultDiscount,
          status,
          lastUpdated: new Date(p.updatedAt).toISOString().split('T')[0],
          description: p.description,
          nutritionFacts: p.nutritionFacts,
          availability: p.isActive,
          weightUnit: p.weightUnit,
          availableWeights: p.availableWeights || [],
          featured: p.featured || false,
          bestseller: p.bestSeller || false,
          isExpressDelivery: p.isExpressDelivery || false,
        };
      });
      setProducts(mapped);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load products';
      setProductsError(msg);
      toast.error(msg);
    } finally {
      setProductsLoading(false);
    }
  };

  const [variants, setVariants] = useState<Array<{
    id: string;
    variantName: string;
    product: string;
    species: string;
    cutType: string;
    cutTypeId?: string;
    weight: number;
    featured: boolean;
    bestSeller: boolean;
    isExpressDelivery: boolean;
    isNextDayDelivery: boolean;
    special: boolean;
    costPrice: number;
    profit: number;
    discount: number;
    displayPrice: number;
    sellingPrice: number;
    notes?: string;
    status: string;
    lastUpdated: string;
    image?: string;
    imagePath?: string;
  }>>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState<string | null>(null);

  // Helper to resolve a product's category id reliably
  const getCategoryIdForProduct = (prod: {
    categoryId?: string;
    species?: string;
  }) => {
    if (prod.categoryId) return String(prod.categoryId);
    if (prod.species) {
      const match = categories.find((c) => c.name === prod.species);
      if (match) return String(match.id);
    }
    return '';
  };

  // If categories load after opening edit modal, backfill or refresh the category selection
  useEffect(() => {
    if (editingProductId) {
      const prod = products.find((p) => p.id === editingProductId);
      if (prod) {
        const resolved = getCategoryIdForProduct({ categoryId: prod.categoryId, species: prod.species });
        if (resolved) {
          setProductForm((prev) => ({ ...prev, category: resolved }));
        }
      }
    }
  }, [categories, products, editingProductId]);

  // Reorder functions
  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (isReordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const movingCategory = categories[index];
    const previous = [...categories];
    const optimistic = [...categories];
    [optimistic[index], optimistic[targetIndex]] = [optimistic[targetIndex], optimistic[index]];
    setCategories(optimistic);

    setIsReordering(true);
    try {
      const body = {
        id: String(movingCategory.id),
        from: index + 1,
        to: targetIndex + 1,
      };
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/categories/reorder',
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      );
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to reorder category');
      }
      toast.success(res?.message || 'Category reordered successfully');
    } catch (e: any) {
      setCategories(previous);
      const msg = e?.message || 'Failed to reorder category';
      toast.error(msg);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverCategoryIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverCategoryIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex || isReordering) {
      setDraggedCategoryIndex(null);
      setDragOverCategoryIndex(null);
      return;
    }

    const previous = [...categories];
    const reordered = [...categories];
    const [movedItem] = reordered.splice(draggedCategoryIndex, 1);
    reordered.splice(dropIndex, 0, movedItem);
    
    setCategories(reordered);
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
    setIsReordering(true);

    try {
      const body = {
        id: String(movedItem.id),
        from: draggedCategoryIndex + 1,
        to: dropIndex + 1,
      };
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/categories/reorder',
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      );
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to reorder category');
      }
      toast.success(res?.message || 'Category reordered successfully');
    } catch (e: any) {
      setCategories(previous);
      const msg = e?.message || 'Failed to reorder category';
      toast.error(msg);
    } finally {
      setIsReordering(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedCategoryIndex(null);
    setDragOverCategoryIndex(null);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    if (isReordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    const previous = [...products];
    const optimistic = [...products];
    const [moved] = optimistic.splice(index, 1);
    optimistic.splice(targetIndex, 0, moved);
    setProducts(optimistic);

    setIsReordering(true);
    (async () => {
      try {
        const body = {
          id: String(moved.id),
          from: index + 1,
          to: targetIndex + 1,
        };
        const res = await apiFetch<{ success: boolean; message?: string }>(
          '/api/products/reorder',
          { method: 'PUT', body: JSON.stringify(body) }
        );
        if (!res?.success) throw new Error(res?.message || 'Failed to reorder product');
        toast.success(res.message || 'Product reordered successfully');
      } catch (e: any) {
        setProducts(previous);
        const msg = e?.message || 'Failed to reorder product';
        console.error('Reorder product error:', e);
        toast.error(msg);
      } finally {
        setIsReordering(false);
      }
    })();
  };

const moveVariant = (index: number, direction: 'up' | 'down') => {
  const newVariants = [...variants];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  
  if (targetIndex < 0 || targetIndex >= newVariants.length) return;
  
  [newVariants[index], newVariants[targetIndex]] = [newVariants[targetIndex], newVariants[index]];
  setVariants(newVariants);
};

const handleAddCutType = (cutTypeId: string) => {
  if (!cutTypeId) return;
  setProductForm((prev) => {
    if (prev.cutTypes.includes(cutTypeId)) return { ...prev, currentCutType: '' };
    
    // Auto-populate cost price for all weights with this new cut type
    if (prev.costPricePerKg) {
      const costPerKg = parseFloat(prev.costPricePerKg);
      if (!isNaN(costPerKg) && costPerKg > 0) {
        setProductVariantRows(prevRows => {
          const newRows = { ...prevRows };
          prev.availableWeights.forEach(weight => {
            const rowKey = getVariantRowKey(cutTypeId, weight);
            const costPriceForWeight = (costPerKg * weight / 1000).toFixed(2);
            const profit = parseFloat(prev.defaultProfit) || 0;
            const discount = parseFloat(prev.defaultDiscount) || 0;
            const prices = calculateVariantPrices(parseFloat(costPriceForWeight), profit, discount);
            
            newRows[rowKey] = {
              costPricePerKg: costPriceForWeight,
              profitPercent: String(profit),
              displayPrice: prices.displayPrice,
              discountPercent: String(discount),
              sellingPrice: prices.sellingPrice,
              featured: false,
              bestSeller: false,
              expressDelivery: false,
              nextDayDelivery: false,
              festivOffer: false,
              notes: ''
            };
          });
          return newRows;
        });
      }
    }
    
    return {
      ...prev,
      cutTypes: [...prev.cutTypes, cutTypeId],
      currentCutType: ''
    };
  });
};

const handleRemoveCutType = (cutTypeId: string) => {
  setProductForm((prev) => ({
    ...prev,
    cutTypes: prev.cutTypes.filter((id) => id !== cutTypeId),
  }));
  
  // Remove variant rows for this cut type
  setProductVariantRows(prevRows => {
    const newRows = { ...prevRows };
    productForm.availableWeights.forEach(weight => {
      const rowKey = getVariantRowKey(cutTypeId, weight);
      delete newRows[rowKey];
    });
    return newRows;
  });
};

const handleAddWeight = () => {
  const weight = parseFloat(productForm.currentWeight);
  if (!isNaN(weight) && weight > 0 && !productForm.availableWeights.includes(weight)) {
    setProductForm(prev => ({
      ...prev,
      availableWeights: [...prev.availableWeights, weight],
      currentWeight: ''
    }));
    
    // Auto-populate cost price for all cut types with this new weight
    if (productForm.costPricePerKg) {
      const costPerKg = parseFloat(productForm.costPricePerKg);
      if (!isNaN(costPerKg) && costPerKg > 0) {
        setProductVariantRows(prevRows => {
          const newRows = { ...prevRows };
          productForm.cutTypes.forEach(cutTypeId => {
            const rowKey = getVariantRowKey(cutTypeId, weight);
            const costPriceForWeight = (costPerKg * weight / 1000).toFixed(2);
            const profit = parseFloat(productForm.defaultProfit) || 0;
            const discount = parseFloat(productForm.defaultDiscount) || 0;
            const prices = calculateVariantPrices(parseFloat(costPriceForWeight), profit, discount);
            
            newRows[rowKey] = {
              costPricePerKg: costPriceForWeight,
              profitPercent: String(profit),
              displayPrice: prices.displayPrice,
              discountPercent: String(discount),
              sellingPrice: prices.sellingPrice,
              featured: false,
              bestSeller: false,
              expressDelivery: false,
              nextDayDelivery: false,
              festivOffer: false,
              notes: ''
            };
          });
          return newRows;
        });
      }
    }
  }
};

const handleRemoveWeight = (weight: number) => {
  setProductForm(prev => ({
    ...prev,
    availableWeights: prev.availableWeights.filter(w => w !== weight)
  }));
  
  // Remove variant rows for this weight
  setProductVariantRows(prevRows => {
    const newRows = { ...prevRows };
    productForm.cutTypes.forEach(cutTypeId => {
      const rowKey = getVariantRowKey(cutTypeId, weight);
      delete newRows[rowKey];
    });
    return newRows;
  });
};

  // Get unique key for variant row
  const getVariantRowKey = (cutTypeId: string, weight: number) => `${cutTypeId}-${weight}`;

  // Auto-calculate variant prices based on formula: CP + P% = DP, DP - D% = SP
  const calculateVariantPrices = (costPrice: number, profit: number, discount: number) => {
    const displayPrice = costPrice + (costPrice * profit / 100);
    const sellingPrice = displayPrice - (displayPrice * discount / 100);
    return { displayPrice: displayPrice.toFixed(2), sellingPrice: sellingPrice.toFixed(2) };
  };

  // Handle product variant row field changes
  const handleProductVariantRowChange = (rowKey: string, field: string, value: string | boolean) => {
    setProductVariantRows(prev => {
      const current = prev[rowKey] || { 
        costPricePerKg: '', 
        profitPercent: '', 
        displayPrice: '', 
        discountPercent: '', 
        sellingPrice: '',
        featured: false,
        bestSeller: false,
        expressDelivery: false,
        nextDayDelivery: false,
        festivOffer: false,
        notes: ''
      };
      const updated = { ...current, [field]: value };

      // Auto-calculate based on which field changes
      if (field === 'costPricePerKg' || field === 'profitPercent' || field === 'discountPercent') {
        // Calculate forward: CP + Profit% = DP, DP - Discount% = SP
        const cp = parseFloat(String(updated.costPricePerKg)) || 0;
        const p = parseFloat(String(updated.profitPercent)) || 0;
        const d = parseFloat(String(updated.discountPercent)) || 0;

        if (cp > 0) {
          const dp = cp + (cp * p / 100);
          const sp = dp - (dp * d / 100);
          updated.displayPrice = dp.toFixed(2);
          updated.sellingPrice = sp.toFixed(2);
        }
      } else if (field === 'displayPrice') {
        // Display price manually changed: recalculate profit% and selling price
        const cp = parseFloat(String(updated.costPricePerKg)) || 0;
        const dp = parseFloat(String(updated.displayPrice)) || 0;
        const d = parseFloat(String(updated.discountPercent)) || 0;

        if (cp > 0 && dp > 0) {
          // Calculate profit percentage from cost price and display price
          const profitPercent = ((dp - cp) / cp) * 100;
          updated.profitPercent = profitPercent.toFixed(2);
          
          // Calculate selling price from display price and discount
          const sp = dp - (dp * d / 100);
          updated.sellingPrice = sp.toFixed(2);
        }
      } else if (field === 'sellingPrice') {
        // Selling price manually changed: recalculate discount%
        const dp = parseFloat(String(updated.displayPrice)) || 0;
        const sp = parseFloat(String(updated.sellingPrice)) || 0;

        if (dp > 0 && sp > 0) {
          // Calculate discount percentage from display price and selling price
          const discountPercent = ((dp - sp) / dp) * 100;
          updated.discountPercent = discountPercent.toFixed(2);
        }
      }

      return { ...prev, [rowKey]: updated };
    });
  };

  // Upload image using /api/upload-image endpoint
  const uploadImage = async (file: File): Promise<string> => {
    console.log('uploadImage called with file:', file.name, file.size, file.type);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      console.log('Sending upload request to /api/upload-image with URL:', `${API_BASE_URL}/api/upload-image`);
      const res = await apiFetch<{
        message?: string;
        location?: string;
      }>('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });

      console.log('Upload response received:', res);
      if (!res.location) {
        console.error('No location in response:', res);
        throw new Error(res.message || 'Failed to upload image - no location in response');
      }

      console.log('Image uploaded successfully, location:', res.location);
      return res.location;
    } catch (error: any) {
      console.error('Image upload error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      });
      throw error;
    }
  };

  const handleEditCategory = (category: any) => {
    const formData = {
    speciesName: category.name,
    speciesIcon: null,
    existingIcon: category.iconPath || '',
    existingIconUrl: typeof category.icon === 'string' && category.icon !== '🗂️' ? category.icon : '',
    description: category.description || '',
    availability: category.availability === 'Available'
  };
  setEditingCategoryId(category.id);
  setCategoryForm(formData);
  setOriginalCategoryForm({
    speciesName: formData.speciesName,
    speciesIcon: null,
    existingIcon: formData.existingIcon,
    description: formData.description,
    availability: formData.availability
  });
  setShowAddModal(true);
  };

  const handleViewCategory = async (categoryId: string) => {
    setIsLoadingCategoryView(true);
    setShowCategoryViewModal(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        category?: {
          _id: string;
          name: string;
          description?: string;
          image: string;
          order?: number;
          isActive: boolean;
          isDeleted: boolean;
          createdAt: string;
          updatedAt: string;
          slug?: string;
        };
        message?: string;
      }>(`/api/categories/${categoryId}`);

      if (!res.success) throw new Error(res.message || 'Failed to fetch category');
      if (!res.category) throw new Error('No category data in response');

      const categoryData = {
        id: res.category._id,
        icon: IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${res.category.image}` : res.category.image,
        name: res.category.name,
        description: res.category.description || '',
        status: res.category.isActive ? 'Active' : 'Inactive',
        dateCreated: new Date(res.category.createdAt).toISOString().split('T')[0],
        order: res.category.order || 0,
      };

      setViewingCategory(categoryData);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load category details';
      console.error('View category error:', e);
      toast.error(msg);
      setShowCategoryViewModal(false);
    } finally {
      setIsLoadingCategoryView(false);
    }
  };

  const handleViewVariant = async (variantId: string) => {
    setIsLoadingVariantView(true);
    setShowViewModal(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        variant?: {
          _id: string;
          name: string;
          image?: string;
          product: {
            _id: string;
            name: string;
            category?: string | { _id: string; name: string };
            availableCutTypes?: string[];
            availableWeights?: number[];
            image?: string;
          };
          cutType: {
            _id: string;
            name: string;
          };
          weight?: number;
          costPrice?: number;
          featured: boolean;
          bestSeller: boolean;
          notes?: string;
          displayPrice: number;
          sellingPrice: number;
          profit: number;
          discount: number;
          isActive: boolean;
          isDeleted: boolean;
          isExpressDelivery?: boolean;
          isNextDayDelivery?: boolean;
          special?: boolean;
          createdAt: string;
          updatedAt: string;
        };
        message?: string;
      }>(`/api/variants/${variantId}`);

      if (!res.success) throw new Error(res.message || 'Failed to fetch variant');
      if (!res.variant) throw new Error('No variant data in response');

      const v = res.variant;

      // Extract category name from product
      let categoryName = 'N/A';
      if (v.product?.category) {
        if (typeof v.product.category === 'object') {
          categoryName = v.product.category.name;
        } else {
          // Try to find in categories list
          const cat = categories.find(c => c.id === v.product.category);
          if (cat) categoryName = cat.name;
        }
      }

      const variantData = {
        id: v._id,
        name: v.name,
        image: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : undefined,
        productName: v.product?.name || 'N/A',
        productImage: v.product?.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.product.image}` : v.product.image) : undefined,
        categoryName,
        cutTypeName: v.cutType?.name || 'N/A',
        weight: v.weight || 0,
        costPrice: v.costPrice || 0,
        featured: v.featured,
        bestSeller: v.bestSeller,
        isExpressDelivery: v.isExpressDelivery || false,
        isNextDayDelivery: v.isNextDayDelivery || false,
        isSpecial: v.special || false,
        notes: v.notes || 'N/A',
        displayPrice: v.displayPrice,
        sellingPrice: v.sellingPrice,
        profit: v.profit,
        discount: v.discount,
        status: v.isActive ? 'Active' : 'Inactive',
        isDeleted: v.isDeleted,
        dateCreated: new Date(v.createdAt).toISOString().split('T')[0],
        lastUpdated: new Date(v.updatedAt).toISOString().split('T')[0],
      };

      setViewingVariant(variantData);
      setSelectedItem(variantData);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load variant details';
      console.error('View variant error:', e);
      toast.error(msg);
      setShowViewModal(false);
    } finally {
      setIsLoadingVariantView(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedItem || activeTab !== 'categories') return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        category?: {
          _id: string;
          isDeleted: boolean;
        };
        message?: string;
      }>(`/api/categories/${selectedItem.id}`, {
        method: 'DELETE',
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete category');

      setCategories(categories.filter(cat => cat.id !== selectedItem.id));
      toast.success('Category deleted successfully');
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete category';
      console.error('Delete category error:', e);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteProduct = async () => {
    if (!selectedItem || activeTab !== 'products') return;

    // Check if product has any variants
    const productVariants = variants.filter(v => v.product === selectedItem.name);
    if (productVariants.length > 0) {
      toast.error(`Cannot delete this product. It has ${productVariants.length} variant(s). Please delete all variants first.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        product?: {
          _id: string;
          isDeleted: boolean;
        };
        message?: string;
      }>(`/api/products/${selectedItem.id}`, {
        method: 'DELETE',
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete product');

      setProducts(products.filter(prod => prod.id !== selectedItem.id));
      toast.success(res.message || 'Product deleted successfully');
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete product';
      console.error('Delete product error:', e);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Product Variant
  const handleDeleteVariant = async () => {
    if (!selectedItem || activeTab !== 'variants') return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        variant?: {
          _id: string;
          isDeleted: boolean;
        };
        message?: string;
      }>(`/api/variants/${selectedItem.id}`, {
        method: 'DELETE',
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete variant');

      setVariants(variants.filter(variant => variant.id !== selectedItem.id));
      toast.success(res.message || 'Variant deleted successfully');
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete variant';
      console.error('Delete variant error:', e);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVariant = async (variantId: string) => {
    // Fetch variant details and populate form for editing
    try {
      const res = await apiFetch<{
        success: boolean;
        variant?: {
          _id: string;
          name: string;
          image?: string;
          product: {
            _id: string;
            name: string;
            category?: string | { _id: string; name: string };
          };
          cutType: {
            _id: string;
            name: string;
          };
          weight?: number;
          featured: boolean;
          bestSeller: boolean;
          notes?: string;
          profit: number;
          discount: number;
          displayPrice: number;
          sellingPrice: number;
          costPrice?: number;
          isActive: boolean;
          isExpressDelivery?: boolean;
          isNextDayDelivery?: boolean;
        };
        message?: string;
      }>(`/api/variants/${variantId}`);

      if (!res.success || !res.variant) {
        toast.error('Failed to load variant details');
        return;
      }

      const v = res.variant;
      
      console.log('Editing variant:', v);
      console.log('Product category:', v.product?.category);
      console.log('Available categories:', categories);
      
      // Extract category ID from product and match with categories
      let speciesId = '';
      if (v.product?.category) {
        if (typeof v.product.category === 'object') {
          speciesId = v.product.category._id;
          console.log('Category from object:', speciesId);
        } else {
          // If it's a string, try to match with category name or use it as ID
          speciesId = String(v.product.category);
          console.log('Category string:', speciesId);
          const matchedCategory = categories.find(cat => cat.id === speciesId || cat.name === speciesId);
          if (matchedCategory) {
            speciesId = matchedCategory.id;
            console.log('Matched category:', matchedCategory);
          } else {
            console.warn('No matching category found for:', speciesId);
          }
        }
      }

      console.log('Final speciesId:', speciesId);

      // Fetch products for this category before opening the form
      if (speciesId) {
        setLoadingVariantProducts(true);
        try {
          console.log('Fetching products for category:', speciesId);
          const productsRes = await apiFetch<{
            success: boolean;
            products?: Array<{ _id: string; name: string; cost?: number; defaultProfit?: number; defaultDiscount?: number; availableCutTypes?: Array<{ _id: string; name: string }> }>;
          }>(`/api/products/category/${speciesId}`);

          console.log('Products response:', productsRes);

          if (productsRes.success && productsRes.products) {
            const prods = productsRes.products.map(p => ({
              id: p._id,
              name: p.name,
              costPrice: p.cost,
              profit: p.defaultProfit,
              discount: p.defaultDiscount,
              cutTypeIds: (p.availableCutTypes || []).map(ct => ct._id)
            }));
            console.log('Mapped products:', prods);
            setVariantProducts(prods);
          }
        } catch (e: any) {
          console.error('Failed to fetch products for category:', e);
        } finally {
          setLoadingVariantProducts(false);
        }
      }

      // Populate variant form for editing
      const formData = {
        species: speciesId,
        product: v.product?._id || '',
        productName: v.product?.name || '',
        variantImage: null as File | null,
        existingImage: v.image || '',
        existingImageUrl: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : '',
        cutType: v.cutType?._id || '',
        weight: String(v.weight || ''),
        featured: v.featured,
        bestSeller: v.bestSeller,
        isExpressDelivery: v.isExpressDelivery || false,
        isNextDayDelivery: v.isNextDayDelivery || false,
        isSpecial: (v as any).special || false,
        costPrice: String(v.costPrice || ''),
        profit: String(v.profit),
        displayPrice: String(v.displayPrice),
        discount: String(v.discount),
        sellingPrice: String(v.sellingPrice),
        notes: v.notes || '',
        availability: v.isActive
      };

      console.log('Setting variant form:', formData);
      setVariantForm(formData);

      setEditingVariantId(variantId);
      setShowAddModal(true);
    } catch (e: any) {
      console.error('Failed to load variant for editing:', e);
      toast.error('Failed to load variant details');
    }
  };

  const handleOpenAddModal = () => {
    // If Cut Types tab, open child dialog instead
    if (activeTab === 'cuttypes') {
      setOpenCutTypeAdd(true);
      return;
    }
    // Reset forms
    setEditingCategoryId(null);
    setEditingProductId(null);
    setEditingVariantId(null);
    setCategoryForm({ speciesName: '', speciesIcon: null, existingIcon: '', existingIconUrl: '', description: '', availability: true });
    setProductForm({
      category: '',
      productName: '',
      productImage: null,
      existingImage: '',
      existingImageUrl: '',
      description: '',
      nutritionFacts: '',
      cutTypes: [],
      currentCutType: '',
      availableWeights: [],
      currentWeight: '',
      availableStock: '',
      defaultProfit: '',
      defaultDiscount: '',
      costPricePerKg: '',
      availability: true,
      featured: false,
      bestseller: false,
      isExpressDelivery: false
    });
    setProductCutTypeImages({});
    setExistingCutTypeImages({});
    setProductVariantRows({});
    setExistingVariantIds({});
    setVariantForm({
      species: '',
      product: '',
      productName: '',
      variantImage: null,
      existingImage: '',
      existingImageUrl: '',
      cutType: '',
      weight: '',
      featured: false,
      bestSeller: false,
      isExpressDelivery: false,
      isNextDayDelivery: false,
      isSpecial: false,
      costPrice: '',
      profit: '',
      displayPrice: '',
      discount: '',
      sellingPrice: '',
      notes: '',
      availability: true
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'categories') {
      if (!categoryForm.speciesName.trim()) {
        toast.error('Category name is required');
        return;
      }
      if (!editingCategoryId && !categoryForm.speciesIcon) {
        toast.error('Category icon is required');
        return;
      }

      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', categoryForm.speciesName.trim());
        formData.append('description', categoryForm.description.trim());
        if (categoryForm.speciesIcon) {
          formData.append('image', categoryForm.speciesIcon);
        } else if (categoryForm.existingIcon) {
          // Preserve existing icon on edit when no new file is provided
          formData.append('existingImage', categoryForm.existingIcon);
        }
        formData.append('isActive', String(categoryForm.availability));

        const isEdit = editingCategoryId !== null;
        const endpoint = isEdit ? `/api/categories/${editingCategoryId}` : '/api/categories';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await apiFetch<{
          success: boolean;
          category?: {
            _id: string;
            name: string;
            image: string;
            description?: string;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
          };
          message?: string;
        }>(endpoint, {
          method,
          body: formData,
        });

        if (!res.success) throw new Error(res.message || (isEdit ? 'Failed to update category' : 'Failed to add category'));
        if (!res.category) throw new Error('No category data in response');

        const categoryData = {
          id: res.category._id,
          icon: IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${res.category.image}` : res.category.image,
          iconPath: res.category.image,
          name: res.category.name,
          description: res.category.description || '',
          availability: (res.category.isActive ? 'Available' : 'Unavailable') as 'Available' | 'Unavailable',
          dateCreated: new Date(res.category.createdAt).toISOString().split('T')[0],
          lastUpdated: new Date(res.category.updatedAt).toISOString().split('T')[0],
        };

        if (isEdit) {
          const updatedCategories = categories.map(cat => cat.id === editingCategoryId ? categoryData : cat);
          setCategories(updatedCategories);
          toast.success('Category updated successfully');
        } else {
          setCategories([...categories, categoryData]);
          toast.success('Category added successfully');
        }

        setCategoryForm({ speciesName: '', speciesIcon: null, existingIcon: '', existingIconUrl: '', description: '', availability: true });
        setEditingCategoryId(null);
        setShowAddModal(false);
      } catch (e: any) {
        const msg = e?.message || (editingCategoryId ? 'Failed to update category' : 'Failed to add category');
        console.error('Category operation error:', e);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === 'products') {
        // Validate product form - collect all errors and show toasts for each
        const validationErrors: string[] = [];
        if (!productForm.category) validationErrors.push('Please select a category');
        if (!productForm.productName.trim()) validationErrors.push('Please enter a product name');
        if (!editingProductId && !productForm.productImage) validationErrors.push('Product image is required');
        if (!productForm.description.trim()) validationErrors.push('Description is required');
        if (!productForm.nutritionFacts.trim()) validationErrors.push('Nutrition facts are required');
        if (productForm.cutTypes.length === 0) validationErrors.push('At least one cut type is required');
        if (productForm.availableWeights.length === 0) validationErrors.push('At least one weight is required');
        if (!productForm.availableStock || parseFloat(productForm.availableStock) <= 0) validationErrors.push('Valid stock amount is required');
        if (!productForm.costPricePerKg || parseFloat(productForm.costPricePerKg) <= 0) validationErrors.push('Valid cost price is required');
        if (!productForm.defaultProfit || parseFloat(productForm.defaultProfit) < 0) validationErrors.push('Valid default profit is required');
        if (!productForm.defaultDiscount || parseFloat(productForm.defaultDiscount) < 0) validationErrors.push('Valid default discount is required');

        if (validationErrors.length > 0) {
          validationErrors.forEach(err => toast.error(err));
          return;
        }

      setIsSubmitting(true);
      try {
        // Build variants array from productVariantRows
        const isEdit = editingProductId !== null;
        const variants = productForm.cutTypes.flatMap(cutTypeId =>
          productForm.availableWeights.map(weight => {
            const rowKey = getVariantRowKey(cutTypeId, weight);
            const rowData = productVariantRows[rowKey] || { 
              costPricePerKg: '', 
              profitPercent: '', 
              displayPrice: '', 
              discountPercent: '', 
              sellingPrice: '',
              featured: false,
              bestSeller: false,
              expressDelivery: false,
              nextDayDelivery: false,
              festivOffer: false,
              notes: ''
            };
            
            // Use existing image URL if available, will be overwritten if new image is uploaded
            const variantImage = existingCutTypeImages[cutTypeId] || '';
            
            const variant: any = {
              cutType: cutTypeId,
              weight: weight,
              costPrice: parseFloat(String(rowData.costPricePerKg)) || 0,
              profit: parseFloat(String(rowData.profitPercent)) || 0,
              discount: parseFloat(String(rowData.discountPercent)) || 0,
              displayPrice: parseFloat(String(rowData.displayPrice)) || 0,
              sellingPrice: parseFloat(String(rowData.sellingPrice)) || 0,
              featured: rowData.featured,
              bestSeller: rowData.bestSeller,
              special: rowData.festivOffer,
              isExpressDelivery: rowData.expressDelivery,
              isNextDayDelivery: rowData.nextDayDelivery,
              isActive: productForm.availability,
              notes: rowData.notes,
              image: variantImage
            };
            
            // Include variant _id when editing
            if (isEdit && existingVariantIds[rowKey]) {
              variant._id = existingVariantIds[rowKey];
            }
            
            return variant;
          })
        );

        // Upload product image if available, or use existing image when editing
        let productImageLocation = '';
        if (productForm.productImage) {
          try {
            console.log('Starting product image upload:', productForm.productImage.name);
            productImageLocation = await uploadImage(productForm.productImage);
            console.log('Product image uploaded successfully:', productImageLocation);
          } catch (err: any) {
            console.error('Product image upload failed:', err);
            throw new Error(`Failed to upload product image: ${err.message}`);
          }
        } else if (editingProductId && productForm.existingImage) {
          // When editing and no new image uploaded, use the existing image path
          productImageLocation = productForm.existingImage;
        }

        // Upload variant images if available
        const variantImageLocations: { [cutTypeId: string]: string } = {};
        console.log('Starting variant image uploads. productCutTypeImages:', productCutTypeImages);
        for (const [cutTypeId, imageFile] of Object.entries(productCutTypeImages)) {
          if (imageFile) {
            try {
              console.log('Starting variant image upload for cutType:', cutTypeId, 'file:', imageFile.name);
              variantImageLocations[cutTypeId] = await uploadImage(imageFile);
              console.log('Variant image uploaded successfully for cutType:', cutTypeId, 'location:', variantImageLocations[cutTypeId]);
            } catch (err: any) {
              console.error('Variant image upload failed for cutType:', cutTypeId, err);
              throw new Error(`Failed to upload variant image for cut type ${cutTypeId}: ${err.message}`);
            }
          }
        }

        // Add variant images to variants array
        variants.forEach(variant => {
          if (variantImageLocations[variant.cutType]) {
            variant.image = variantImageLocations[variant.cutType];
          }
        });

        // Build FormData with product and variants
        // Build the JSON payload in the exact format the backend expects
        const payload = {
          product: {
            name: productForm.productName.trim(),
            description: productForm.description.trim(),
            nutritionFacts: productForm.nutritionFacts.trim(),
            category: productForm.category,
            availableCutTypes: productForm.cutTypes,
            cost: parseFloat(productForm.costPricePerKg),
            defaultProfit: parseFloat(productForm.defaultProfit),
            defaultDiscount: parseFloat(productForm.defaultDiscount),
            availableWeights: productForm.availableWeights,
            stock: parseFloat(productForm.availableStock),
            isActive: productForm.availability,
            featured: productForm.featured,
            bestSeller: productForm.bestseller,
            special: false,
            isExpressDelivery: productForm.isExpressDelivery,
            isNextDayDelivery: false,
            order: 1,
            image: productImageLocation
          },
          variants: variants
        };

        console.log('Building JSON payload for product submission');
        console.log('Final payload:', payload);
        console.log('Sending to /api/products/product-with-variant');
        
        const endpoint = isEdit ? `/api/products/update-product-with-variant/${editingProductId}` : '/api/products/product-with-variant';
        const method = isEdit ? 'PUT' : 'POST';
        
        const res = await apiFetch<{ 
          success: boolean; 
          message?: string;
          data?: {
            product: any;
            variants: any[];
            summary: any;
          }
        }>(endpoint, {
          method: method,
          body: JSON.stringify(payload),
        });
        
        console.log('Response from backend:', res);

        if (!res.success) {
          console.error('Backend error response:', res);
          throw new Error(res.message || 'Failed to create product with variants');
        }
        if (!res.data?.product) {
          console.error('No product data in response:', res);
          throw new Error('No product data in response');
        }

        toast.success(res.message || 'Product and variants created successfully');
        setShowAddModal(false);

        // Reset form and state
        setProductForm({
          category: '',
          productName: '',
          productImage: null,
          existingImage: '',
          existingImageUrl: '',
          description: '',
          nutritionFacts: '',
          cutTypes: [],
          currentCutType: '',
          availableWeights: [],
          currentWeight: '',
          availableStock: '',
          defaultProfit: '',
          defaultDiscount: '',
          costPricePerKg: '',
          availability: true,
          featured: false,
          bestseller: false,
          isExpressDelivery: false
        });
        setProductVariantRows({});
        setProductCutTypeImages({});
        setExistingVariantIds({});
        setEditingProductId(null);
        
        // Update local products list with the newly created product
        try {
          const p = res.data.product;
          if (p) {
            const raw = p.image || '';
            const image = raw ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${raw}` : raw) : '';
            const cutTypes = (p.availableCutTypes || []).map((ct: any) => ct.name);
            const cutTypeIds = (p.availableCutTypes || []).map((ct: any) => ct._id);
            const mapped = {
              id: p._id || p.id || cryptoRandomId(),
              image,
              imagePath: raw,
              name: p.name,
              species: (() => {
                const catAny = p.category;
                if (catAny && typeof catAny === 'object') return catAny.name || '—';
                if (typeof catAny === 'string') {
                  const match = categories.find((c) => c.id === catAny || c.name === catAny);
                  return match ? match.name : '—';
                }
                return '—';
              })(),
              categoryId: (p.category && typeof p.category === 'object' && p.category._id) ? p.category._id : (p.category || undefined),
              cutTypes,
              cutTypeIds,
              stock: p.stock || 0,
              costPrice: p.cost || 0,
              profit: p.defaultProfit || 0,
              discount: p.defaultDiscount || 0,
              status: p.isActive ? 'Active' : 'Inactive',
              lastUpdated: new Date(p.updatedAt || p.createdAt || Date.now()).toISOString().split('T')[0],
              description: p.description,
              nutritionFacts: p.nutritionFacts,
              availability: p.isActive,
              weightUnit: p.weightUnit || 'g',
              availableWeights: p.availableWeights || [],
              featured: p.featured || false,
              bestseller: p.bestSeller || false,
              isExpressDelivery: p.isExpressDelivery || false,
            };

            setProducts((prev) => {
              const next = [...prev, mapped];
              setInsertedProductId(mapped.id);
              const nextPage = Math.ceil(next.length / PRODUCTS_PAGE_SIZE) || 1;
              setProductsPage(nextPage);
              return next;
            });

            // Also update variants list
            if (res.data.variants && res.data.variants.length > 0) {
              const mappedVariants = res.data.variants.map((v: any) => ({
                id: v._id,
                variantName: v.name,
                product: v.product?.name || '—',
                species: (v.product && v.product.category && typeof v.product.category === 'object') ? v.product.category.name || '—' : '—',
                cutType: v.cutType?.name || '—',
                weight: v.weight || 0,
                featured: v.featured || false,
                bestSeller: v.bestSeller || false,
                isExpressDelivery: v.isExpressDelivery || false,
                isNextDayDelivery: v.isNextDayDelivery || false,
                special: v.special || false,
                costPrice: v.costPrice || 0,
                profit: v.profit || 0,
                discount: v.discount || 0,
                displayPrice: v.displayPrice || 0,
                sellingPrice: v.sellingPrice || 0,
                notes: v.notes,
                image: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : undefined,
                status: v.isActive ? 'Active' : 'Inactive',
                lastUpdated: new Date(v.updatedAt || v.createdAt || Date.now()).toISOString().split('T')[0],
              }));

              setVariants((prev) => [...prev, ...mappedVariants]);
            }
          } else {
            fetchProducts();
          }
        } catch (e) {
          fetchProducts();
        }
      } catch (e: any) {
        const msg = e?.message || 'Failed to create product with variants';
        console.error('Create product with variants error:', e);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    } else if (activeTab === 'variants') {
      // Validate variant form
      if (!variantForm.product) {
        toast.error('Please select a product');
        return;
      }
      if (!variantForm.cutType) {
        toast.error('Please select a cut type');
        return;
      }
      if (!variantForm.weight || parseFloat(variantForm.weight) <= 0) {
        toast.error('Valid weight is required');
        return;
      }
      if (!variantForm.costPrice || parseFloat(variantForm.costPrice) <= 0) {
        toast.error('Valid cost price is required');
        return;
      }
      if (!variantForm.profit || parseFloat(variantForm.profit) < 0) {
        toast.error('Valid profit percentage is required');
        return;
      }
      if (!variantForm.displayPrice || parseFloat(variantForm.displayPrice) <= 0) {
        toast.error('Valid display price is required');
        return;
      }
      if (!variantForm.discount || parseFloat(variantForm.discount) < 0) {
        toast.error('Valid discount percentage is required');
        return;
      }

      setIsSubmitting(true);
      try {
        const display = parseFloat(variantForm.displayPrice);
        const discountPct = parseFloat(variantForm.discount) || 0;
        const selling = display - (display * discountPct / 100);

        const isEdit = editingVariantId !== null;

        // Upload variant image if available
        let variantImageLocation = '';
        if (variantForm.variantImage) {
          try {
            variantImageLocation = await uploadImage(variantForm.variantImage);
          } catch (err: any) {
            throw new Error(`Failed to upload variant image: ${err.message}`);
          }
        } else if (isEdit && variantForm.existingImage) {
          // Preserve existing image when editing without new file
          variantImageLocation = variantForm.existingImage;
        }

        // Build variant payload
        const variant: any = {
          product: variantForm.product,
          cutType: variantForm.cutType,
          weight: parseFloat(variantForm.weight),
          costPrice: parseFloat(variantForm.costPrice) || 0,
          profit: parseFloat(variantForm.profit),
          discount: parseFloat(variantForm.discount),
          displayPrice: display,
          sellingPrice: selling,
          featured: variantForm.featured,
          bestSeller: variantForm.bestSeller,
          isExpressDelivery: variantForm.isExpressDelivery,
          isNextDayDelivery: variantForm.isNextDayDelivery,
          notes: variantForm.notes.trim(),
          isActive: variantForm.availability,
          image: variantImageLocation
        };

        if (isEdit) {
          variant._id = editingVariantId;
        }

        // Get the product by ID from the variant form
        const product = products.find(p => p.id === variantForm.product);

        if (!product) {
          console.error('Unable to find product with ID:', variantForm.product);
          console.error('Available products:', products.map(p => ({ id: p.id, name: p.name })));
          throw new Error('Unable to find associated product');
        }

        // Build payload in same format as product creation
        const payload = {
          product: {
            name: product.name,
            description: product.description || '',
            nutritionFacts: product.nutritionFacts || '',
            category: product.categoryId || '',
            availableCutTypes: product.cutTypeIds || [],
            cost: product.costPrice,
            defaultProfit: product.profit,
            defaultDiscount: product.discount,
            availableWeights: product.availableWeights || [],
            stock: product.stock,
            isActive: product.availability,
            featured: product.featured || false,
            bestSeller: product.bestseller || false,
            special: false,
            isExpressDelivery: product.isExpressDelivery || false,
            isNextDayDelivery: false,
            order: 1,
            image: product.imagePath || ''
          },
          variants: [variant]
        };

        const endpoint = `/api/products/update-product-with-variant/${product.id}`;
        
        const res = await apiFetch<{
          success: boolean;
          message?: string;
          data?: {
            product: any;
            variants: any[];
          };
        }>(endpoint, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        if (!res.success) throw new Error(res.message || 'Failed to update variant');

        toast.success(res.message || 'Variant updated successfully');
        setShowAddModal(false);

        // Reset form
        setVariantForm({
          species: '',
          product: '',
          productName: '',
          variantImage: null,
          existingImage: '',
          existingImageUrl: '',
          cutType: '',
          weight: '',
          featured: false,
          bestSeller: false,
          isExpressDelivery: false,
          isNextDayDelivery: false,
          isSpecial: false,
          costPrice: '',
          profit: '',
          displayPrice: '',
          discount: '',
          sellingPrice: '',
          notes: '',
          availability: true
        });
        setEditingVariantId(null);

        // Update local variants list
        try {
          const v = res.data?.variants?.[0];
          if (v) {
            const mapped = {
              id: v._id || v.id || cryptoRandomId(),
              variantName: v.name,
              product: v.product?.name || '—',
              species: (v.product && v.product.category && typeof v.product.category === 'object') ? v.product.category.name || '—' : '—',
              cutType: v.cutType?.name || '—',
              weight: v.weight || 0,
              featured: v.featured || false,
              bestSeller: v.bestSeller || false,
              isExpressDelivery: v.isExpressDelivery || false,
              isNextDayDelivery: v.isNextDayDelivery || false,
              special: v.special || false,
              costPrice: v.costPrice || 0,
              profit: v.profit || 0,
              discount: v.discount || 0,
              displayPrice: v.displayPrice || 0,
              sellingPrice: v.sellingPrice || 0,
              notes: v.notes,
              image: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : undefined,
              imagePath: v.image,
              status: v.isActive ? 'Active' : 'Inactive',
              lastUpdated: new Date(v.updatedAt || v.createdAt || Date.now()).toISOString().split('T')[0],
            };

            setVariants((prev) => prev.map((pv) => (pv.id === mapped.id ? mapped : pv)));
          } else {
            fetchVariants();
          }
        } catch (e) {
          fetchVariants();
        }
      } catch (e: any) {
        const msg = e?.message || 'Failed to update variant';
        console.error('Update variant error:', e);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderCategoryModal = () => {
    const isEdit = editingCategoryId !== null;
    const categoryUnchanged = isEdit &&
      categoryForm.speciesName === originalCategoryForm.speciesName &&
      categoryForm.description === originalCategoryForm.description &&
      categoryForm.availability === originalCategoryForm.availability &&
      categoryForm.existingIcon === originalCategoryForm.existingIcon &&
      !categoryForm.speciesIcon;
    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-[600px]">
        <div>
          <Label
            htmlFor="speciesName"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Species Name *
          </Label>
          <Input
            id="speciesName"
            value={categoryForm.speciesName}
            onChange={(e) => setCategoryForm({ ...categoryForm, speciesName: e.target.value })}
            placeholder="e.g., Prawns, Fish, Crab"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Description
          </Label>
          <Textarea
            id="description"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            placeholder="e.g., Test category for testing"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label
            htmlFor="speciesIcon"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Species Icon {!isEdit && '*'}
          </Label>
          <Input
            id="speciesIcon"
            type="file"
            accept="image/*"
            onChange={(e) => setCategoryForm({ ...categoryForm, speciesIcon: e.target.files?.[0] || null })}
            required={!isEdit}
            disabled={isSubmitting}
          />
          {categoryForm.speciesIcon ? (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
              <img
                src={URL.createObjectURL(categoryForm.speciesIcon)}
                alt="New category icon preview"
                className="w-14 h-14 rounded object-cover border"
              />
              <div>
                
                <span className="text-xs text-gray-500">{categoryForm.speciesIcon.name}</span>
              </div>
            </div>
          ) : categoryForm.existingIconUrl && !categoryForm.speciesIcon ? (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
              <ImageWithFallback
                src={categoryForm.existingIconUrl}
                alt={categoryForm.speciesName || 'Current category icon'}
                className="w-14 h-14 rounded object-cover border"
              />
              <span>Current icon will be kept unless you upload a new one.</span>
            </div>
          ) : null}
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? 'Upload a new icon to replace the current one (optional)' : 'Upload an icon or image for this species'}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="availability">Availability</Label>
            <p className="text-sm text-gray-600">Make this category available to users</p>
          </div>
          <Switch
            id="availability"
            checked={categoryForm.availability}
            onCheckedChange={(checked: boolean) => setCategoryForm({ ...categoryForm, availability: checked })}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || categoryUnchanged}>
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update Category' : 'Add Category'
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const renderProductModal = () => (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            value={productForm.category}
            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
            required
            disabled={isSubmitting}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="productName">Product Name</Label>
          <Input
            id="productName"
            placeholder="Enter product name"
            value={productForm.productName}
            onChange={e => setProductForm({ ...productForm, productName: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="productImage">Product Image</Label>
          <Input
            id="productImage"
            type="file"
            accept="image/*"
            onChange={e => setProductForm({ ...productForm, productImage: e.target.files?.[0] || null })}
            disabled={isSubmitting}
          />
          {productForm.productImage && (
            <img
              src={URL.createObjectURL(productForm.productImage)}
              alt="Product preview"
              className="w-20 h-20 object-cover rounded mt-2 border"
            />
          )}
          {productForm.existingImageUrl && !productForm.productImage && (
            <img
              src={productForm.existingImageUrl}
              alt="Current product image"
              className="w-20 h-20 object-cover rounded mt-2 border"
            />
          )}
        </div>
        <div>
          <Label htmlFor="availableStock">Available Stock</Label>
          <Input
            id="availableStock"
            type="number"
            min="0"
            placeholder="Enter available stock"
            value={productForm.availableStock}
            onChange={e => setProductForm({ ...productForm, availableStock: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter product description, origin, characteristics..."
          value={productForm.description}
          onChange={e => setProductForm({ ...productForm, description: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="nutrition">Nutrition Facts</Label>
        <Textarea
          id="nutrition"
          placeholder="Enter nutritional information (e.g., Protein: 20g per 100g, Omega-3: 500mg...)"
          value={productForm.nutritionFacts}
          onChange={e => setProductForm({ ...productForm, nutritionFacts: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="costPricePerKg">Cost Price Per KG</Label>
          <Input
            id="costPricePerKg"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter cost price per kg"
            value={productForm.costPricePerKg}
            onChange={e => {
              const newCostPerKg = e.target.value;
              setProductForm({ ...productForm, costPricePerKg: newCostPerKg });
              
              // Auto-update cost price for all existing variant rows
              const costPerKg = parseFloat(newCostPerKg);
              if (!isNaN(costPerKg) && costPerKg > 0) {
                setProductVariantRows(prevRows => {
                  const newRows = { ...prevRows };
                  productForm.cutTypes.forEach(cutTypeId => {
                    productForm.availableWeights.forEach(weight => {
                      const rowKey = getVariantRowKey(cutTypeId, weight);
                      const weightInKg = weight / 1000;
                      const calculatedCost = (costPerKg * weightInKg).toFixed(2);
                      
                      const currentRow = newRows[rowKey] || {
                        costPricePerKg: '',
                        profitPercent: productForm.defaultProfit || '',
                        displayPrice: '',
                        discountPercent: productForm.defaultDiscount || '',
                        sellingPrice: '',
                        featured: false,
                        bestSeller: false,
                        expressDelivery: false,
                        nextDayDelivery: false,
                        festivOffer: false,
                        notes: ''
                      };
                      
                      // Update cost price and recalculate prices
                      const profitPct = parseFloat(String(currentRow.profitPercent)) || parseFloat(productForm.defaultProfit) || 0;
                      const discountPct = parseFloat(String(currentRow.discountPercent)) || parseFloat(productForm.defaultDiscount) || 0;
                      const cp = parseFloat(calculatedCost);
                      const displayPrice = cp + (cp * profitPct / 100);
                      const sellingPrice = displayPrice - (displayPrice * discountPct / 100);
                      
                      newRows[rowKey] = {
                        ...currentRow,
                        costPricePerKg: calculatedCost,
                        displayPrice: displayPrice.toFixed(2),
                        sellingPrice: sellingPrice.toFixed(2)
                      };
                    });
                  });
                  return newRows;
                });
              }
            }}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="defaultDiscount">Default Discount %</Label>
          <Input
            id="defaultDiscount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Enter default discount %"
            value={productForm.defaultDiscount}
            onChange={e => setProductForm({ ...productForm, defaultDiscount: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="defaultProfit">Default Profit %</Label>
          <Input
            id="defaultProfit"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter default profit %"
            value={productForm.defaultProfit}
            onChange={e => setProductForm({ ...productForm, defaultProfit: e.target.value })}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="cutTypes">Available Cut Types</Label>
        <div className="flex gap-2">
          <select
            id="cutTypes"
            className="w-48 px-3 py-2 border border-gray-300 rounded-md"
            value={productForm.currentCutType}
            onChange={e => setProductForm({ ...productForm, currentCutType: e.target.value })}
            disabled={isSubmitting || loadingCutTypes}
          >
            <option value="">Select cut type</option>
            {cutTypesData.map((c) => (
              !productForm.cutTypes.includes(c._id) && (
                <option key={c._id} value={c._id}>{c.name}</option>
              )
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (productForm.currentCutType && !productForm.cutTypes.includes(productForm.currentCutType)) {
                setProductForm({ ...productForm, cutTypes: [...productForm.cutTypes, productForm.currentCutType], currentCutType: '' });
              }
            }}
            disabled={!productForm.currentCutType || isSubmitting}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {productForm.cutTypes.map(cutTypeId => {
            const cutType = cutTypesData.find(c => c._id === cutTypeId);
            return (
              <span key={cutTypeId} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
                {cutType?.name || cutTypeId}
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-red-500"
                  onClick={() => handleRemoveCutType(cutTypeId)}
                  disabled={isSubmitting}
                >×</button>
              </span>
            );
          })}
        </div>
      </div>

      <div>
        <Label htmlFor="weights">Available Weights (in grams)</Label>
        <div className="flex gap-2 flex-wrap mt-1">
          {productForm.availableWeights.map(w => (
            <span key={w} className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-sm">
              {w}
              <button type="button" className="ml-1 text-gray-500 hover:text-red-500" onClick={() => handleRemoveWeight(w)} disabled={isSubmitting}>×</button>
            </span>
          ))}
          <Input
            id="weights"
            placeholder="Enter weight (e.g., 250, 500, 1000)"
            className="w-40"
            value={productForm.currentWeight}
            onChange={e => setProductForm({ ...productForm, currentWeight: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if ((e.target as HTMLInputElement).value.trim()) {
                  handleAddWeight();
                }
              }
            }}
            disabled={isSubmitting}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddWeight}
            disabled={!productForm.currentWeight || isSubmitting}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Weight Options & Pricing</Label>
        </div>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="min-w-full bg-card">
            <thead className="bg-muted/50">
              <tr>
                <th className="py-2 px-3 text-left text-sm font-medium">Cut Type</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Image</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Weight (g)</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Cost Price </th>
                <th className="py-2 px-3 text-left text-sm font-medium">Display Price</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Selling Price</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Profit %</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Discount %</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Featured</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Best Seller</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Express Delivery</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Next Day Delivery</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Festive Offer</th>
                <th className="py-2 px-3 text-left text-sm font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {productForm.cutTypes.length === 0 || productForm.availableWeights.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-muted-foreground">
                    No variants. Add Cut Types and Weights above.
                  </td>
                </tr>
              ) : (
                productForm.cutTypes.flatMap((cutTypeId, cutTypeIdx) => 
                  productForm.availableWeights.map((weight, weightIdx) => {
                    const cutType = cutTypesData.find(c => c._id === cutTypeId);
                    const isFirstWeight = weightIdx === 0;
                    const rowKey = getVariantRowKey(cutTypeId, weight);
                    const rowData = productVariantRows[rowKey] || { 
                      costPricePerKg: '', 
                      profitPercent: '', 
                      displayPrice: '', 
                      discountPercent: '', 
                      sellingPrice: '',
                      featured: false,
                      bestSeller: false,
                      expressDelivery: false,
                      nextDayDelivery: false,
                      festivOffer: false,
                      notes: ''
                    };
                    return (
                      <tr key={rowKey} className="border-t border-border">
                        <td className="py-2 px-3">{cutType?.name || cutTypeId}</td>
                        <td className="py-2 px-3">
                          {isFirstWeight ? (
                            <div className="flex flex-col items-center">
                              <label className="flex flex-col items-center cursor-pointer group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    const file = e.target.files?.[0] || null;
                                    setProductCutTypeImages(prev => ({ ...prev, [cutTypeId]: file }));
                                  }}
                                />
                                <span className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs group-hover:underline">
                                  <ImageIcon className="w-4 h-4" />
                                </span>
                              </label>
                              {productCutTypeImages[cutTypeId] ? (
                                <img
                                  src={URL.createObjectURL(productCutTypeImages[cutTypeId]!)}
                                  alt={`${cutType?.name || cutTypeId} preview`}
                                  className="w-10 h-10 object-cover rounded border mt-1"
                                />
                              ) : existingCutTypeImages[cutTypeId] ? (
                                <img
                                  src={existingCutTypeImages[cutTypeId]}
                                  alt={`${cutType?.name || cutTypeId} preview`}
                                  className="w-10 h-10 object-cover rounded border mt-1"
                                />
                              ) : null}
                            </div>
                          ) : productCutTypeImages[cutTypeId] ? (
                            <img
                              src={URL.createObjectURL(productCutTypeImages[cutTypeId]!)}
                              alt={`${cutType?.name || cutTypeId} preview`}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : existingCutTypeImages[cutTypeId] ? (
                            <img
                              src={existingCutTypeImages[cutTypeId]}
                              alt={`${cutType?.name || cutTypeId} preview`}
                              className="w-10 h-10 object-cover rounded border"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No image</span>
                          )}
                        </td>
                        <td className="py-2 px-3">{weight}</td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={rowData.costPricePerKg}
                            onChange={e => handleProductVariantRowChange(rowKey, 'costPricePerKg', e.target.value)}
                            className="w-24"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={rowData.displayPrice}
                            onChange={e => handleProductVariantRowChange(rowKey, 'displayPrice', e.target.value)}
                            className="w-24"
                            disabled={isSubmitting}
                            title="Display Price (editable)"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={rowData.sellingPrice}
                            onChange={e => handleProductVariantRowChange(rowKey, 'sellingPrice', e.target.value)}
                            className="w-24"
                            disabled={isSubmitting}
                            title="Selling Price (editable)"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="%"
                            value={rowData.profitPercent}
                            onChange={e => handleProductVariantRowChange(rowKey, 'profitPercent', e.target.value)}
                            className="w-20"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="%"
                            value={rowData.discountPercent}
                            onChange={e => handleProductVariantRowChange(rowKey, 'discountPercent', e.target.value)}
                            className="w-20"
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Switch 
                            checked={rowData.featured}
                            onCheckedChange={(checked) => handleProductVariantRowChange(rowKey, 'featured', checked)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Switch 
                            checked={rowData.bestSeller}
                            onCheckedChange={(checked) => handleProductVariantRowChange(rowKey, 'bestSeller', checked)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Switch 
                            checked={rowData.expressDelivery}
                            onCheckedChange={(checked) => handleProductVariantRowChange(rowKey, 'expressDelivery', checked)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Switch 
                            checked={rowData.nextDayDelivery}
                            onCheckedChange={(checked) => handleProductVariantRowChange(rowKey, 'nextDayDelivery', checked)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Switch 
                            checked={rowData.festivOffer}
                            onCheckedChange={(checked) => handleProductVariantRowChange(rowKey, 'festivOffer', checked)}
                            disabled={isSubmitting}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            placeholder="e.g., Fresh catch"
                            value={rowData.notes}
                            onChange={e => handleProductVariantRowChange(rowKey, 'notes', e.target.value)}
                            className="w-32"
                            disabled={isSubmitting}
                          />
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
        
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="availability">Availability</Label>
          <p className="text-sm text-gray-600">Show this product to customers</p>
        </div>
        <Switch 
          id="availability" 
          checked={productForm.availability} 
          onCheckedChange={checked => setProductForm({ ...productForm, availability: checked })}
          disabled={isSubmitting}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 cursor-pointer hover:bg-blue-700" 
          disabled={
            isSubmitting ||
            !productForm.category || !productForm.productName.trim()
          }
        >
          {editingProductId ? 'Update Product' : 'Add Product'}
        </Button>
      </DialogFooter>
    </form>
  );

  const renderVariantModal = () => {
    // Get product from selection to auto-fill defaults
    const selectedProduct = variantProducts.find(p => p.id === variantForm.product);
    const costPrice = parseFloat(variantForm.costPrice) || selectedProduct?.costPrice || 0;
    const defaultProfit = selectedProduct?.profit || 0;
    const defaultDiscount = selectedProduct?.discount || 0;
    
    const prices = calculateVariantPrices(costPrice, defaultProfit, parseFloat(variantForm.discount) || defaultDiscount);

    // Sort products alphabetically for dropdown display
    const sortedProducts = [...variantProducts].sort((a, b) => a.name.localeCompare(b.name));

    // Find the current variant if editing to get its details
    const currentVariant = editingVariantId 
      ? variants.find(v => v.id === editingVariantId)
      : null;

    const isEdit = editingVariantId !== null;

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Read-only info section when editing */}
        {editingVariantId && currentVariant && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
            
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-md font-semibold text-gray-900">Cut Type</Label>
                <p className="mt-1 text-sm font-medium text-gray-600">{currentVariant.cutType}</p>
              </div>
              <div>
                <Label className="text-md font-semibold text-gray-900">Weight</Label>
                <p className="mt-1 text-sm font-medium text-gray-600">{currentVariant.weight} g</p>
              </div>
            </div>

            {/* Read-only Image Display */}
            {currentVariant.image && (
              <div>
                <Label className="text-md font-semibold text-gray-900">Current Image</Label>
                <div className="mt-2 w-6 h-6 border border-gray-100 rounded-lg overflow-hidden bg-white">
                  <img
                    src={currentVariant.image}
                    alt="Variant"
                    className=" object-cover"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Image cannot be edited in this form</p>
              </div>
            )}
          </div>
        )}

        {/* Species and Product Selection - Always visible, editable when editing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Species/Category *</Label>
            <Select
              value={variantForm.species}
              onValueChange={(value) => {
                setVariantForm({ ...variantForm, species: value, product: '', productName: '' });
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Product Name *</Label>
            <Select
              value={variantForm.product}
              onValueChange={(value) => {
                const prod = variantProducts.find(p => p.id === value);
                setVariantForm({ 
                  ...variantForm, 
                  product: value,
                  productName: prod?.name || '',
                  costPrice: prod?.costPrice?.toString() || '',
                  profit: prod?.profit?.toString() || '',
                  discount: prod?.discount?.toString() || ''
                });
              }}
              disabled={isSubmitting || !variantForm.species || loadingVariantProducts}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVariantProducts ? "Loading..." : "Select product"} />
              </SelectTrigger>
              <SelectContent>
                {sortedProducts.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No products available</div>
                ) : (
                  sortedProducts.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={variantForm.featured}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, featured: checked })}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="bestSeller">Best Seller</Label>
            <Switch
              id="bestSeller"
              checked={variantForm.bestSeller}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, bestSeller: checked })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="expressDelivery">Express Delivery</Label>
            <Switch
              id="expressDelivery"
              checked={variantForm.isExpressDelivery || false}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, isExpressDelivery: checked })}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="nextDayDelivery">Next Day Delivery</Label>
            <Switch
              id="nextDayDelivery"
              checked={variantForm.isNextDayDelivery || false}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, isNextDayDelivery: checked })}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="festiveOffer">Festive Offer</Label>
            <Switch
              id="festiveOffer"
              checked={variantForm.isSpecial || false}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, isSpecial: checked })}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-900">Pricing Details</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Cost Price (<span className="dirham-symbol">&#xea;</span>/kg) *</Label>
              <Input
                type="number"
                value={variantForm.costPrice}
                onChange={(e) => {
                  const cp = parseFloat(e.target.value) || 0;
                  const profit = parseFloat(variantForm.profit) || 0;
                  const discount = parseFloat(variantForm.discount) || 0;
                  const dp = cp + (cp * profit / 100);
                  const sp = dp - (dp * discount / 100);
                  setVariantForm({ 
                    ...variantForm, 
                    costPrice: e.target.value,
                    displayPrice: dp.toFixed(2),
                    sellingPrice: sp.toFixed(2)
                  });
                }}
                placeholder="Enter cost price"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Profit % *</Label>
              <Input
                type="number"
                value={variantForm.profit}
                onChange={(e) => {
                  const cp = parseFloat(variantForm.costPrice) || 0;
                  const profit = parseFloat(e.target.value) || 0;
                  const discount = parseFloat(variantForm.discount) || 0;
                  const dp = cp + (cp * profit / 100);
                  const sp = dp - (dp * discount / 100);
                  setVariantForm({ 
                    ...variantForm, 
                    profit: e.target.value,
                    displayPrice: dp.toFixed(2),
                    sellingPrice: sp.toFixed(2)
                  });
                }}
                placeholder="Enter profit %"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Display Price (<span className="dirham-symbol">&#xea;</span>) *</Label>
              <Input
                type="number"
                value={variantForm.displayPrice}
                onChange={(e) => {
                  const dp = parseFloat(e.target.value) || 0;
                  const discount = parseFloat(variantForm.discount) || 0;
                  const sp = dp - (dp * discount / 100);
                  setVariantForm({ 
                    ...variantForm, 
                    displayPrice: e.target.value,
                    sellingPrice: sp.toFixed(2)
                  });
                }}
                placeholder="Enter display price"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="variantDiscount">Discount % *</Label>
              <Input
                id="variantDiscount"
                type="number"
                value={variantForm.discount}
                onChange={(e) => {
                  const dp = parseFloat(variantForm.displayPrice) || 0;
                  const discount = parseFloat(e.target.value) || 0;
                  const sp = dp - (dp * discount / 100);
                  setVariantForm({ 
                    ...variantForm, 
                    discount: e.target.value,
                    sellingPrice: sp.toFixed(2)
                  });
                }}
                placeholder="Enter discount"
                step="0.01"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-600">Selling Price (<span className="dirham-symbol">&#xea;</span>) - Auto-calculated</Label>
            <Input 
              value={(variantForm.displayPrice && variantForm.discount)
                ? (parseFloat(variantForm.displayPrice) - (parseFloat(variantForm.displayPrice) * (parseFloat(variantForm.discount) || 0) / 100)).toFixed(2)
                : '0.00'}
              disabled 
              className="bg-white font-semibold text-green-600 mt-1" 
            />
          </div>
        </div>

        <div>
          <Label className="text-gray-600">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={variantForm.notes}
            onChange={(e) => setVariantForm({ ...variantForm, notes: e.target.value })}
            placeholder="Additional notes or special instructions..."
            rows={2}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="variantAvailability">Availability</Label>
            <p className="text-sm text-gray-600">Make this variant available to users</p>
          </div>
          <Switch
            id="variantAvailability"
            checked={variantForm.availability}
            onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, availability: checked })}
            disabled={isSubmitting}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => {
            setShowAddModal(false);
            setEditingVariantId(null);
          }} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 cursor-pointer hover:bg-blue-700" 
            disabled={
              isSubmitting ||
              !variantForm.product ||
              !variantForm.costPrice ||
              !variantForm.profit ||
              !variantForm.displayPrice ||
              !variantForm.discount
            }
          >
            {isSubmitting
              ? (editingVariantId ? 'Updating...' : 'Adding...')
              : (editingVariantId ? 'Update Variant' : 'Add Variant')}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  const tabLabelMap: Record<string, string> = {
    categories: 'Categories',
    products: 'Products',
    variants: 'Product Variants',
    cuttypes: 'Cut Types',
    inventoryAlerts: 'Inventory Alerts',
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredCategories = !normalizedQuery
    ? categories
    : categories.filter((cat) =>
        [cat.name, cat.availability, cat.dateCreated, cat.lastUpdated]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      );

  const filteredProducts = !normalizedQuery
    ? products
    : products.filter((prod) =>
        [prod.name, prod.species, prod.status]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      );

  const filteredVariants = !normalizedQuery
    ? variants
    : variants.filter((variant) =>
        [variant.variantName, variant.product, variant.species, variant.cutType, variant.status]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(normalizedQuery))
      );

  // Sort products based on selected option
  const getSortedProducts = (products: typeof filteredProducts) => {
    const sorted = [...products];
    
    switch (productSortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'stock-asc':
        return sorted.sort((a, b) => a.stock - b.stock);
      case 'stock-desc':
        return sorted.sort((a, b) => b.stock - a.stock);
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }
  };

  // Sort variants based on selected option
  const getSortedVariants = (variants: typeof filteredVariants) => {
    const sorted = [...variants];
    
    switch (variantSortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.variantName.localeCompare(b.variantName));
      case 'name-desc':
        return sorted.sort((a, b) => b.variantName.localeCompare(a.variantName));
      case 'price-asc':
        return sorted.sort((a, b) => a.sellingPrice - b.sellingPrice);
      case 'price-desc':
        return sorted.sort((a, b) => b.sellingPrice - a.sellingPrice);
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }
  };

  // Apply sorting to filtered data
  const sortedProducts = getSortedProducts(filteredProducts);
  const sortedVariants = getSortedVariants(filteredVariants);

  // Move any recently inserted item to the end of the displayed list so
  // newly created items appear as the last row regardless of current sort.
  const displayProducts = (() => {
    if (!insertedProductId) return sortedProducts;
    const arr = [...sortedProducts];
    const idx = arr.findIndex((p) => p.id === insertedProductId);
    if (idx >= 0) {
      const [it] = arr.splice(idx, 1);
      arr.push(it);
    }
    return arr;
  })();

  const displayVariants = (() => {
    if (!insertedVariantId) return sortedVariants;
    const arr = [...sortedVariants];
    const idx = arr.findIndex((v) => v.id === insertedVariantId);
    if (idx >= 0) {
      const [it] = arr.splice(idx, 1);
      arr.push(it);
    }
    return arr;
  })();

  // pagination: compute paginated slices and totals
  const categoriesTotal = filteredCategories.length;
  const productsTotal = displayProducts.length;
  const variantsTotal = displayVariants.length;
  const categoriesTotalPages = Math.max(1, Math.ceil(categoriesTotal / CATEGORIES_PAGE_SIZE));
  const productsTotalPages = Math.max(1, Math.ceil(productsTotal / PRODUCTS_PAGE_SIZE));
  const variantsTotalPages = Math.max(1, Math.ceil(variantsTotal / VARIANTS_PAGE_SIZE));

  // Clamp current page
  useEffect(() => {
    if (categoriesPage > categoriesTotalPages) setCategoriesPage(categoriesTotalPages);
  }, [categoriesTotalPages]);
  useEffect(() => {
    if (productsPage > productsTotalPages) setProductsPage(productsTotalPages);
  }, [productsTotalPages]);
  useEffect(() => {
    if (variantsPage > variantsTotalPages) setVariantsPage(variantsTotalPages);
  }, [variantsTotalPages]);

  const displayCategoriesPage = filteredCategories.slice((categoriesPage - 1) * CATEGORIES_PAGE_SIZE, categoriesPage * CATEGORIES_PAGE_SIZE);
  const displayProductsPage = displayProducts.slice((productsPage - 1) * PRODUCTS_PAGE_SIZE, productsPage * PRODUCTS_PAGE_SIZE);
  const displayVariantsPage = displayVariants.slice((variantsPage - 1) * VARIANTS_PAGE_SIZE, variantsPage * VARIANTS_PAGE_SIZE);

  // Reset cut type add dialog when switching tabs
  useEffect(() => {
    if (activeTab !== 'cuttypes' && openCutTypeAdd) {
      setOpenCutTypeAdd(false);
    }
  }, [activeTab]);

  // Clear inserted-item markers when user changes sort, search, or tab
  useEffect(() => {
    setInsertedProductId(null);
  }, [productSortOption, searchQuery, activeTab]);

  useEffect(() => {
    setInsertedVariantId(null);
  }, [variantSortOption, searchQuery, activeTab]);

  // Reset pagination when switching tabs or search changes
  useEffect(() => {
    if (activeTab === 'categories') setCategoriesPage(1);
    if (activeTab === 'products') setProductsPage(1);
    if (activeTab === 'variants') setVariantsPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'categories') setCategoriesPage(1);
    if (activeTab === 'products') setProductsPage(1);
    if (activeTab === 'variants') setVariantsPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Inventory</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-blue-600">
          {tabLabelMap[activeTab] || 'Inventory'}
        </span>
      </div>

     
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage categories, products, variants, cut types, and inventory alerts</p>
        </div>
        <div className="flex gap-3">
          {/* {activeTab === 'variants' && ( */}
            {/*<Button
              className="bg-green-600 hover:bg-green-700 flex items-center"
              onClick={() => setShowAddProductVariant(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product Variant
            </Button> */}
          {/* )} */}
          {!['variants', 'cuttypes', 'inventoryAlerts'].includes(activeTab) && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleOpenAddModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          )}
        </div>
            {/* Add Product Variant Modal/Section */}
            {showAddProductVariant && activeTab === 'variants' && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl relative">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
                    onClick={() => setShowAddProductVariant(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <AddProductVariant onBack={() => setShowAddProductVariant(false)} />
                </div>
              </div>
            )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
          <TabsTrigger className="min-w-[240px] flex-1" value="categories">Categories</TabsTrigger>
          <TabsTrigger className="min-w-[240px] flex-1" value="products">Products</TabsTrigger>
          <TabsTrigger className="min-w-[240px] flex-1" value="variants">Product Variants</TabsTrigger>
          <TabsTrigger className="min-w-[300px] flex-1" value="cuttypes">Cut Types</TabsTrigger>
          <TabsTrigger className="min-w-[300px] flex-1" value="inventoryAlerts">Inventory Alerts</TabsTrigger>
        </TabsList>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search categories..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Categories ({filteredCategories.length} of {categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  {categoriesTotal === 0
                    ? 'Showing 0 of 0'
                    : `Showing ${(categoriesPage - 1) * CATEGORIES_PAGE_SIZE + 1} - ${Math.min(categoriesPage * CATEGORIES_PAGE_SIZE, categoriesTotal)} of ${categoriesTotal}`}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="px-3 py-1" onClick={() => setCategoriesPage(p => Math.max(1, p - 1))} disabled={categoriesPage === 1}>Prev</Button>
                  <div className="text-sm">Page {categoriesPage} of {categoriesTotalPages}</div>
                  <Button variant="outline" className="px-3 py-1" onClick={() => setCategoriesPage(p => Math.min(categoriesTotalPages, p + 1))} disabled={categoriesPage === categoriesTotalPages}>Next</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Reorder</th>
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Species Icon</th>
                      <th className="text-left py-3 px-4">Species Name</th>
                      <th className="text-left py-3 px-4">Availability</th>
                      <th className="text-left py-3 px-4">Date Created</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      categoriesLoading ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">
                            <div className="inline-flex items-center gap-2">
                              <Loader className="w-4 h-4 animate-spin" />
                              Loading categories...
                            </div>
                          </td>
                        </tr>
                      ) : categoriesError ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-red-600">{categoriesError}</td>
                        </tr>
                      ) : filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-gray-500">No categories found</td>
                        </tr>
                      ) : (
                        displayCategoriesPage.map((category, index) => {
                          const originalIndex = categories.findIndex((cat) => cat.id === category.id);
                          const isDragging = draggedCategoryIndex === originalIndex;
                          const isDragOver = dragOverCategoryIndex === originalIndex;
                          return (
                          <tr 
                            key={category.id} 
                            className={`border-b border-gray-100 transition-all ${
                              isDragging ? 'opacity-50 bg-blue-50' : 
                              isDragOver ? 'bg-blue-100 border-blue-300' : 
                              'hover:bg-gray-50'
                            }`}
                            draggable={!isReordering}
                            onDragStart={() => handleDragStart(originalIndex)}
                            onDragOver={(e) => handleDragOver(e, originalIndex)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, originalIndex)}
                            onDragEnd={handleDragEnd}
                            style={{ cursor: isReordering ? 'not-allowed' : 'grab' }}
                          >
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => moveCategory(originalIndex, 'up')}
                                  disabled={originalIndex === 0 || isReordering}
                                  className={`p-1 rounded ${originalIndex === 0 || isReordering ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveCategory(originalIndex, 'down')}
                                  disabled={originalIndex === categories.length - 1 || isReordering}
                                  className={`p-1 rounded ${originalIndex === categories.length - 1 || isReordering ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4">{originalIndex + 1}</td>
                            <td className="py-3 px-4">
                              {typeof category.icon === 'string' && (category.icon.startsWith('http') || category.icon.startsWith('/')) ? (
                                <ImageWithFallback src={category.icon} alt={String(category.name)} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <span className="text-3xl">{category.icon}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">{category.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant={category.availability === 'Available' ? 'default' : 'secondary'}>
                                {category.availability}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">{category.dateCreated}</td>
                            <td className="py-3 px-4">{category.lastUpdated}</td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button onClick={() => handleViewCategory(String(category.id))} className="p-1 hover:bg-gray-100 rounded" title="View category details">
                                  <Eye className="w-4 h-4 text-gray-600" />
                                </button>
                                <button onClick={() => handleEditCategory(category)} className="p-1 hover:bg-gray-100 rounded" title="Edit category">
                                  <Edit className="w-4 h-4 text-blue-600" />
                                </button>
                                <button onClick={() => {
                                  setSelectedItem(category);
                                  setShowDeleteDialog(true);
                                }} className="p-1 hover:bg-gray-100 rounded" title="Delete category">
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  {category.availability === 'Available' ? (
                                    <ToggleRight className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )})
                      )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search products by name or species..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Select value={productSortOption} onValueChange={setProductSortOption}>
                  <SelectTrigger className="w-[220px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Filters</SelectItem>
                    <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                    <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
                    <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Products ({sortedProducts.length} of {products.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">Showing {(productsPage - 1) * PRODUCTS_PAGE_SIZE + 1} - {Math.min(productsPage * PRODUCTS_PAGE_SIZE, displayProducts.length)} of {displayProducts.length}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="px-3 py-1" onClick={() => setProductsPage(p => Math.max(1, p - 1))} disabled={productsPage === 1}>Prev</Button>
                  <div className="text-sm">Page {productsPage} of {productsTotalPages}</div>
                  <Button variant="outline" className="px-3 py-1" onClick={() => setProductsPage(p => Math.min(productsTotalPages, p + 1))} disabled={productsPage === productsTotalPages}>Next</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Reorder</th>
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Product Image</th>
                      <th className="text-left py-3 px-4">Product Name</th>
                      <th className="text-left py-3 px-4">Species</th>
                      <th className="text-left py-3 px-4">Cut Types</th>
                      <th className="text-left py-3 px-4">Available Weights</th>
                      <th className="text-left py-3 px-4">Available Stock</th>
                      <th className="text-left py-3 px-4">Cost Price (<span className="dirham-symbol">&#xea;</span>/KG)</th>
                      <th className="text-left py-3 px-4">Default Profit %</th>
                      <th className="text-left py-3 px-4">Default Discount %</th>
                      {/* <th className="text-left py-3 px-4">Featured</th> */}
                      {/* <th className="text-left py-3 px-4">Best Seller</th> */}
                      {/* <th className="text-left py-3 px-4">Express Delivery</th> */}
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsLoading ? (
                      <tr>
                        <td colSpan={15} className="py-8 text-center text-gray-500">
                          <div className="inline-flex items-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            Loading products...
                          </div>
                        </td>
                      </tr>
                    ) : productsError ? (
                      <tr>
                        <td colSpan={15} className="py-8 text-center text-red-600">{productsError}</td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="py-8 text-center text-gray-500">No products found</td>
                      </tr>
                    ) : displayProductsPage.map((product, pageIndex) => {
                      const originalIndex = products.findIndex((p) => p.id === product.id);
                      const index = (productsPage - 1) * PRODUCTS_PAGE_SIZE + pageIndex;
                      return (
                      <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveProduct(originalIndex, 'up')}
                              disabled={originalIndex === 0}
                              className={`p-1 rounded ${originalIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveProduct(originalIndex, 'down')}
                              disabled={originalIndex === products.length - 1}
                              className={`p-1 rounded ${originalIndex === products.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">
                          <ImageWithFallback
                            src={product.image || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </td>
                        <td className="py-3 px-4">{product.name}</td>
                        <td className="py-3 px-4">{product.species}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.cutTypes.slice(0, 2).map((ct, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-gray-100 text-orange-600">
                                {ct}
                              </Badge>
                            ))}
                            {product.cutTypes.length > 2 && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-600">
                                +{product.cutTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {product.availableWeights && product.availableWeights.length > 0 ? (
                              <>
                                {product.availableWeights.slice(0, 3).map((weight, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-600">
                                    {weight}{product.weightUnit || 'g'}
                                  </Badge>
                                ))}
                                {product.availableWeights.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.availableWeights.length - 3}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.stock} KG</td>
                        <td className="py-3 px-4"><div className="flex items-center"><span className="dirham-symbol mr-2">&#xea;</span>{product.costPrice}</div></td>
                        <td className="py-3 px-4">{product.profit}%</td>
                        <td className="py-3 px-4">{product.discount}%</td>
                        {/* <td className="py-3 px-4"> 
                          <Badge variant={product.featured ? 'default' : 'outline'} className={product.featured ? 'bg-yellow-100 text-yellow-800 text-xs' : 'bg-red-100 text-red-600'}>
                            {product.featured ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={product.bestseller ? 'default' : 'outline'} className={product.bestseller ? 'bg-green-100 text-green-800 hover:bg-green-700' : ' bg-red-100 text-red-800'}>
                            {product.bestseller ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={product.isExpressDelivery ? 'default' : 'outline'} className={product.isExpressDelivery ? 'bg-blue-100 text-blue-800 text-xs' : ' bg-red-100 text-red-600'}>
                            {product.isExpressDelivery ? 'Yes' : 'No'}
                          </Badge>
                        </td>*/}
                        <td className="py-3 px-4">
                          <Badge variant={product.status === 'Active' ? 'default' : 'destructive'}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit product"
                              onClick={async () => {
                                // Prefill form for editing
                                const resolvedCategoryId = getCategoryIdForProduct(product);
                                const formData = {
                                  category: resolvedCategoryId,
                                  productName: product.name,
                                  productImage: null,
                                  existingImage: product.imagePath || '',
                                  existingImageUrl: product.image || '',
                                  description: product.description || '',
                                  nutritionFacts: product.nutritionFacts || '',
                                  cutTypes: product.cutTypeIds || [],
                                  currentCutType: '',
                                  availableWeights: product.availableWeights || [],
                                  currentWeight: '',
                                  availableStock: String(product.stock ?? ''),
                                  defaultProfit: String(product.profit ?? ''),
                                  defaultDiscount: String(product.discount ?? ''),
                                  costPricePerKg: String(product.costPrice ?? ''),
                                  availability: product.availability ?? (product.status === 'Active'),
                                  featured: product.featured ?? false,
                                  bestseller: product.bestseller ?? false,
                                  isExpressDelivery: product.isExpressDelivery ?? false
                                };
                                setEditingProductId(product.id);
                                setProductForm(formData);
                                setOriginalProductForm({
                                  category: formData.category,
                                  productName: formData.productName,
                                  productImage: null,
                                  existingImage: formData.existingImage,
                                  description: formData.description,
                                  nutritionFacts: formData.nutritionFacts,
                                  cutTypes: [...formData.cutTypes],
                                  availableWeights: [...formData.availableWeights],
                                  availableStock: formData.availableStock,
                                  defaultProfit: formData.defaultProfit,
                                  defaultDiscount: formData.defaultDiscount,
                                  costPricePerKg: formData.costPricePerKg,
                                  availability: formData.availability,
                                  featured: formData.featured,
                                  bestseller: formData.bestseller,
                                  isExpressDelivery: formData.isExpressDelivery
                                });

                                // Filter variants for this product to populate pricing table
                                const productVariants = variants.filter(v => v.product === product.name);
                                
                                if (productVariants.length > 0) {
                                  const variantRows: typeof productVariantRows = {};
                                  const cutTypeImages: typeof productCutTypeImages = {};
                                  const existingImages: typeof existingCutTypeImages = {};
                                  const variantIds: typeof existingVariantIds = {};

                                  productVariants.forEach(v => {
                                    // Use the cutTypeId from variant if available, otherwise find it from cutTypesData
                                    let cutTypeId = v.cutTypeId;
                                    if (!cutTypeId) {
                                      const cutTypeData = cutTypesData.find(ct => ct.name === v.cutType);
                                      cutTypeId = cutTypeData?._id || v.cutType;
                                    }
                                    
                                    const rowKey = getVariantRowKey(cutTypeId, v.weight);
                                    variantRows[rowKey] = {
                                      costPricePerKg: String(v.costPrice),
                                      profitPercent: String(v.profit),
                                      displayPrice: String(v.displayPrice),
                                      discountPercent: String(v.discount),
                                      sellingPrice: String(v.sellingPrice),
                                      featured: v.featured,
                                      bestSeller: v.bestSeller,
                                      expressDelivery: v.isExpressDelivery,
                                      nextDayDelivery: v.isNextDayDelivery,
                                      festivOffer: v.special,
                                      notes: v.notes || ''
                                    };
                                    
                                    // Store existing variant ID for updates
                                    variantIds[rowKey] = v.id;
                                    
                                    // Store existing image PATH (not full URL) for this cut type
                                    if (v.imagePath && !existingImages[cutTypeId]) {
                                      // Store full URL for display
                                      const imageUrl = IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.imagePath}` : v.imagePath;
                                      existingImages[cutTypeId] = imageUrl;
                                    }
                                  });

                                  setProductVariantRows(variantRows);
                                  setProductCutTypeImages(cutTypeImages);
                                  setExistingCutTypeImages(existingImages);
                                  setExistingVariantIds(variantIds);
                                }

                                setShowAddModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Delete product"
                              onClick={() => {
                                setSelectedItem(product);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search variants..."
                    className="pl-10 pr-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Select value={variantSortOption} onValueChange={setVariantSortOption}>
                  <SelectTrigger className="w-[220px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Filters</SelectItem>
                    <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z to A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Product Variants ({sortedVariants.length} of {variants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">Showing {(variantsPage - 1) * VARIANTS_PAGE_SIZE + 1} - {Math.min(variantsPage * VARIANTS_PAGE_SIZE, displayVariants.length)} of {displayVariants.length}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="px-3 py-1" onClick={() => setVariantsPage(p => Math.max(1, p - 1))} disabled={variantsPage === 1}>Prev</Button>
                  <div className="text-sm">Page {variantsPage} of {variantsTotalPages}</div>
                  <Button variant="outline" className="px-3 py-1" onClick={() => setVariantsPage(p => Math.min(variantsTotalPages, p + 1))} disabled={variantsPage === variantsTotalPages}>Next</Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {/* <th className="text-left py-3 px-4">Reorder</th> */}
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Image</th>
                      {/* <th className="text-left py-3 px-4">Variant Name</th> */}
                      <th className="text-left py-3 px-4">Product Name</th>
                      <th className="text-left py-3 px-4">Species</th>
                      <th className="text-left py-3 px-4">Cut Type</th>
                      <th className="text-left py-3 px-4">Weight (g)</th>
                      <th className="text-left py-3 px-4">Featured</th>
                      <th className="text-left py-3 px-4">Best Seller</th>
                      <th className="text-left py-3 px-4">Express Delivery</th>
                      <th className="text-left py-3 px-4">Next Day Delivery</th>
                      <th className="text-left py-3 px-4">Festive Offer</th>
                      <th className="text-left py-3 px-4">Cost Price (<span className="dirham-symbol">&#xea;</span>)</th>
                      <th className="text-left py-3 px-4">Profit %</th>
                      <th className="text-left py-3 px-4">Display Price (<span className="dirham-symbol">&#xea;</span>)</th>
                      <th className="text-left py-3 px-4">Discount %</th>
                      <th className="text-left py-3 px-4">Selling Price (<span className="dirham-symbol">&#xea;</span>)</th>
                      <th className="text-left py-3 px-4">Status</th>
                      {/* <th className="text-left py-3 px-4">Last Updated</th> */}
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVariants.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="py-8 text-center text-gray-500">Variants Loading</td>
                      </tr>
                    ) : displayVariantsPage.map((variant, pageIndex) => {
                      const originalIndex = variants.findIndex((v) => v.id === variant.id);
                      const index = (variantsPage - 1) * VARIANTS_PAGE_SIZE + pageIndex;
                      return (
                      <tr key={variant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        {/* <td className="py-3 px-4">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveVariant(originalIndex, 'up')}
                              disabled={originalIndex === 0}
                              className={`p-1 rounded ${originalIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveVariant(originalIndex, 'down')}
                              disabled={originalIndex === variants.length - 1}
                              className={`p-1 rounded ${originalIndex === variants.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-200 text-gray-600'}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </td> */}
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">
                          {variant.image ? (
                            <ImageWithFallback
                              src={variant.image}
                              alt={variant.variantName}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                          )}
                        </td>
                        {/* <td className="py-3 px-4">{variant.variantName}</td> */}
                        <td className="py-3 px-4">{variant.product}</td>
                        <td className="py-3 px-4">{variant.species}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">{variant.cutType}</Badge>
                        </td>
                        <td className="py-3 px-4" title={`${variant.weight}g`}>
                          <Badge variant="secondary" className="text-xs">{variant.weight}g</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {variant.featured ? (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Yes</Badge>
                          ) : (
                            <Badge className="text-white bg-red-600 font-medium text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.bestSeller ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Yes</Badge>
                          ) : (
                            <Badge className="text-white bg-red-600 font-medium text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.isExpressDelivery ? (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Yes</Badge>
                          ) : (
                            <Badge  className="text-white bg-red-600 font-medium text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.isNextDayDelivery ? (
                            <Badge className="bg-purple-100 text-purple-800 text-xs">Yes</Badge>
                          ) : (
                            <Badge  className="text-white bg-red-600 font-medium text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.special ? (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Yes</Badge>
                          ) : (
                            <Badge  className="text-white bg-red-600 font-medium text-xs">No</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4"><div className="flex items-center"><span className="dirham-symbol mr-2">&#xea;</span>{variant.costPrice}</div></td>
                        <td className="py-3 px-4">{variant.profit}%</td>
                        <td className="py-3 px-4"><div className="flex items-center"><span className="dirham-symbol mr-2">&#xea;</span>{variant.displayPrice}</div></td>
                        <td className="py-3 px-4">{variant.discount}%</td>
                        <td className="py-3 px-4"><div className="flex items-center"><span className="dirham-symbol mr-2">&#xea;</span>{Number(variant.sellingPrice).toFixed(2)}</div></td>
                        <td className="py-3 px-4">
                          <Badge variant={variant.status === 'Active' ? 'default' : 'destructive'}>
                            {variant.status}
                          </Badge>
                        </td>
                        {/* <td className="py-3 px-4">{variant.lastUpdated}</td> */}
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleViewVariant(variant.id)}
                              title="View variant"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleEditVariant(variant.id)}
                              title="Edit variant"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Delete variant"
                              onClick={() => {
                                setSelectedItem(variant);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})
                  }
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cut Types Tab */}
        <TabsContent value="cuttypes" className="space-y-4">
          <CutTypeSection openAdd={openCutTypeAdd} onAddClose={() => setOpenCutTypeAdd(false)} resetAdd={() => setOpenCutTypeAdd(false)} />
        </TabsContent>

        {/* Inventory Alerts Tab */}
        <TabsContent value="inventoryAlerts" className="space-y-4">
          <InventoryAlerts />
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          setEditingProductId(null);
          setEditingVariantId(null);
        }
        setShowAddModal(open);
      }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] w-[90vw]" onInteractOutside={(e: any) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>
              { activeTab === 'products'
                ? (editingProductId ? 'Edit' : 'Add New')
                : activeTab === 'variants'
                ? (editingVariantId ? 'Edit' : 'Add New')
                : 'Add New'} {tabLabelMap[activeTab] || 'Item'}
            </DialogTitle>
          </DialogHeader>
          {activeTab === 'categories' && renderCategoryModal()}
          {activeTab === 'products' && renderProductModal()}
          {activeTab === 'variants' && renderVariantModal()}
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>View Product Variant</DialogTitle>
          </DialogHeader>
          <div style={{ maxHeight: '75vh', overflowY: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 24 }}>
            {/* Content for viewing product variant details */}
            {viewingVariant && (
              <div className="space-y-4">
                {/* Variant Image */}
                {viewingVariant.image && (
                  <div className="flex mt-4 justify-center">
                    <ImageWithFallback
                      src={viewingVariant.image}
                      alt={viewingVariant.name}
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  {/* <div> 
                    <Label className="text-gray-600">Variant Name</Label>
                    <p className="font-medium">{viewingVariant.name}</p>
                  </div>*/}
                  
                </div>

                {/* Product & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Product</Label>
                    <p className="font-medium">{viewingVariant.productName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Category/Species</Label>
                    <p className="font-medium">{viewingVariant.categoryName}</p>
                  </div>
                </div>

                {/* Cut Type */}
                <div>
                  <Label className="text-gray-600">Cut Type</Label>
                  <p className="font-medium">{viewingVariant.cutTypeName}</p>
                </div>

                {/* Weight and Cost Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Weight (g)</Label>
                    <p className="font-medium">{viewingVariant.weight}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Cost Price per kg</Label>
                    <p className="font-medium"><span className="dirham-symbol">&#xea;</span> {parseFloat(String(viewingVariant.costPrice)).toFixed(2)}</p>
                  </div>
                </div>

                {/* Badges - Variant Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Featured</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.featured ? 'default' : 'secondary'} className="text-xs">
                        {viewingVariant.featured ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Best Seller</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.bestSeller ? 'default' : 'secondary'} className="text-xs">
                        {viewingVariant.bestSeller ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Delivery and Special Offer Options */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">Express Delivery</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.isExpressDelivery ? 'default' : 'secondary'} className="text-xs">
                        {viewingVariant.isExpressDelivery ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Next Day Delivery</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.isNextDayDelivery ? 'default' : 'secondary'} className="text-xs">
                        {viewingVariant.isNextDayDelivery ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Special Offer</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.isSpecial ? 'default' : 'secondary'} className="text-xs">
                        {viewingVariant.isSpecial ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Pricing Information Table */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-blue-900">Pricing Table Details</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Cost Price (per kg)</Label>
                        <Input
                          type="number"
                          value={parseFloat(String(viewingVariant.costPrice)).toFixed(2)}
                          readOnly
                          className="bg-gray-100 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-600">Profit %</Label>
                        <Input
                          type="number"
                          value={parseFloat(String(viewingVariant.profit)).toFixed(2)}
                          readOnly
                          className="bg-gray-100 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">Display Price</Label>
                        <Input
                          type="number"
                          value={parseFloat(String(viewingVariant.displayPrice)).toFixed(2)}
                          readOnly
                          className="bg-gray-100 mt-1 font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-600">Discount %</Label>
                        <Input
                          type="number"
                          value={parseFloat(String(viewingVariant.discount)).toFixed(2)}
                          readOnly
                          className="bg-gray-100 mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Selling Price (Final)</Label>
                      <Input
                        type="number"
                        value={parseFloat(String(viewingVariant.sellingPrice)).toFixed(2)}
                        readOnly
                        className="bg-green-100 mt-1 font-semibold text-green-700"
                      />
                    </div>
                  </div>
                
                 </div>
                {/* Notes */}
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="mt-1 text-gray-800">{viewingVariant.notes}</p>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">Date Created</Label>
                    <p className="font-medium">{viewingVariant.dateCreated}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <Badge variant={viewingVariant.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {viewingVariant.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-gray-600">Last Updated</Label>
                    <p className="font-medium">{viewingVariant.lastUpdated}</p>
                  </div>
               
              </div>
          </div>
         )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Category Dialog */}
      <Dialog open={showCategoryViewModal} onOpenChange={setShowCategoryViewModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {isLoadingCategoryView ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : viewingCategory ? (
            <div className="space-y-4">
              {/* Category Icon and Name */}
              <div className="flex gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Category Icon</Label>
                  <div className="mt-2">
                    {typeof viewingCategory.icon === 'string' && (viewingCategory.icon.includes('http') || viewingCategory.icon.includes('/')) ? (
                      <ImageWithFallback 
                        src={viewingCategory.icon} 
                        alt={viewingCategory.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <span className="text-3xl">{viewingCategory.icon}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-gray-600">Category Name</Label>
                  <p className="mt-2 text-base font-medium">{viewingCategory.name}</p>
                </div>
              </div>

              {/* Description */}
              {viewingCategory.description && (
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Description</Label>
                  <p className="mt-1 text-sm text-gray-700">{viewingCategory.description}</p>
                </div>
              )}

              {/* Status, Order, Date Created - in grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge variant={viewingCategory.status === 'Active' ? 'default' : 'secondary'} className="text-xs">
                      {viewingCategory.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">Order</Label>
                  <p className="mt-1 text-sm text-gray-700">{viewingCategory.order}</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-600">Date Created</Label>
                  <p className="mt-1 text-sm text-gray-700">{viewingCategory.dateCreated}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCategoryViewModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {activeTab === 'categories' ? 'category' : activeTab === 'products' ? 'product' : 'product variant'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeTab === 'categories') {
                  handleDeleteCategory();
                } else if (activeTab === 'products') {
                  handleDeleteProduct();
                } else if (activeTab === 'variants') {
                  handleDeleteVariant();
                }
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
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

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </div>
    </div>
  );
}