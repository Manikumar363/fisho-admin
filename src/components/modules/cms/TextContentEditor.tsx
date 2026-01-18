import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { apiFetch, getToken } from '../../../lib/api';
import { toast } from 'react-toastify';

interface TextContentEditorProps {
  contentType: 'terms' | 'privacy' | 'about' | 'deliveryTc' | 'deliveryPrivacy';
  contentItem?: any;
  onSave: (contentData: any) => void;
  onCancel: () => void;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'],
    ['link', 'image', 'video']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'script', 'indent',
  'size',
  'color', 'background',
  'font',
  'align',
  'link', 'image', 'video'
];

export default function TextContentEditor({
  contentType,
  contentItem,
  onSave,
  onCancel
}: TextContentEditorProps) {
  const [title, setTitle] = useState(contentItem?.title || '');
  const [content, setContent] = useState(contentItem?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageId, setPageId] = useState<string | null>(null);

  const contentTypeLabels = {
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    about: 'About Us',
    deliveryTc: 'Delivery T&C',
    deliveryPrivacy: 'Delivery Privacy'
  };

  const contentTypeIds = {
    terms: '69412955d430ff450e4ac0b8',
    privacy: '694128ead430ff450e4ac0b2',
    about: '69442a843fcd660eec9c89ed',
    deliveryTc: '694babb9463a57211a1cbdbb',
    deliveryPrivacy: '694bb389463a57211a1cbde0'
  };

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = contentTypeIds[contentType];
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
        }>(`/api/page/get-page/${id}`);

        if (!res?.success) throw new Error(res?.message || 'Failed to fetch content');
        if (res.page) {
          setTitle(res.page.title);
          setContent(res.page.description);
          setPageId(res.page._id);
        }
      } catch (e: any) {
        const msg = e?.message || 'Failed to load content';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageId) {
      toast.error('Page ID not found');
      return;
    }

    const token = getToken() || (import.meta as any)?.env?.VITE_STATIC_TOKEN;
    if (!token) {
      toast.error('Missing auth token. Please log in or set VITE_STATIC_TOKEN.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = `/api/page/update-page/${pageId}`;
      // Debug aids for environment/auth issues
      console.info('Updating page', {
        url,
        baseUrl: (import.meta as any)?.env?.VITE_BASE_URL,
        hasToken: Boolean(localStorage.getItem('auth_token')),
        staticToken: Boolean((import.meta as any)?.env?.VITE_STATIC_TOKEN),
        tokenPreview: token ? `${String(token).slice(0, 4)}...${String(token).slice(-4)}` : 'none',
      });

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
      }>(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: content })
      });

      if (!res?.success) throw new Error(res?.message || 'Failed to update content');

      const updatedAt = res.page?.updatedAt || new Date().toISOString();
      toast.success(res.message || 'Content updated successfully');
      onSave({ 
        title, 
        content, 
        lastUpdated: updatedAt,
        updatedAtIso: updatedAt  // Pass ISO for consistent formatting
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to save content';
      toast.error(msg);
      console.error('Update page failed', {
        urlTried: `/api/page/update-page/${pageId}`,
        status: err?.status,
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to CMS
        </Button>
      </div>

      <div>
        <h1 className="text-gray-900">
          {contentItem ? 'Edit' : 'Add'} {contentTypeLabels[contentType]}
        </h1>
        <p className="text-gray-500">Create and format content using the rich text editor</p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <Loader className="w-5 h-5 animate-spin" />
              Loading content...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Content Title (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title (read-only)</Label>
                  <Input
                    id="title"
                    placeholder="Content title"
                    value={title}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-gray-500">Title is managed by the server and not editable here.</p>
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-2">
                  <Label>Content *</Label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={modules}
                      formats={formats}
                      placeholder="Write your content here..."
                      style={{ minHeight: '400px' }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Use the toolbar above to format your content
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!content || isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Content'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Preview Section */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-gray-900 mb-4">Preview</h3>
              <div className="prose max-w-none">
                {title && <h2 className="text-gray-900 mb-4">{title}</h2>}
                <div
                  className="text-gray-700"
                  dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400">Content will appear here...</p>' }}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}