import React, { useMemo, useState } from 'react';
import { Search, Edit, Trash2, FileText, ShieldCheck, Scale, BookOpen } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
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
  AlertDialogTitle
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select';
import { toast } from 'sonner';

interface CMSPage {
  id: string;
  title: string;
  status: 'Published' | 'Draft';
  updatedBy: string;
  lastUpdated: string;
  content: string;
}

const initialPages: CMSPage[] = [
  {
    id: 'CMS-001',
    title: 'Privacy Policy',
    status: 'Published',
    updatedBy: 'Legal Team',
    lastUpdated: '2025-11-12',
    content: '<h2>Privacy Policy</h2><p>Describe how user data is collected, stored, and used. Outline consent, cookies, analytics, and data sharing practices.</p>'
  },
  {
    id: 'CMS-002',
    title: 'Terms & Conditions',
    status: 'Published',
    updatedBy: 'Admin User',
    lastUpdated: '2025-10-28',
    content: '<h2>Terms & Conditions</h2><p>Detail user responsibilities, acceptable use, payment terms, and disclaimers. Include termination and liability clauses.</p>'
  },
  {
    id: 'CMS-003',
    title: 'Legal / Compliance',
    status: 'Draft',
    updatedBy: 'Compliance',
    lastUpdated: '2025-09-15',
    content: '<h2>Legal / Compliance</h2><p>Summarize legal notices, grievance contacts, and compliance statements (e.g., PCI, GDPR equivalents where applicable).</p>'
  }
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ]
};

export default function CMS() {
  const [pages, setPages] = useState<CMSPage[]>(initialPages);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Published' | 'Draft'>('all');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id ?? null);
  const [editorContent, setEditorContent] = useState(initialPages[0]?.content ?? '');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
      const matchesSearch =
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [pages, searchQuery, statusFilter]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) ?? null,
    [pages, selectedPageId]
  );

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId);
    const page = pages.find((item) => item.id === pageId);
    setEditorContent(page?.content ?? '');
  };

  const handleSave = () => {
    if (!selectedPageId) {
      return;
    }

    setPages((prev) =>
      prev.map((page) =>
        page.id === selectedPageId
          ? {
              ...page,
              content: editorContent,
              lastUpdated: new Date().toISOString().slice(0, 10),
              updatedBy: 'Admin User'
            }
          : page
      )
    );

    toast.success('Page content saved');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;

    setPages((prev) => prev.filter((page) => page.id !== deleteTarget));

    if (selectedPageId === deleteTarget) {
      const remaining = pages.filter((page) => page.id !== deleteTarget);
      const nextSelection = remaining[0];
      setSelectedPageId(nextSelection?.id ?? null);
      setEditorContent(nextSelection?.content ?? '');
    }

    setDeleteTarget(null);
    toast.success('Page deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Content Management</h1>
          <p className="text-gray-600">Review, edit, and publish static policy pages</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by title"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-56">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'Published' | 'Draft')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Pages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-6 text-gray-500">
                        No pages found
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((page) => (
                      <tr
                        key={page.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${
                          selectedPageId === page.id ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{page.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={page.status === 'Published' ? 'default' : 'secondary'}
                            className={
                              page.status === 'Published'
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                            }
                          >
                            {page.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectPage(page.id)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(page.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedPage?.title || 'Select a page'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPage ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Status: </span>
                    <Badge
                      variant={selectedPage.status === 'Published' ? 'default' : 'secondary'}
                      className={
                        selectedPage.status === 'Published'
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      }
                    >
                      {selectedPage.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span>Last updated: {selectedPage.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Updated by: {selectedPage.updatedBy}</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <ReactQuill
                    theme="snow"
                    value={editorContent}
                    onChange={setEditorContent}
                    modules={quillModules}
                    className="min-h-[280px]"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setEditorContent(selectedPage.content)}
                  >
                    Reset
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-sm">Select a page to edit its content.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting a CMS page will remove it from the list. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
