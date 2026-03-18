import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../ui/collapsible';
import { toast } from 'react-toastify';
import { apiFetch } from '../../../lib/api';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order?: number;
}

interface FAQSectionData {
  _id?: string;
  title: string;
  faqs: FAQItem[];
  isActive?: boolean;
}

interface FAQSectionEditorProps {
  sectionItem?: any;
  onCancel: () => void;
}

export default function FAQSectionEditor({ sectionItem, onCancel }: FAQSectionEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Frequently Asked Questions');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [isFAQDialogOpen, setIsFAQDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<FAQItem | null>(null);
  const [expandedFAQs, setExpandedFAQs] = useState<Set<string>>(new Set());

  // FAQ form states
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [savingFAQ, setSavingFAQ] = useState(false);
  const [initialSectionState, setInitialSectionState] = useState<{
    title: string;
    faqsSignature: string;
  } | null>(null);

  const getFaqsSignature = (inputFaqs: FAQItem[]) =>
    JSON.stringify(
      inputFaqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
      }))
    );

  // Load existing section data
  useEffect(() => {
    loadSectionData();
  }, []);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        section?: {
          _id: string;
          title: string;
          faqs: Array<{
            _id?: string;
            question: string;
            answer: string;
          }>;
          isDeleted?: boolean;
          isActive?: boolean;
          createdAt: string;
          updatedAt: string;
        };
        message?: string;
      }>('/api/landing/faq-section');

      if (!res?.success || !res.section) {
        throw new Error(res?.message || 'Failed to load FAQ section');
      }

      const section = res.section;
      setTitle(section.title || 'Frequently Asked Questions');
      
      // Map faqs with temporary IDs for new items
      const mappedFaqs: FAQItem[] = section.faqs.map((faq, index) => ({
        id: faq._id || `faq-${Date.now()}-${index}`,
        question: faq.question,
        answer: faq.answer,
        order: index + 1
      }));
      
      setFaqs(mappedFaqs);
      setInitialSectionState({
        title: section.title || 'Frequently Asked Questions',
        faqsSignature: getFaqsSignature(mappedFaqs),
      });
    } catch (error: any) {
      console.error('Failed to load section data:', error);
      toast.error('Failed to load section data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!title.trim()) {
      toast.error('Main heading is required');
      return;
    }
    if (faqs.length === 0) {
      toast.error('At least one FAQ item is required');
      return;
    }

    setSaving(true);
    try {
      // Sanitize FAQs: remove temporary IDs (those starting with 'faq-')
      const sanitizedFaqs = faqs.map(faq => {
        const { id, order, ...faqData } = faq;
        // Only include _id if it's a real MongoDB ObjectId (not starting with 'faq-')
        if (id && !id.startsWith('faq-')) {
          return { _id: id, ...faqData };
        }
        return faqData;
      });

      const sectionData = {
        title,
        faqs: sanitizedFaqs
      };

      const res = await apiFetch<{
        success: boolean;
        section?: any;
        message?: string;
      }>('/api/landing/faq-section', {
        method: 'POST',
        body: JSON.stringify(sectionData)
      });

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to save FAQ section');
      }

      toast.success(res.message || 'FAQ Section updated Successfully');
      console.log('FAQ section saved:', res.section);
      
      setTimeout(() => {
        onCancel();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to save section:', error);
      toast.error(error?.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFAQ = () => {
    setEditingFAQ(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setIsFAQDialogOpen(true);
  };

  const handleEditFAQ = (faq: FAQItem) => {
    setEditingFAQ(faq);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setIsFAQDialogOpen(true);
  };

  const handleDeleteFAQ = (faq: FAQItem) => {
    setFaqToDelete(faq);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteFAQ = () => {
    if (!faqToDelete) return;
    setFaqs(faqs.filter(f => f.id !== faqToDelete.id));
    toast.success('FAQ deleted successfully');
    setDeleteDialogOpen(false);
    setFaqToDelete(null);
  };

  const handleSaveFAQ = async () => {
    if (!faqQuestion.trim()) {
      toast.error('Question is required');
      return;
    }
    if (!faqAnswer.trim()) {
      toast.error('Answer is required');
      return;
    }

    setSavingFAQ(true);
    try {
      if (editingFAQ) {
        // Update existing FAQ
        setFaqs(faqs.map(f => 
          f.id === editingFAQ.id 
            ? { ...f, question: faqQuestion, answer: faqAnswer }
            : f
        ));
        toast.success('FAQ updated successfully');
      } else {
        // Add new FAQ
        const newFAQ: FAQItem = {
          id: `faq-${Date.now()}`,
          question: faqQuestion,
          answer: faqAnswer,
          order: faqs.length + 1
        };
        setFaqs([...faqs, newFAQ]);
        toast.success('FAQ added successfully');
      }

      setIsFAQDialogOpen(false);
      resetFAQForm();
    } catch (error: any) {
      console.error('Failed to save FAQ:', error);
      toast.error(error?.message || 'Failed to save FAQ');
    } finally {
      setSavingFAQ(false);
    }
  };

  const resetFAQForm = () => {
    setEditingFAQ(null);
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const moveFAQ = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
    setFaqs(newFaqs);
    toast.success(`FAQ moved ${direction}`);
  };

  const toggleFAQExpand = (id: string) => {
    const newExpanded = new Set(expandedFAQs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFAQs(newExpanded);
  };

  const hasSectionChanges =
    !initialSectionState ||
    title !== initialSectionState.title ||
    getFaqsSignature(faqs) !== initialSectionState.faqsSignature;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading FAQ data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold">FAQ Section Editor</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Manage the FAQ section heading and questions with answers
          </p>
        </div>
        <Button 
          onClick={handleSaveSection}
          disabled={saving || !hasSectionChanges}
          className="bg-green-600 hover:bg-green-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Section'}
        </Button>
      </div>

      {/* Main Section Details */}
      <Card>
        <CardHeader>
          <CardTitle>Main Section Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Main Heading *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Frequently Asked Questions"
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQs Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>FAQ Items ({faqs.length})</CardTitle>
          <Button onClick={handleAddFAQ} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add FAQ
          </Button>
        </CardHeader>
        <CardContent>
          {faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <Card key={faq.id} className="overflow-hidden">
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <button
                        onClick={() => toggleFAQExpand(faq.id)}
                        className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 text-left">
                          <div className="flex flex-col items-center gap-1">
                            <Badge className="bg-blue-600 text-white">
                              #{index + 1}
                            </Badge>
                            <div className="flex gap-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFAQ(index, 'up');
                                }}
                                disabled={index === 0}
                                className="p-1 h-6 w-6 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveFAQ(index, 'down');
                                }}
                                disabled={index === faqs.length - 1}
                                className="p-1 h-6 w-6 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 line-clamp-1">{faq.question}</p>
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{faq.answer}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQs.has(faq.id) ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="space-y-3 mb-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Question:</p>
                            <p className="text-gray-600 text-sm">{faq.question}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Answer:</p>
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{faq.answer}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFAQ(faq)}
                            className="text-blue-600 hover:text-blue-700 border-blue-600"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFAQ(faq)}
                            className="text-red-600 hover:text-red-700 border-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-3">No FAQs added yet</p>
              <Button onClick={handleAddFAQ} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add First FAQ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ Edit Dialog */}
      <AlertDialog open={isFAQDialogOpen} onOpenChange={setIsFAQDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the question and answer for this FAQ item
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="faqQuestion">Question *</Label>
              <Input
                id="faqQuestion"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="e.g., How can I buy fish online in Dubai from Fisho.ae?"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="faqAnswer">Answer *</Label>
              <Textarea
                id="faqAnswer"
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Enter the answer for this FAQ question"
                rows={6}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use multiple lines for detailed answers
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsFAQDialogOpen(false);
              resetFAQForm();
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveFAQ}
              disabled={savingFAQ}
              className="bg-green-600 hover:bg-green-700"
            >
              {savingFAQ ? 'Saving...' : editingFAQ ? 'Update FAQ' : 'Add FAQ'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFAQ}
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
