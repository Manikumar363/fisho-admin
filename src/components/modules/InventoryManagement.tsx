import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, ChevronRight, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, GripVertical, Eye, Loader } from 'lucide-react';
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
import { apiFetch } from '../../lib/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CutTypeSection from './inventory/CutTypeSection';

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

  // Category state
  const [categoryForm, setCategoryForm] = useState({
    speciesName: '',
    speciesIcon: null as File | null,
    existingIcon: '',
    existingIconUrl: '',
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
    variantName: '',
    variantImage: null as File | null,
    existingImage: '',
    existingImageUrl: '',
    cutType: '',
    featured: false,
    bestSeller: false,
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
    }
  }, [activeTab]);

  // Load variants when Variants tab is active
  useEffect(() => {
    if (activeTab === 'variants') {
      fetchVariants();
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
          discount: number;
          displayPrice: number;
          sellingPrice: number;
          isActive: boolean;
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

        return {
          id: v._id,
          variantName: v.name,
          product: v.product?.name || '—',
          species,
          cutType: v.cutType?.name || '—',
          featured: v.featured || false,
          bestSeller: v.bestSeller || false,
          costPrice: v.product?.cost || 0,
          profit: v.profit || 0,
          discount: v.discount || 0,
          displayPrice: v.displayPrice || 0,
          sellingPrice: v.sellingPrice || 0,
          notes: v.notes,
          image: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : undefined,
          status: v.isActive ? 'Active' : 'Inactive',
          lastUpdated: new Date(v.updatedAt).toISOString().split('T')[0],
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
    featured: boolean;
    bestSeller: boolean;
    costPrice: number;
    profit: number;
    discount: number;
    displayPrice: number;
    sellingPrice: number;
    notes?: string;
    status: string;
    lastUpdated: string;
    image?: string;
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
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newProducts.length) return;
    
    [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
    setProducts(newProducts);
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
      return {
        ...prev,
        cutTypes: [...prev.cutTypes, cutTypeId],
        currentCutType: '' // Reset after add
      };
    });
  };

  const handleRemoveCutType = (cutTypeId: string) => {
    setProductForm((prev) => ({
      ...prev,
      cutTypes: prev.cutTypes.filter((id) => id !== cutTypeId),
    }));
  };

  const handleAddWeight = () => {
    const weight = parseFloat(productForm.currentWeight);
    if (!isNaN(weight) && weight > 0 && !productForm.availableWeights.includes(weight)) {
      setProductForm({
        ...productForm,
        availableWeights: [...productForm.availableWeights, weight],
        currentWeight: ''
      });
    }
  };

  const handleRemoveWeight = (weight: number) => {
    setProductForm({
      ...productForm,
      availableWeights: productForm.availableWeights.filter(w => w !== weight)
    });
  };

  // Auto-calculate variant prices
  const calculateVariantPrices = (costPrice: number, profit: number, discount: number) => {
    const displayPrice = costPrice + (costPrice * profit / 100);
    const sellingPrice = displayPrice - (displayPrice * discount / 100);
    return { displayPrice: displayPrice.toFixed(2), sellingPrice: sellingPrice.toFixed(2) };
  };

  const handleEditCategory = (category: any) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      speciesName: category.name,
      speciesIcon: null,
      existingIcon: category.iconPath || '',
      existingIconUrl: typeof category.icon === 'string' && category.icon !== '🗂️' ? category.icon : '',
      availability: category.availability === 'Available'
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
        description: res.category.description || 'N/A',
        status: res.category.isActive ? 'Active' : 'Inactive',
        isDeleted: res.category.isDeleted,
        dateCreated: new Date(res.category.createdAt).toISOString().split('T')[0],
        lastUpdated: new Date(res.category.updatedAt).toISOString().split('T')[0],
        slug: res.category.slug || 'N/A',
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
          featured: boolean;
          bestSeller: boolean;
          notes?: string;
          displayPrice: number;
          sellingPrice: number;
          profit: number;
          discount: number;
          isActive: boolean;
          isDeleted: boolean;
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
        featured: v.featured,
        bestSeller: v.bestSeller,
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
    // Find variant in list
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    // Fetch full variant details from API to get product and category IDs
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
          discount: number;
          displayPrice: number;
          sellingPrice: number;
          isActive: boolean;
        };
        message?: string;
      }>(`/api/variants/${variantId}`);

      if (!res.success || !res.variant) {
        toast.error('Failed to load variant details');
        return;
      }

      const v = res.variant;
      
      // Extract category ID from product
      let categoryId = '';
      if (v.product?.category) {
        if (typeof v.product.category === 'object') {
          categoryId = v.product.category._id;
        } else {
          categoryId = v.product.category;
        }
      }

      // Set editing state
      setEditingVariantId(variantId);
      
      // Populate form with variant data
      setVariantForm({
        species: categoryId,
        product: v.product._id,
        variantName: v.name,
        variantImage: null,
        existingImage: v.image || '',
        existingImageUrl: v.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${v.image}` : v.image) : '',
        cutType: v.cutType._id,
        featured: v.featured,
        bestSeller: v.bestSeller,
        profit: String(v.profit),
        displayPrice: String(v.displayPrice),
        discount: String(v.discount),
        sellingPrice: String(v.sellingPrice),
        notes: v.notes || '',
        availability: v.isActive
      });

      setShowAddModal(true);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load variant details';
      console.error('Edit variant error:', e);
      toast.error(msg);
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
    setCategoryForm({ speciesName: '', speciesIcon: null, existingIcon: '', existingIconUrl: '', availability: true });
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
      availability: true
    });
    setVariantForm({
      species: '',
      product: '',
      variantName: '',
      variantImage: null,
      existingImage: '',
      existingImageUrl: '',
      cutType: '',
      featured: false,
      bestSeller: false,
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

        setCategoryForm({ speciesName: '', speciesIcon: null, existingIcon: '', existingIconUrl: '', availability: true });
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
      // Validate product form
      if (!productForm.category) {
        toast.error('Please select a category');
        return;
      }
      if (!productForm.productName.trim()) {
        toast.error('Product name is required');
        return;
      }
      if (!editingProductId && !productForm.productImage) {
        toast.error('Product image is required');
        return;
      }
      if (!productForm.description.trim()) {
        toast.error('Description is required');
        return;
      }
      if (!productForm.nutritionFacts.trim()) {
        toast.error('Nutrition facts are required');
        return;
      }
      if (productForm.cutTypes.length === 0) {
        toast.error('At least one cut type is required');
        return;
      }
      if (productForm.availableWeights.length === 0) {
        toast.error('At least one weight is required');
        return;
      }
      if (!productForm.availableStock || parseFloat(productForm.availableStock) <= 0) {
        toast.error('Valid stock amount is required');
        return;
      }
      if (!productForm.costPricePerKg || parseFloat(productForm.costPricePerKg) <= 0) {
        toast.error('Valid cost price is required');
        return;
      }
      if (!productForm.defaultProfit || parseFloat(productForm.defaultProfit) < 0) {
        toast.error('Valid default profit is required');
        return;
      }
      if (!productForm.defaultDiscount || parseFloat(productForm.defaultDiscount) < 0) {
        toast.error('Valid default discount is required');
        return;
      }

      setIsSubmitting(true);
      try {
        const endpoint = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
        const method = editingProductId ? 'PUT' : 'POST';

        // Always use FormData for both POST and PUT to match backend
        // behavior (works in Postman with multipart/form-data).
        const formData = new FormData();
        formData.append('name', productForm.productName.trim());
        formData.append('description', productForm.description.trim());
        formData.append('nutritionFacts', productForm.nutritionFacts.trim());
        formData.append('category', productForm.category);
        formData.append('stock', productForm.availableStock);
        formData.append('cost', productForm.costPricePerKg);
        formData.append('defaultProfit', productForm.defaultProfit);
        formData.append('defaultDiscount', productForm.defaultDiscount);
        formData.append('isActive', String(productForm.availability));
        if (productForm.productImage) {
          formData.append('image', productForm.productImage);
        } else if (productForm.existingImage) {
          // Preserve existing image on edit when no new file is provided
          formData.append('existingImage', productForm.existingImage);
        }
        productForm.cutTypes.forEach((cutTypeId) => {
          formData.append('availableCutTypes[]', cutTypeId);
        });
        productForm.availableWeights.forEach((weight) => {
          formData.append('availableWeights[]', String(weight));
        });
        const requestInit: RequestInit = { method, body: formData };

        const res = await apiFetch<{ success: boolean; product?: any; message?: string }>(endpoint, requestInit);

        if (!res.success) throw new Error(res.message || (editingProductId ? 'Failed to update product' : 'Failed to add product'));
        if (!res.product) throw new Error('No product data in response');

        toast.success(res.message || (editingProductId ? 'Product updated successfully' : 'Product added successfully'));
        setShowAddModal(false);
        
        // Reset form
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
          availability: true
        });
        setEditingProductId(null);
        
        // Refresh products list
        fetchProducts();
      } catch (e: any) {
        const msg = e?.message || (editingProductId ? 'Failed to update product' : 'Failed to add product');
        console.error('Add product error:', e);
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
      if (!variantForm.variantName.trim()) {
        toast.error('Variant name is required');
        return;
      }
      if (!editingVariantId && !variantForm.variantImage) {
        toast.error('Variant image is required');
        return;
      }
      if (!variantForm.cutType) {
        toast.error('Please select a cut type');
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
        const endpoint = isEdit ? `/api/variants/${editingVariantId}` : '/api/variants';
        const method = isEdit ? 'PUT' : 'POST';

        const formData = new FormData();
        formData.append('name', variantForm.variantName.trim());
        if (variantForm.variantImage) {
          formData.append('image', variantForm.variantImage);
        } else if (variantForm.existingImage) {
          // Preserve existing image on edit when no new file is provided
          formData.append('existingImage', variantForm.existingImage);
        }
        formData.append('product', variantForm.product); // product id
        formData.append('cutType', variantForm.cutType); // cut type id
        formData.append('profit', variantForm.profit);
        formData.append('discount', variantForm.discount);
        formData.append('notes', variantForm.notes.trim());
        formData.append('featured', String(variantForm.featured));
        formData.append('bestSeller', String(variantForm.bestSeller));
        formData.append('displayPrice', String(display));
        formData.append('sellingPrice', String(selling));
        formData.append('isActive', String(variantForm.availability));

        const res = await apiFetch<{
          success: boolean;
          variant?: any;
          message?: string;
        }>(endpoint, {
          method,
          body: formData,
        });

        if (!res.success) throw new Error(res.message || (isEdit ? 'Failed to update variant' : 'Failed to create variant'));

        toast.success(res.message || (isEdit ? 'Variant updated successfully' : 'Variant created successfully'));
        setShowAddModal(false);

        // Reset form
        setVariantForm({
          species: '',
          product: '',
          variantName: '',
          variantImage: null,
          existingImage: '',
          existingImageUrl: '',
          cutType: '',
          featured: false,
          bestSeller: false,
          profit: '',
          displayPrice: '',
          discount: '',
          sellingPrice: '',
          notes: '',
          availability: true
        });
        setEditingVariantId(null);

        // Refresh variants list
        fetchVariants();
      } catch (e: any) {
        const msg = e?.message || (editingVariantId ? 'Failed to update variant' : 'Failed to create variant');
        console.error(editingVariantId ? 'Update variant error:' : 'Create variant error:', e);
        toast.error(msg);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderCategoryModal = () => {
    const isEdit = editingCategoryId !== null;
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
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
          {categoryForm.existingIconUrl && !categoryForm.speciesIcon && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
              <ImageWithFallback
                src={categoryForm.existingIconUrl}
                alt={categoryForm.speciesName || 'Current category icon'}
                className="w-14 h-14 rounded object-cover border"
              />
              <span>Current icon will be kept unless you upload a new one.</span>
            </div>
          )}
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
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
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
      <h2 className="text-lg font-semibold mb-4">{editingProductId ? 'Edit Product' : 'Add New Products'}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Select Category *</Label>
          <Select 
            value={productForm.category} 
            onValueChange={(value: string) => setProductForm({ ...productForm, category: value })}
            disabled={isSubmitting || categoriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose category" />
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
          <Label htmlFor="productName">Product Name *</Label>
          <Input
            id="productName"
            value={productForm.productName}
            onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
            placeholder="e.g., Tiger Prawns"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="productImage">Product Image {!editingProductId && '*'}</Label>
        <Input
          id="productImage"
          type="file"
          accept="image/*"
          onChange={(e) => setProductForm({ ...productForm, productImage: e.target.files?.[0] || null })}
          required={!editingProductId}
          disabled={isSubmitting}
        />
        {productForm.existingImageUrl && !productForm.productImage && (
          <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
            <ImageWithFallback
              src={productForm.existingImageUrl}
              alt={productForm.productName || 'Current product image'}
              className="w-14 h-14 rounded object-cover border"
            />
            <span>Current image will be kept unless you upload a new one.</span>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={productForm.description}
          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          placeholder="Enter product description, origin, characteristics..."
          rows={3}
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label htmlFor="nutritionFacts">Nutrition Facts *</Label>
        <Textarea
          id="nutritionFacts"
          value={productForm.nutritionFacts}
          onChange={(e) => setProductForm({ ...productForm, nutritionFacts: e.target.value })}
          placeholder="Enter nutritional information (e.g., Protein: 20g per 100g, Omega-3: 500mg...)"
          rows={3}
          required
          disabled={isSubmitting}
        />
      </div>

      <div>
        <Label>Available Cut Types *</Label>
        <div className="space-y-2">
          <Select
            value={productForm.currentCutType}
            onValueChange={(value) => {
              // Single functional update to avoid overwriting state
              setProductForm((prev) => {
                if (!value || value === '__empty__' || prev.cutTypes.includes(value)) {
                  return { ...prev, currentCutType: '' };
                }
                return {
                  ...prev,
                  cutTypes: [...prev.cutTypes, value],
                  currentCutType: ''
                };
              });
            }}
            disabled={isSubmitting || loadingCutTypes}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cut types to add" />
            </SelectTrigger>
            <SelectContent>
                  {cutTypesData.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No cut types found
                    </SelectItem>
                  ) : (
                    cutTypesData.map((ct) => (
                      <SelectItem 
                        key={ct._id} 
                        value={ct._id}
                        disabled={productForm.cutTypes.includes(ct._id)}
                      >
                        {ct.name}
                      </SelectItem>
                    ))
                  )}
            </SelectContent>
          </Select>
          {productForm.cutTypes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {productForm.cutTypes.map((cutTypeId: string) => {
                const cutType = cutTypesData.find(ct => ct._id === cutTypeId);
                return (
                  <Badge key={cutTypeId} variant="secondary" className="flex items-center gap-1">
                    {cutType?.name || cutTypeId}
                    <button
                      type="button"
                      onClick={() => handleRemoveCutType(cutTypeId)}
                      className="ml-1 hover:text-red-600"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="availableWeights">Available Weights (in grams) *</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={productForm.currentWeight}
            onChange={(e) => setProductForm({ ...productForm, currentWeight: e.target.value })}
            placeholder="Enter weight (e.g., 250, 500, 1000)"
            type="number"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddWeight())}
            disabled={isSubmitting}
          />
          <Button type="button" onClick={handleAddWeight} variant="outline" disabled={isSubmitting}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {productForm.availableWeights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {productForm.availableWeights.map((weight: number) => (
              <Badge key={weight} variant="secondary" className="flex items-center gap-1">
                {weight}g
                <button
                  type="button"
                  onClick={() => handleRemoveWeight(weight)}
                  className="ml-1 hover:text-red-600"
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="availableStock">Available Stock (KG) *</Label>
          <Input
            id="availableStock"
            type="number"
            value={productForm.availableStock}
            onChange={(e) => setProductForm({ ...productForm, availableStock: e.target.value })}
            placeholder="Enter stock in kilograms"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="costPricePerKg">Cost Price Per KG (₹) *</Label>
          <Input
            id="costPricePerKg"
            type="number"
            value={productForm.costPricePerKg}
            onChange={(e) => setProductForm({ ...productForm, costPricePerKg: e.target.value })}
            placeholder="Enter cost price"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="defaultProfit">Default Profit % *</Label>
          <Input
            id="defaultProfit"
            type="number"
            value={productForm.defaultProfit}
            onChange={(e) => setProductForm({ ...productForm, defaultProfit: e.target.value })}
            placeholder="e.g., 15"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="defaultDiscount">Default Discount % *</Label>
          <Input
            id="defaultDiscount"
            type="number"
            value={productForm.defaultDiscount}
            onChange={(e) => setProductForm({ ...productForm, defaultDiscount: e.target.value })}
            placeholder="e.g., 10"
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <Label htmlFor="productAvailability">Availability</Label>
          <p className="text-sm text-gray-600">Make this product available to users</p>
        </div>
        <Switch
          id="productAvailability"
          checked={productForm.availability}
          onCheckedChange={(checked: boolean) => setProductForm({ ...productForm, availability: checked })}
          disabled={isSubmitting}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 cursor-pointer hover:bg-blue-700" disabled={isSubmitting}>
          {isSubmitting
            ? (editingProductId ? 'Updating Product...' : 'Adding Product...')
            : (editingProductId ? 'Update Product' : 'Add Product')}
        </Button>
      </DialogFooter>
    </form>
  );

  const renderVariantModal = () => {
    // Get product from selection to auto-fill defaults
    const selectedProduct = variantProducts.find(p => p.id === variantForm.product);
    const costPrice = selectedProduct?.costPrice || 0;
    const defaultProfit = selectedProduct?.profit || 0;
    const defaultDiscount = selectedProduct?.discount || 0;
    
    const prices = calculateVariantPrices(costPrice, defaultProfit, parseFloat(variantForm.discount) || defaultDiscount);

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="variantSpecies">Select Species *</Label>
            <Select value={variantForm.species} onValueChange={(value: string) => setVariantForm({ ...variantForm, species: value, product: '' })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose species" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="variantProduct">Select Product *</Label>
            <Select 
              value={variantForm.product} 
              onValueChange={(value: string) => {
                  const product = variantProducts.find(p => p.id === value);
                setVariantForm({ 
                  ...variantForm, 
                  product: value,
                    // pre-fill helpful defaults
                    profit: product?.profit != null ? String(product.profit) : '',
                    displayPrice: product?.costPrice != null && product?.profit != null
                      ? calculateVariantPrices(product.costPrice, product.profit, 0).displayPrice
                      : '',
                    discount: product?.discount != null ? String(product.discount) : ''
                });
              }}
              disabled={!variantForm.species}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {variantProducts.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="variantName">Variant Name *</Label>
          <Input
            id="variantName"
            value={variantForm.variantName}
            onChange={(e) => setVariantForm({ ...variantForm, variantName: e.target.value })}
            placeholder="e.g., Tiger Prawns - Whole Cleaned - 500g"
            required
          />
        </div>

        <div>
          <Label htmlFor="variantImage">Variant Image {!editingVariantId && '*'}</Label>
          <Input
            id="variantImage"
            type="file"
            accept="image/*"
            onChange={(e) => setVariantForm({ ...variantForm, variantImage: e.target.files?.[0] || null })}
            required={!editingVariantId}
          />
          {variantForm.existingImageUrl && !variantForm.variantImage && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-3">
              <ImageWithFallback
                src={variantForm.existingImageUrl}
                alt={variantForm.variantName || 'Current variant image'}
                className="w-14 h-14 rounded object-cover border"
              />
              <span>Current image will be kept unless you upload a new one.</span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="variantCutType">Select Cut Type *</Label>
          <Select 
            value={variantForm.cutType} 
            onValueChange={(value: string) => setVariantForm({ ...variantForm, cutType: value })}
            disabled={!variantForm.product}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose cut type" />
            </SelectTrigger>
            <SelectContent>
              {cutTypesData
                .filter(ct => selectedProduct?.cutTypeIds?.includes(ct._id))
                .map((ct) => (
                  <SelectItem key={ct._id} value={ct._id}>{ct.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="featured">Featured</Label>
            <Switch
              id="featured"
              checked={variantForm.featured}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, featured: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="bestSeller">Best Seller</Label>
            <Switch
              id="bestSeller"
              checked={variantForm.bestSeller}
              onCheckedChange={(checked: boolean) => setVariantForm({ ...variantForm, bestSeller: checked })}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-900">Pricing Details</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Cost Price (₹/KG)</Label>
              <Input value={costPrice} disabled className="bg-white" />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Profit % *</Label>
              <Input
                type="number"
                value={variantForm.profit}
                onChange={(e) => {
                  const profitVal = e.target.value;
                  // optionally auto-compute display price when profit changes if product is selected
                  let display = variantForm.displayPrice;
                  const p = parseFloat(profitVal);
                  if (!isNaN(p) && selectedProduct) {
                    display = calculateVariantPrices(selectedProduct?.costPrice ?? 0, p, 0).displayPrice;
                  }
                  setVariantForm({ ...variantForm, profit: profitVal, displayPrice: display });
                }}
                placeholder="Enter profit %"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Display Price (₹) *</Label>
              <Input
                type="number"
                value={variantForm.displayPrice}
                onChange={(e) => setVariantForm({ ...variantForm, displayPrice: e.target.value })}
                placeholder="Enter display price"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="variantDiscount">Discount % *</Label>
              <Input
                id="variantDiscount"
                type="number"
                value={variantForm.discount}
                onChange={(e) => setVariantForm({ ...variantForm, discount: e.target.value })}
                placeholder="Enter discount"
                required
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Selling Price (₹)</Label>
              <Input 
                value={(variantForm.displayPrice && variantForm.discount)
                  ? (parseFloat(variantForm.displayPrice) - (parseFloat(variantForm.displayPrice) * (parseFloat(variantForm.discount) || 0) / 100)).toFixed(2)
                  : '0.00'}
                disabled 
                className="bg-white font-semibold text-green-600" 
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={variantForm.notes}
            onChange={(e) => setVariantForm({ ...variantForm, notes: e.target.value })}
            placeholder="Additional notes or special instructions..."
            rows={2}
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
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
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

  // Reset cut type add dialog when switching tabs
  useEffect(() => {
    if (activeTab !== 'cuttypes' && openCutTypeAdd) {
      setOpenCutTypeAdd(false);
    }
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Inventory</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-blue-600">
          {tabLabelMap[activeTab] || 'Inventory'}
        </span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage categories, products, variants, and cut types</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={handleOpenAddModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex flex-wrap gap-2 bg-muted p-1 rounded-lg">
          <TabsTrigger className="min-w-[240px] flex-1" value="categories">Categories</TabsTrigger>
          <TabsTrigger className="min-w-[240px] flex-1" value="products">Products</TabsTrigger>
          <TabsTrigger className="min-w-[240px] flex-1" value="variants">Product Variants</TabsTrigger>
          <TabsTrigger className="min-w-[300px] flex-1" value="cuttypes">Cut Types</TabsTrigger>
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
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Categories ({filteredCategories.length} of {categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
                        filteredCategories.map((category, index) => {
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
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Products ({filteredProducts.length} of {products.length})</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <th className="text-left py-3 px-4">Available Stock</th>
                      <th className="text-left py-3 px-4">Cost Price (₹/KG)</th>
                      <th className="text-left py-3 px-4">Default Profit %</th>
                      <th className="text-left py-3 px-4">Default Discount %</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsLoading ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-gray-500">
                          <div className="inline-flex items-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            Loading products...
                          </div>
                        </td>
                      </tr>
                    ) : productsError ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-red-600">{productsError}</td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="py-8 text-center text-gray-500">No products found</td>
                      </tr>
                    ) : filteredProducts.map((product, index) => {
                      const originalIndex = products.findIndex((p) => p.id === product.id);
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
                        <td className="py-3 px-4">{originalIndex + 1}</td>
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
                              <Badge key={idx} variant="outline" className="text-xs">
                                {ct}
                              </Badge>
                            ))}
                            {product.cutTypes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.cutTypes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">{product.stock} KG</td>
                        <td className="py-3 px-4">₹{product.costPrice}</td>
                        <td className="py-3 px-4">{product.profit}%</td>
                        <td className="py-3 px-4">{product.discount}%</td>
                        <td className="py-3 px-4">
                          <Badge variant={product.status === 'Active' ? 'default' : 'destructive'}>
                            {product.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{product.lastUpdated}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Edit product"
                              onClick={() => {
                                // Prefill form for editing
                                setEditingProductId(product.id);
                                const resolvedCategoryId = getCategoryIdForProduct(product);
                                setProductForm({
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
                                  availability: product.availability ?? (product.status === 'Active')
                                });
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
                    )})}
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
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Product Variants ({filteredVariants.length} of {variants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {/* <th className="text-left py-3 px-4">Reorder</th> */}
                      <th className="text-left py-3 px-4">Serial No</th>
                      <th className="text-left py-3 px-4">Image</th>
                      <th className="text-left py-3 px-4">Variant Name</th>
                      <th className="text-left py-3 px-4">Product Name</th>
                      <th className="text-left py-3 px-4">Species</th>
                      <th className="text-left py-3 px-4">Cut Type</th>
                      <th className="text-left py-3 px-4">Featured</th>
                      <th className="text-left py-3 px-4">Best Seller</th>
                      <th className="text-left py-3 px-4">Cost Price (₹/KG)</th>
                      <th className="text-left py-3 px-4">Profit %</th>
                      <th className="text-left py-3 px-4">Display Price (₹)</th>
                      <th className="text-left py-3 px-4">Discount %</th>
                      <th className="text-left py-3 px-4">Selling Price (₹)</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVariants.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-8 text-center text-gray-500">Variants Loading</td>
                      </tr>
                    ) : filteredVariants.map((variant, index) => {
                      const originalIndex = variants.findIndex((v) => v.id === variant.id);
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
                        <td className="py-3 px-4">{originalIndex + 1}</td>
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
                        <td className="py-3 px-4">{variant.variantName}</td>
                        <td className="py-3 px-4">{variant.product}</td>
                        <td className="py-3 px-4">{variant.species}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">{variant.cutType}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {variant.featured ? (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {variant.bestSeller ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">₹{variant.costPrice}</td>
                        <td className="py-3 px-4">{variant.profit}%</td>
                        <td className="py-3 px-4">₹{variant.displayPrice}</td>
                        <td className="py-3 px-4">{variant.discount}%</td>
                        <td className="py-3 px-4">₹{variant.sellingPrice}</td>
                        <td className="py-3 px-4">
                          <Badge variant="default">{variant.status}</Badge>
                        </td>
                        <td className="py-3 px-4">{variant.lastUpdated}</td>
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
                    )})}
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
      </Tabs>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => {
        if (!open) {
          setEditingProductId(null);
          setEditingVariantId(null);
        }
        setShowAddModal(open);
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'categories'
                ? (editingCategoryId ? 'Edit' : 'Add New')
                : activeTab === 'products'
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
          <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: 24 }}>
            <DialogHeader>
              <DialogTitle>
                View {activeTab === 'categories' ? 'Category' : activeTab === 'products' ? 'Product' : 'Product Variant'}
              </DialogTitle>
            </DialogHeader>
            {activeTab === 'categories' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="speciesName">Species Name</Label>
                  <Input
                    id="speciesName"
                    value={selectedItem?.name || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="speciesIcon">Species Icon</Label>
                  <Input
                    id="speciesIcon"
                    type="file"
                    accept="image/*"
                    readOnly
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload an icon or image for this species</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <p className="text-sm text-gray-600">Make this category available to users</p>
                  </div>
                  <Switch
                    id="availability"
                    checked={selectedItem?.availability === 'Available'}
                    onCheckedChange={(checked: boolean) => {
                      const updatedCategories = categories.map(cat => 
                        cat.id === selectedItem.id ? { ...cat, availability: (checked ? 'Available' : 'Unavailable') as 'Available' | 'Unavailable' } : cat
                      );
                      setCategories(updatedCategories);
                    }}
                  />
                </div>
              </div>
            )}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="species">Select Species</Label>
                  <Select value={selectedItem?.species || ''} onValueChange={(value: string) => {
                    const updatedProducts = products.map(prod => 
                      prod.id === selectedItem.id ? { ...prod, species: value } : prod
                    );
                    setProducts(updatedProducts);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prawns">Prawns</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="crab">Crab</SelectItem>
                      <SelectItem value="squid">Squid</SelectItem>
                      <SelectItem value="lobster">Lobster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={selectedItem?.name || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="productImage">Product Image</Label>
                  <Input
                    id="productImage"
                    type="file"
                    accept="image/*"
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={selectedItem?.description || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label htmlFor="nutritionFacts">Nutrition Facts</Label>
                  <Textarea
                    id="nutritionFacts"
                    value={selectedItem?.nutritionFacts || ''}
                    readOnly
                  />
                </div>

                <div>
                  <Label>Available Cut Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {(selectedItem?.cutTypes || []).map((cutType: string, index: number) => {
                      const cutTypeName = cutTypesData.find(ct => ct._id === cutType)?.name || cutType;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {cutTypeName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="availableStock">Available Stock (KG)</Label>
                    <Input
                      id="availableStock"
                      type="number"
                      value={selectedItem?.stock || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPricePerKg">Cost Price Per KG (₹)</Label>
                    <Input
                      id="costPricePerKg"
                      type="number"
                      value={selectedItem?.costPrice || ''}
                      readOnly
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultProfit">Default Profit %</Label>
                    <Input
                      id="defaultProfit"
                      type="number"
                      value={selectedItem?.profit || ''}
                      readOnly
                    />
                  </div>

                  <div>
                    <Label htmlFor="defaultDiscount">Default Discount %</Label>
                    <Input
                      id="defaultDiscount"
                      type="number"
                      value={selectedItem?.discount || ''}
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="productAvailability">Availability</Label>
                    <p className="text-sm text-gray-600">Make this product available to users</p>
                  </div>
                  <Switch
                    id="productAvailability"
                    checked={selectedItem?.availability}
                    onCheckedChange={(checked: boolean) => {
                      const updatedProducts = products.map(prod => 
                        prod.id === selectedItem.id ? { ...prod, availability: checked } : prod
                      );
                      setProducts(updatedProducts);
                    }}
                  />
                </div>
              </div>
            )}
            {activeTab === 'variants' && isLoadingVariantView && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {activeTab === 'variants' && !isLoadingVariantView && viewingVariant && (
              <div className="space-y-6">
                {/* Variant Image */}
                {viewingVariant.image && (
                  <div className="flex justify-center">
                    <ImageWithFallback
                      src={viewingVariant.image}
                      alt={viewingVariant.name}
                      className="w-48 h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Variant Name</Label>
                    <p className="font-medium">{viewingVariant.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <Badge variant={viewingVariant.status === 'Active' ? 'default' : 'secondary'}>
                      {viewingVariant.status}
                    </Badge>
                  </div>
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

                {/* Badges */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Featured</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.featured ? 'default' : 'secondary'}>
                        {viewingVariant.featured ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Best Seller</Label>
                    <div className="mt-1">
                      <Badge variant={viewingVariant.bestSeller ? 'default' : 'secondary'}>
                        {viewingVariant.bestSeller ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-blue-900">Pricing Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Display Price</Label>
                      <p className="font-semibold text-lg">₹{viewingVariant.displayPrice}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Selling Price</Label>
                      <p className="font-semibold text-lg text-green-600">₹{viewingVariant.sellingPrice}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Profit Margin</Label>
                      <p className="font-medium">{viewingVariant.profit}%</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Discount</Label>
                      <p className="font-medium">{viewingVariant.discount}%</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="mt-1 text-gray-800">{viewingVariant.notes}</p>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Date Created</Label>
                    <p className="font-medium">{viewingVariant.dateCreated}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Last Updated</Label>
                    <p className="font-medium">{viewingVariant.lastUpdated}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </DialogFooter>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Category Icon</Label>
                  <div className="mt-2">
                    {typeof viewingCategory.icon === 'string' && (viewingCategory.icon.includes('http') || viewingCategory.icon.includes('/')) ? (
                      <ImageWithFallback 
                        src={viewingCategory.icon} 
                        alt={viewingCategory.name}
                        className="w-20 h-20 rounded object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{viewingCategory.icon}</span>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Category Name</Label>
                  <p className="mt-2 text-base font-medium">{viewingCategory.name}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-600">Description</Label>
                <p className="mt-2 text-base text-gray-700">{viewingCategory.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Status</Label>
                  <div className="mt-2">
                    <Badge variant={viewingCategory.status === 'Active' ? 'default' : 'secondary'}>
                      {viewingCategory.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Slug</Label>
                  <p className="mt-2 text-base text-gray-700">{viewingCategory.slug}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Order</Label>
                  <p className="mt-2 text-base text-gray-700">{viewingCategory.order}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Is Deleted</Label>
                  <p className="mt-2 text-base text-gray-700">{viewingCategory.isDeleted ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Date Created</Label>
                  <p className="mt-2 text-base text-gray-700">{viewingCategory.dateCreated}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Last Updated</Label>
                  <p className="mt-2 text-base text-gray-700">{viewingCategory.lastUpdated}</p>
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
  );
}