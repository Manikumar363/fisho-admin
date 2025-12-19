import React, { useState } from 'react';
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
import { toast } from 'sonner';
import BannerManagement from './cms/BannerManagement';
import TextContentEditor from './cms/TextContentEditor';

type ContentType = 'banners' | 'terms' | 'privacy' | 'about';

interface ContentItem {
  id: string;
  title: string;
  lastUpdated: string;
  status?: 'Active' | 'Inactive';
  type: ContentType;
  sequence?: number;
}

export default function CMS() {
  const [selectedContent, setSelectedContent] = useState<ContentType | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ContentItem | null>(null);

  const [banners, setBanners] = useState<ContentItem[]>([
    {
      id: 'BAN-001',
      title: 'Summer Sale Banner',
      lastUpdated: '2025-12-10',
      status: 'Active',
      type: 'banners'
    },
    {
      id: 'BAN-002',
      title: 'New Year Special',
      lastUpdated: '2025-12-01',
      status: 'Active',
      type: 'banners'
    },
    {
      id: 'BAN-003',
      title: 'Weekend Offer',
      lastUpdated: '2025-11-25',
      status: 'Inactive',
      type: 'banners'
    }
  ]);

  const [textContents, setTextContents] = useState<ContentItem[]>([
    {
      id: 'TERMS-001',
      title: 'Terms and Conditions',
      lastUpdated: '2025-11-15',
      type: 'terms'
    },
    {
      id: 'PRIVACY-001',
      title: 'Privacy Policy',
      lastUpdated: '2025-11-10',
      type: 'privacy'
    },
    {
      id: 'ABOUT-001',
      title: 'About Us',
      lastUpdated: '2025-11-05',
      type: 'about'
    }
  ]);

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
      items: textContents.filter(item => item.type === 'terms')
    },
    {
      id: 'privacy' as ContentType,
      title: 'Privacy Policy',
      description: 'Manage privacy policy and data protection information',
      icon: Shield,
      color: 'purple',
      items: textContents.filter(item => item.type === 'privacy')
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

  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'banners') {
        setBanners(banners.filter(banner => banner.id !== itemToDelete.id));
      } else {
        setTextContents(textContents.filter(content => content.id !== itemToDelete.id));
      }
      toast.success(`${itemToDelete.title} deleted successfully`);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleSaveBanner = (bannerData: any) => {
    if (editingItem) {
      // Update existing banner
      setBanners(banners.map(banner =>
        banner.id === editingItem.id
          ? { ...banner, title: bannerData.title, status: bannerData.status, lastUpdated: new Date().toISOString().split('T')[0] }
          : banner
      ));
      toast.success('Banner updated successfully');
    } else {
      // Add new banner
      const newBanner: ContentItem = {
        id: `BAN-${String(banners.length + 1).padStart(3, '0')}`,
        title: bannerData.title,
        status: bannerData.status,
        lastUpdated: new Date().toISOString().split('T')[0],
        type: 'banners'
      };
      setBanners([...banners, newBanner]);
      toast.success('Banner added successfully');
    }
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

  const moveBannerUp = (index: number) => {
    if (index > 0) {
      const newBanners = [...banners];
      [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
      setBanners(newBanners);
      toast.success('Banner order updated');
    }
  };

  const moveBannerDown = (index: number) => {
    if (index < banners.length - 1) {
      const newBanners = [...banners];
      [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
      setBanners(newBanners);
      toast.success('Banner order updated');
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
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' }
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
      />
    );
  }

  if (selectedContent && ['terms', 'privacy', 'about'].includes(selectedContent)) {
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
                                {index + 1}
                              </div>
                              <div className="flex flex-col mt-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveBannerUp(index)}
                                  disabled={index === 0}
                                  className="p-1 h-6 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveBannerDown(index)}
                                  disabled={index === contentType.items.length - 1}
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