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
  mainHeading: string;
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
  const [mainHeading, setMainHeading] = useState('Frequently Asked Questions');
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

  // Load existing section data
  useEffect(() => {
    loadSectionData();
  }, []);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint when available
      // For now, using static data
      const staticData: FAQSectionData = {
        mainHeading: 'Frequently Asked Questions',
        faqs: [
          {
            id: '1',
            question: 'How can I buy fish online in Dubai from Fisho.ae?',
            answer: 'You can easily browse our wide selection of fresh fish and seafood on our website, add items to your cart, and proceed to checkout. We offer multiple payment options and fast delivery across Dubai.',
            order: 1
          },
          {
            id: '2',
            question: 'Is the fish really fresh?',
            answer: 'Yes, we guarantee the freshness of all our products. Each fish and seafood product is carefully stored and shipped under high hygiene standards to ensure maximum freshness when it reaches your doorstep.',
            order: 2
          },
          {
            id: '3',
            question: 'Do you provide same-day delivery in Dubai?',
            answer: 'We offer express delivery service for orders placed before a certain time. Check our delivery options at checkout to see if same-day delivery is available for your location.',
            order: 3
          },
          {
            id: '4',
            question: 'Can I schedule my delivery of seafood?',
            answer: 'Yes, you can schedule your delivery at a convenient time during checkout. We provide flexible delivery time slots to accommodate your schedule.',
            order: 4
          },
          {
            id: '5',
            question: 'What kinds of marine products do you offer in Dubai?',
            answer: 'We offer a wide variety of marine products including local fish like Hamour and Kingfish, imported fish like Salmon and Tuna, shellfish like prawns and crabs, and specialty seafood products.',
            order: 5
          },
          {
            id: '6',
            question: 'Is there a minimum order requirement?',
            answer: 'We have a minimum order value to ensure efficient delivery. The exact amount may vary based on your location. Please check our website for current minimum order requirements.',
            order: 6
          },
          {
            id: '7',
            question: 'How do you maintain hygiene and quality?',
            answer: 'We follow strict hygiene standards in handling, storage, and delivery of all products. Our team is trained in food safety and our facilities are regularly inspected.',
            order: 7
          },
          {
            id: '8',
            question: 'If I don\'t like certain seafood, can I return or exchange it?',
            answer: 'Yes, we have a return and exchange policy. If you receive any product that doesn\'t meet our quality standards, please contact us within 24 hours for a replacement or refund.',
            order: 8
          }
        ]
      };

      setMainHeading(staticData.mainHeading);
      setFaqs(staticData.faqs);
    } catch (error: any) {
      console.error('Failed to load section data:', error);
      toast.error('Failed to load section data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async () => {
    if (!mainHeading.trim()) {
      toast.error('Main heading is required');
      return;
    }
    if (faqs.length === 0) {
      toast.error('At least one FAQ item is required');
      return;
    }

    setSaving(true);
    try {
      const sectionData: FAQSectionData = {
        mainHeading,
        faqs,
        isActive: true
      };

      // TODO: Replace with actual API endpoint when available
      // const res = await apiFetch('/api/faq-section', {
      //   method: 'POST',
      //   body: JSON.stringify(sectionData)
      // });

      toast.success('FAQ section saved successfully');
      console.log('FAQ section data to save:', sectionData);
      
      // For now, just show success
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
          disabled={saving}
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
            <Label htmlFor="mainHeading">Main Heading *</Label>
            <Input
              id="mainHeading"
              value={mainHeading}
              onChange={(e) => setMainHeading(e.target.value)}
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
