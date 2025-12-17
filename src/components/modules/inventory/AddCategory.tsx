import React, { useState, useEffect } from 'react';
import { Plus, Upload, Edit, Trash2, Loader, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { apiFetch } from '../../../lib/api';
import { toast } from 'sonner';

const IMAGE_BASE = (import.meta.env as any).VITE_IMAGE_BASE_URL || (import.meta.env as any).VITE_BASE_URL as string | undefined;

export default function AddCategory() {
  const [categories, setCategories] = useState<Array<{
    id: string;
    icon: string;
    name: string;
    status: 'Active' | 'Inactive';
    dateCreated: string;
  }>>([]);
  
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    speciesName: '',
    speciesIcon: null as File | null,
    status: true
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [isLoadingView, setIsLoadingView] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        categories: Array<{
          _id: string;
          name: string;
          image?: string;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
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
          name: c.name,
          status: (c.isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          dateCreated: new Date(c.createdAt).toISOString().split('T')[0],
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

  const handleDeleteCategory = async () => {
    if (!deletingCategoryId) return;

    setIsDeleting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        category?: {
          _id: string;
          name: string;
          isDeleted: boolean;
        };
        message?: string;
      }>(`/api/categories/${deletingCategoryId}`, {
        method: 'DELETE',
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete category');

      setCategories(categories.filter(cat => cat.id !== deletingCategoryId));
      toast.success('Category deleted successfully');
      setShowDeleteDialog(false);
      setDeletingCategoryId(null);
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete category';
      console.error('Delete category error:', e);
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteDialog = (categoryId: string, categoryName: string) => {
    setDeletingCategoryId(categoryId);
    setShowDeleteDialog(true);
  };

  const handleViewCategory = async (categoryId: string) => {
    setIsLoadingView(true);
    setShowViewDialog(true);
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
      setShowViewDialog(false);
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.speciesName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (!editingCategoryId && !formData.speciesIcon) {
      toast.error('Category icon is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('name', formData.speciesName.trim());
      if (formData.speciesIcon) {
        uploadFormData.append('image', formData.speciesIcon);
      }
      uploadFormData.append('isActive', String(formData.status));

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
        body: uploadFormData,
      });

      if (!res.success) throw new Error(res.message || (isEdit ? 'Failed to update category' : 'Failed to add category'));
      if (!res.category) throw new Error('No category data in response');

      const categoryData = {
        id: res.category._id,
        icon: IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${res.category.image}` : res.category.image,
        name: res.category.name,
        status: (res.category.isActive ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
        dateCreated: new Date(res.category.createdAt).toISOString().split('T')[0],
      };

      if (isEdit) {
        const updatedCategories = categories.map(cat => cat.id === editingCategoryId ? categoryData : cat);
        setCategories(updatedCategories);
        toast.success('Category updated successfully');
      } else {
        setCategories([...categories, categoryData]);
        toast.success('Category added successfully');
      }

      setFormData({ speciesName: '', speciesIcon: null, status: true });
      setEditingCategoryId(null);
    } catch (e: any) {
      const msg = e?.message || (editingCategoryId ? 'Failed to update category' : 'Failed to add category');
      console.error('Category operation error:', e);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2">{editingCategoryId ? 'Edit Category / Species' : 'Add Category / Species'}</h1>
        <p className="text-gray-600">Manage seafood categories and species</p>
      </div>

      {/* Add/Edit Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingCategoryId ? 'Edit Category' : 'Add New Category'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="speciesName">Species Name *</Label>
                <Input 
                  id="speciesName" 
                  placeholder="e.g., Prawns"
                  value={formData.speciesName}
                  onChange={(e) => setFormData({ ...formData, speciesName: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="speciesIcon">Species Icon {!editingCategoryId && '*'}</Label>
                <Input 
                  id="speciesIcon" 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, speciesIcon: e.target.files?.[0] || null })}
                  required={!editingCategoryId}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {editingCategoryId ? 'Upload a new icon to replace the current one (optional)' : 'Upload an icon or image for this species'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="status">Status</Label>
                <p className="text-sm text-gray-600">Make this category active</p>
              </div>
              <Switch 
                id="status"
                checked={formData.status}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, status: checked })}
                disabled={isSubmitting}
              />
            </div>

            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {editingCategoryId ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {editingCategoryId ? 'Update Category' : 'Add Category'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : categoriesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {categoriesError}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found. Add a new one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Icon</th>
                    <th className="text-left py-3 px-4">Species Name</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-2xl">
                        {category.icon.includes('http') || category.icon.includes('/') ? (
                          <ImageWithFallback src={category.icon} alt={category.name} />
                        ) : (
                          category.icon
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium">{category.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={category.status === 'Active' ? 'default' : 'secondary'}>
                          {category.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{category.dateCreated}</td>
                      <td className="py-3 px-4">
                        <div className="flex cursor-pointer gap-2">
                          <button 
                            type="button"
                            onClick={() => handleViewCategory(category.id)}
                            className="p-1 hover:bg-gray-100 cursor-pointer rounded"
                            title="View category details"
                          >
                            <Eye className="w-4 h-4 cursor-pointer text-gray-600" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(category.id);
                              setFormData({
                                speciesName: category.name,
                                speciesIcon: null,
                                status: category.status === 'Active'
                              });
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4 cursor-pointer text-blue-600" />
                          </button>
                          <button 
                            type="button"
                            onClick={() => openDeleteDialog(category.id, category.name)}
                            className="p-1 hover:bg-gray-100 rounded" 
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4 cursor-pointer text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Category Dialog */}
      <AlertDialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Category Details</AlertDialogTitle>
          </AlertDialogHeader>
          {isLoadingView ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : viewingCategory ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Category Icon</Label>
                  <div className="mt-2">
                    {viewingCategory.icon.includes('http') || viewingCategory.icon.includes('/') ? (
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
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeleting}
              className="bg-red-600 cursor-pointer hover:bg-red-700"
            >
              {isDeleting ? (
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
    </div>
  );
}
