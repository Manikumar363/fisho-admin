import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';

interface TextContentEditorProps {
  contentType: 'terms' | 'privacy' | 'legal';
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

  const contentTypeLabels = {
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    legal: 'Legal & Compliances'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      content
    });
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

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Content Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter content title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
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
                disabled={!title || !content}
              >
                Save Content
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
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
    </div>
  );
}