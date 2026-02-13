import React, { useState } from 'react';
import { ArrowLeft, Loader, Upload, X, Image as ImageIcon } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { toast } from 'react-toastify';

interface Section1EditorProps {
  sectionItem?: any;
  onSave?: (sectionData: any) => void;
  onCancel: () => void;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'blockquote', 'code-block',
  'list', 'bullet',
  'indent',
  'size',
  'color', 'background',
  'align',
];

export default function Section1Editor({ onCancel }: Section1EditorProps) {
  // Static content - now editable
  const [mainTitle, setMainTitle] = useState('Fresh Fish for Online Purchase in Dubai Seafood Delivery Direct to Your Doorstep');
  const [image1File, setImage1File] = useState<File | null>(null);
  const [image1Preview, setImage1Preview] = useState<string>('');
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image2Preview, setImage2Preview] = useState<string>('');
  const [description1, setDescription1] = useState('Fisho.ae offers an easy and fast online service where you can buy fish in Dubai. With various hand-picked seafood choices and a smart, simple Fisho.ae online fish delivery in Dubai, you can enjoy the best catches from the ocean delivered right to your door. From filling very homesick checks to paying homage to the luxuries offered to us by the blue ocean, we present an endless range of marine products in Dubai with the best quality.');
  const [title2, setTitle2] = useState('The Fisho.ae Way');
  const [image3File, setImage3File] = useState<File | null>(null);
  const [image3Preview, setImage3Preview] = useState<string>('');
  const [description2, setDescription2] = useState('Fisho.ae reigns supreme in providing fresh fish in Dubai. We effectively source fish from only the biggest suppliers to guarantee fast deliveries that center around the freshness and taste of our products. Our pride lies in our main goal, ensuring customer satisfaction. We bring the seafood market to your home so that you may save time and effort among other market struggles. So spare some time and see the benefits offered by our online seafood in Dubai for your good life as seafood lovers.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (imageNumber === 1) {
          setImage1File(file);
          setImage1Preview(reader.result as string);
        } else if (imageNumber === 2) {
          setImage2File(file);
          setImage2Preview(reader.result as string);
        } else {
          setImage3File(file);
          setImage3Preview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (imageNumber: 1 | 2 | 3) => {
    if (imageNumber === 1) {
      setImage1File(null);
      setImage1Preview('');
    } else if (imageNumber === 2) {
      setImage2File(null);
      setImage2Preview('');
    } else {
      setImage3File(null);
      setImage3Preview('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, just show success message - API integration pending
      toast.success('Section content updated successfully');
      console.log({
        mainTitle,
        image1: image1File?.name,
        image2: image2File?.name,
        description1,
        title2,
        image3: image3File?.name,
        description2,
      });
      setIsSubmitting(false);
      onCancel();
    } catch (e: any) {
      const msg = e?.message || 'Failed to save section';
      console.error('Save section error:', e);
      toast.error(msg);
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
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-gray-900">Edit Section 1 Content</h2>
          <p className="text-gray-500 text-sm mt-1">Update main section content</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Section Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Main Title */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainTitle">Main Title *</Label>
                <Input
                  id="mainTitle"
                  value={mainTitle}
                  onChange={(e) => setMainTitle(e.target.value)}
                  placeholder="Enter main title"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">{mainTitle.length}/150 characters</p>
              </div>

              {/* Images Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image 1 */}
                <div className="space-y-2">
                  <Label>Image 1 (Left)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    {image1Preview ? (
                      <div className="space-y-2">
                        <img
                          src={image1Preview}
                          alt="Preview 1"
                          className="max-h-40 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(1)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                       
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 1)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Image 2 */}
                <div className="space-y-2">
                  <Label>Image 2 (Right)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    {image2Preview ? (
                      <div className="space-y-2">
                        <img
                          src={image2Preview}
                          alt="Preview 2"
                          className="max-h-40 mx-auto rounded"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(2)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 2)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description1">Description 1 *</Label>
                <ReactQuill
                  theme="snow"
                  value={description1}
                  onChange={setDescription1}
                  modules={modules}
                  formats={formats}
                  placeholder="Enter detailed description for section 1"
                  style={{ minHeight: '250px' }}
                />
              </div>
            </div>

            {/* Section 2: Title and Description */}
            <div className="border-t pt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title2">Section 2 Title *</Label>
                <Input
                  id="title2"
                  value={title2}
                  onChange={(e) => setTitle2(e.target.value)}
                  placeholder="Enter section 2 title"
                  className="text-base"
                />
                <p className="text-xs text-gray-500">{title2.length}/100 characters</p>
              </div>

              {/* Image 3 */}
              <div className="space-y-2">
                <Label>Image 3</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                  {image3Preview ? (
                    <div className="space-y-2">
                      <img
                        src={image3Preview}
                        alt="Preview 3"
                        className="max-h-40 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(3)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 3)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description2">Description 2 *</Label>
                <ReactQuill
                  theme="snow"
                  value={description2}
                  onChange={setDescription2}
                  modules={modules}
                  formats={formats}
                  placeholder="Enter detailed description for section 2"
                  style={{ minHeight: '250px' }}
                />
              </div>
            </div>

            

            {/* Form Actions */}
            <div className="flex gap-3 border-t pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
