import React, { useState } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';

interface BannerManagementProps {
  banner?: any;
  onSave: (bannerData: any) => void;
  onCancel: () => void;
}

export default function BannerManagement({ banner, onSave, onCancel }: BannerManagementProps) {
  const [title, setTitle] = useState(banner?.title || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(banner?.status || 'Active');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(banner?.image || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ image: 'File size must be less than 10MB' });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ image: 'Please upload a valid image file' });
        return;
      }
      
      setImageFile(file);
      setErrors({});
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Banner title is required';
    }
    if (!imagePreview) {
      newErrors.image = 'Banner image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      title: title.trim(),
      status,
      image: imagePreview
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {banner ? 'Edit' : 'Add'} Banner
            </h1>
          </div>
          <p className="text-gray-600 ml-10">Upload and manage promotional banner images</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Upload Section - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <CardTitle>Banner Image</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {imagePreview ? (
                  <div className="space-y-4">
                    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full h-80 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Label htmlFor="banner-image-change" className="flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <label htmlFor="banner-image-change" className="cursor-pointer">
                            Change Image
                          </label>
                        </Button>
                      </Label>
                      <input
                        type="file"
                        id="banner-image-change"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="banner-image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="banner-image"
                      className="flex flex-col items-center justify-center cursor-pointer"
                    >
                      <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-blue-600" />
                          </div>
                          <p className="text-gray-900 font-medium mb-1">
                            Click to upload banner image
                          </p>
                          <p className="text-gray-500 text-sm">
                            or drag and drop
                          </p>
                          <p className="text-gray-400 text-xs mt-2">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                {errors.image && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {errors.image}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Section - Takes 1 column on large screens */}
        <div>
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Banner Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Banner Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Summer Sale"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (errors.title) setErrors({ ...errors, title: '' });
                    }}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs">{errors.title}</p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex gap-2">
                    {(['Active', 'Inactive'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 px-3 rounded-lg border transition-all text-sm font-medium ${
                          status === s
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Description */}
                <div className={`p-3 rounded-lg text-sm ${
                  status === 'Active'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  {status === 'Active'
                    ? '✓ Banner is visible to users'
                    : '○ Banner is hidden from users'}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Banner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}