import React, { useEffect, useState } from 'react';
import { FileText, Image, Plus, Edit, Trash2, Shield, ScrollText, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
import { toast } from 'react-toastify';
import BannerManagement from './cms/BannerManagement';
import TextContentEditor from './cms/TextContentEditor';
import { apiFetch } from '../../lib/api';

type ContentType = 'banners' | 'terms' | 'privacy' | 'about' | 'deliveryTc' | 'deliveryPrivacy';

interface ContentItem {
  id: string;
  title: string;
  lastUpdated: string;
  status?: 'Active' | 'Inactive';
  type: ContentType;
  sequence?: number;
  image?: string;
}

export default function CMS() {
  const [selectedContent, setSelectedContent] = useState<ContentType | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);
  const [banners, setBanners] = useState<ContentItem[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [bannersError, setBannersError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [pagesError, setPagesError] = useState<string | null>(null);

  const IMAGE_BASE = ((import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_BASE_URL) as string | undefined;

  const [textContents, setTextContents] = useState<ContentItem[]>([
    {
      id: 'terms-loading',
      title: 'Terms and Conditions',
      lastUpdated: '',
      type: 'terms'
    },
    {
      id: 'privacy-loading',
      title: 'Privacy Policy',
      lastUpdated: '',
      type: 'privacy'
    },
    {
      id: 'deliveryPrivacy-loading',
      title: 'Delivery Privacy',
      lastUpdated: '',
      type: 'deliveryPrivacy'
    },
    {
      id: 'about-loading',
      title: 'About Us',
      lastUpdated: '',
      type: 'about'
    },
    {
      id: 'deliveryTc-loading',
      title: 'Delivery T&C',
      lastUpdated: '',
      type: 'deliveryTc'
    }
  ]);

  const PAGE_IDS: Record<'terms' | 'privacy' | 'about' | 'deliveryTc' | 'deliveryPrivacy', string> = {
    terms: '69412955d430ff450e4ac0b8',
    privacy: '694128ead430ff450e4ac0b2',
    about: '69442a843fcd660eec9c89ed',
    deliveryTc: '694babb9463a57211a1cbdbb',
    deliveryPrivacy: '694bb389463a57211a1cbde0',
  };

  const contentTypes = [
    {
      id: 'banners' as ContentType,
      title: 'Banners',
      description: 'Manage promotional banners and carousel images',
      icon: Image,
      color: 'blue',
      items: banners
    },
    {
      id: 'terms' as ContentType,
      title: 'Terms and Conditions',
      description: 'Manage terms and conditions for platform usage',
      icon: ScrollText,
      color: 'green',
      items: textContents.filter(item => item.type === 'terms' || item.type === 'deliveryTc')
    },
    {
      id: 'privacy' as ContentType,
      title: 'Privacy Policy',
      description: 'Manage privacy policy and data protection information',
      icon: Shield,
      color: 'purple',
      items: textContents.filter(item => item.type === 'privacy' || item.type === 'deliveryPrivacy')
    },
    {
      id: 'about' as ContentType,
      title: 'About Us',
      description: 'Manage company information for About Us page',
      icon: FileText,
      color: 'orange',
      items: textContents.filter(item => item.type === 'about')
    }
  ];

  // Fetch banners from API
  const loadBanners = async () => {
    setBannersLoading(true);
    setBannersError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        banners?: Array<{
          _id: string;
          name: string;
          image: string;
          order?: number;
          isActive: boolean;
          isDeleted?: boolean;
          createdAt: string;
          updatedAt: string;
        }>;
        message?: string;
      }>('/api/banners');

      if (!res.success) throw new Error(res.message || 'Failed to fetch banners');

      const mapped: ContentItem[] = (res.banners || []).map((b) => ({
        id: b._id,
        title: b.name,
        lastUpdated: new Date(b.updatedAt).toISOString().split('T')[0],
        status: b.isActive ? 'Active' : 'Inactive',
        type: 'banners',
        sequence: b.order ?? undefined,
        image: b.image ? (IMAGE_BASE ? `${IMAGE_BASE.replace(/\/$/, '')}${b.image}` : b.image) : undefined,
      }));
      setBanners(mapped);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load banners';
      setBannersError(msg);
      toast.error(msg);
    } finally {
      setBannersLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
    loadPages();
  }, []);

  const handleAddContent = (type: ContentType) => {
    setSelectedContent(type);
    setEditingItem(null);
  };

  const handleEditContent = (item: ContentItem) => {
    setSelectedContent(item.type);
    setEditingItem(item);
  };

  const handleDeleteContent = (item: ContentItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'banners') {
        setBannersLoading(true);
        const res = await apiFetch<{
          success: boolean;
          banner?: {
            _id: string;
            name: string;
            image: string;
            order?: number;
            isActive: boolean;
            isDeleted: boolean;
            createdAt: string;
            updatedAt: string;
          };
          message?: string;
        }>(`/api/banners/${itemToDelete.id}`, { method: 'DELETE' });

        if (!res.success) throw new Error(res.message || 'Failed to delete banner');
        toast.success(res.message || 'Banner deleted successfully');
        await loadBanners();
      } else {
        setTextContents(textContents.filter(content => content.id !== itemToDelete.id));
        toast.success(`${itemToDelete.title} deleted successfully`);
      }
    } catch (e: any) {
      const msg = e?.message || 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      setBannersLoading(false);
    }
  };

  const loadPages = async () => {
    setPagesLoading(true);
    setPagesError(null);
    try {
      const entries: Array<Promise<ContentItem>> = (['terms', 'privacy', 'about', 'deliveryTc', 'deliveryPrivacy'] as const).map(async (key) => {
        const res = await apiFetch<{
          success: boolean;
          page?: {
            _id: string;
            title: string;
            description: string;
            isDeleted: boolean;
            isActive: boolean;
            createdAt: string;
            updatedAt: string;
          };
          message?: string;
        }>(`/api/page/get-page/${PAGE_IDS[key]}`);

        if (!res?.success || !res.page) throw new Error(res?.message || `Failed to fetch ${key}`);
        return {
          id: res.page._id,
          title: res.page.title,
          lastUpdated: new Date(res.page.updatedAt).toISOString().split('T')[0],
          status: res.page.isActive ? 'Active' : 'Inactive',
          type: key,
        } as ContentItem;
      });

      const results = await Promise.all(entries);
      setTextContents(results);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load pages';
      setPagesError(msg);
      toast.error(msg);
    } finally {
      setPagesLoading(false);
    }
  };

  const handleSaveBanner = (bannerData: any) => {
    if (editingItem) {
      // Update existing banner
      setBanners(banners.map(banner =>
        banner.id === editingItem.id
          ? {
              ...banner,
              title: bannerData.title ?? banner.title,
              status: bannerData.status ?? banner.status,
              lastUpdated: bannerData.updatedAt
                ? new Date(bannerData.updatedAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              sequence: bannerData.order ?? banner.sequence,
            }
          : banner
      ));
      toast.success(bannerData.message || 'Banner updated successfully');
    } else {
      // Add new banner
      const newBanner: ContentItem = {
        id: bannerData.id,
        title: bannerData.title,
        status: bannerData.status,
        lastUpdated: bannerData.updatedAt
          ? new Date(bannerData.updatedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        type: 'banners',
        sequence: bannerData.order,
      };
      setBanners([...banners, newBanner]);
      toast.success(bannerData.message || 'Banner added successfully');
    }
    loadBanners();
    setSelectedContent(null);
    setEditingItem(null);
  };

  const handleSaveTextContent = (contentData: any) => {
    // Use the server's updatedAt timestamp if available, otherwise use now
    const updatedDate = contentData.updatedAtIso
      ? new Date(contentData.updatedAtIso).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    if (editingItem) {
      // Update existing content with server timestamp
      setTextContents(textContents.map(content =>
        content.id === editingItem.id
          ? { ...content, title: contentData.title, lastUpdated: updatedDate }
          : content
      ));
      toast.success('Content updated successfully');
    } else {
      // Add new content
      const typePrefix = selectedContent === 'terms' ? 'TERMS' : selectedContent === 'privacy' ? 'PRIVACY' : 'ABOUT';
      const existingCount = textContents.filter(c => c.type === selectedContent).length;
      const newContent: ContentItem = {
        id: `${typePrefix}-${String(existingCount + 1).padStart(3, '0')}`,
        title: contentData.title,
        lastUpdated: updatedDate,
        type: selectedContent!
      };
      setTextContents([...textContents, newContent]);
      toast.success('Content added successfully');
    }
    setSelectedContent(null);
    setEditingItem(null);
  };

  const handleCancel = () => {
    setSelectedContent(null);
    setEditingItem(null);
  };

  const moveBanner = async (index: number, direction: 'up' | 'down') => {
    if (isReordering) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const movingBanner = banners[index];
    const previous = [...banners];
    const optimistic = [...banners];
    [optimistic[index], optimistic[targetIndex]] = [optimistic[targetIndex], optimistic[index]];
    setBanners(optimistic);

    setIsReordering(true);
    try {
      const body = {
        id: String(movingBanner.id),
        from: index + 1,
        to: targetIndex + 1,
      };
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/banners/reorder',
        {
          method: 'PUT',
          body: JSON.stringify(body),
        }
      );
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to reorder banner');
      }
      toast.success(res?.message || 'Banner reordered successfully');
      await loadBanners();
    } catch (e: any) {
      setBanners(previous);
      const msg = e?.message || 'Failed to reorder banner';
      toast.error(msg);
    } finally {
      setIsReordering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' }
    };
    return colors[color] || colors.blue;
  };

  // Show Banner Management or Text Content Editor if a content type is selected
  if (selectedContent === 'banners') {
    return (
      <BannerManagement
        banner={editingItem}
        onSave={handleSaveBanner}
        onCancel={handleCancel}
        onError={(error) => toast.error(error)}
      />
    );
  }

  if (selectedContent && ['terms', 'privacy', 'about', 'deliveryTc', 'deliveryPrivacy'].includes(selectedContent)) {
    return (
      <TextContentEditor
        contentType={selectedContent}
        contentItem={editingItem}
        onSave={handleSaveTextContent}
        onCancel={handleCancel}
      />
    );
  }

  // Main CMS Screen
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Content Management System</h1>
        <p className="text-gray-500">Manage banners, policies, and about us content</p>
      </div>

      {/* Content Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentTypes.map((contentType) => {
          const colors = getColorClasses(contentType.color);
          const Icon = contentType.icon;

          return (
            <Card key={contentType.id} className="overflow-hidden">
              <div className={`${colors.bg} border-b ${colors.border} p-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`${colors.bg} p-2 rounded-lg border ${colors.border}`}>
                      <Icon className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className={`${colors.text}`}>{contentType.title}</h3>
                      <p className="text-gray-600 mt-1">{contentType.description}</p>
                    </div>
                  </div>
                  {contentType.id === 'banners' && (
                    <Button
                      onClick={() => handleAddContent(contentType.id)}
                      size="sm"
                      className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                {contentType.items.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {contentType.id === 'banners' && bannersLoading && (
                      <div className="p-4 text-gray-600">Loading banners...</div>
                    )}
                    {contentType.id === 'banners' && bannersError && (
                      <div className="p-4 text-red-600">{bannersError}</div>
                    )}
                    {contentType.items.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {/* Sequence Number and Reorder Controls (Only for Banners) */}
                          {item.type === 'banners' && (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                                {item.sequence ?? index + 1}
                              </div>
                              <div className="flex flex-col mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveBanner(index, 'up')}
                                  disabled={index === 0 || isReordering}
                                  className="p-1 h-6 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveBanner(index, 'down')}
                                  disabled={index === contentType.items.length - 1 || isReordering}
                                  className="p-1 h-6 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Content Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900">{item.title}</p>
                              {item.status && (
                                <Badge
                                  variant={item.status === 'Active' ? 'default' : 'secondary'}
                                  className={
                                    item.status === 'Active'
                                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                  }
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-500 mt-1">
                              Last updated: {formatDate(item.lastUpdated)}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditContent(item)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteContent(item)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No content available. Click "Add" to create new content.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
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