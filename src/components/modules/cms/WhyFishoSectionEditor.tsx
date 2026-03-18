import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { ImageWithFallback } from '../../ui/ImageWithFallback';
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
import { toast, ToastContainer } from 'react-toastify';
import { apiFetch } from '../../../lib/api';

interface WhyFishoCard {
  _id?: string;
  title: string;
  description: string;
  image: string;
}

interface WhyFishoSectionData {
  _id?: string;
  title: string;
  description?: string;
  description1: string;
  featuredCards: WhyFishoCard[];
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface WhyFishoSectionEditorProps {
  sectionItem?: any;
  onCancel: () => void;
}

export default function WhyFishoSectionEditor({ sectionItem, onCancel }: WhyFishoSectionEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Why Choose Fisho?');
  const [description1, setDescription1] = useState('');
  const [cards, setCards] = useState<WhyFishoCard[]>([]);
  const [editingCard, setEditingCard] = useState<WhyFishoCard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<WhyFishoCard | null>(null);

  // Card form states
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardImagePath, setCardImagePath] = useState('');
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [uploadingCard, setUploadingCard] = useState(false);
  const [initialSectionState, setInitialSectionState] = useState<{
    title: string;
    description1: string;
    cardsSignature: string;
  } | null>(null);

  const IMAGE_BASE = ((import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_BASE_URL) as string | undefined;

  // Resolve image URL by prepending base URL
  const resolveImageUrl = (path?: string) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path;
    
    const base = IMAGE_BASE?.replace(/\/$/, '') || '';
    if (!base) return path;
    
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  };

  const getCardsSignature = (inputCards: WhyFishoCard[]) =>
    JSON.stringify(
      inputCards.map((card) => ({
        _id: card._id || '',
        title: card.title,
        description: card.description,
        image: card.image,
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
        section?: WhyFishoSectionData;
        message?: string;
      }>('/api/landing/why-fisho-section');

      if (!res?.success || !res.section) {
        throw new Error(res?.message || 'Failed to load section data');
      }

      const section = res.section;
      setTitle(section.title);
      setDescription1(section.description ?? section.description1 ?? '');
      setCards(section.featuredCards || []);
      setInitialSectionState({
        title: section.title,
        description1: section.description ?? section.description1 ?? '',
        cardsSignature: getCardsSignature(section.featuredCards || []),
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
      toast.error('Title is required');
      return;
    }
    if (!description1.trim()) {
      toast.error('Description is required');
      return;
    }

    setSaving(true);
    try {
      const sanitizedTitle = title.trim();
      const sanitizedDescription = description1.trim();

      // Remove temporary _id fields from new cards before sending to backend
      const cleanedCards = cards.map(card => {
        const { _id, ...rest } = card;
        // Only include _id if it's a real MongoDB ObjectId (not our temporary "card-" prefix)
        if (_id && !_id.startsWith('card-')) {
          return card;
        }
        return rest;
      });

      const sectionData = {
        title: sanitizedTitle,
        // Keep both keys for backward compatibility while backend expects `description`.
        description: sanitizedDescription,
        description1: sanitizedDescription,
        featuredCards: cleanedCards,
        isActive: true
      };

      const res = await apiFetch<{
        success: boolean;
        section?: WhyFishoSectionData;
        message?: string;
      }>('/api/landing/why-fisho-section', {
        method: 'POST',
        body: JSON.stringify(sectionData)
      });

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to save section');
      }

      toast.success(res?.message || 'Why Fisho Section updated Successfully');
      
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

  const handleAddCard = () => {
    setEditingCard(null);
    setCardTitle('');
    setCardDescription('');
    setCardImage(null);
    setCardImagePath('');
    setCardImagePreview('');
    setIsCardDialogOpen(true);
  };

  const handleEditCard = (card: WhyFishoCard) => {
    setEditingCard(card);
    setCardTitle(card.title);
    setCardDescription(card.description);
    setCardImage(null);
    setCardImagePath(card.image);
    setCardImagePreview(resolveImageUrl(card.image));
    setIsCardDialogOpen(true);
  };

  const handleDeleteCard = (card: WhyFishoCard) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCard = () => {
    if (!cardToDelete) return;
    const cardId = cardToDelete._id || cardToDelete.title;
    setCards(cards.filter(c => (c._id || c.title) !== cardId));
    toast.success('Card deleted successfully');
    setDeleteDialogOpen(false);
    setCardToDelete(null);
  };

  const handleCardImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setCardImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCardImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCard = async () => {
    if (!cardTitle.trim()) {
      toast.error('Card title is required');
      return;
    }
    if (!cardDescription.trim()) {
      toast.error('Card description is required');
      return;
    }
    if (!cardImagePreview && !editingCard) {
      toast.error('Card image is required');
      return;
    }

    setUploadingCard(true);
    try {
      let imagePath = cardImagePath;

      // Upload image if new file selected
      if (cardImage) {
        const formData = new FormData();
        formData.append('image', cardImage);

        const uploadRes = await apiFetch<{
          location?: string;
          message?: string;
        }>('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!uploadRes?.location) {
          throw new Error(uploadRes?.message || 'Failed to upload image');
        }

        imagePath = uploadRes.location;
      }

      // For new cards, ensure we have an image path
      if (!editingCard && !imagePath) {
        toast.error('Image upload failed. Please try again.');
        setUploadingCard(false);
        return;
      }

      if (editingCard) {
        // Update existing card
        const updatedCards = cards.map(c => 
          (c._id === editingCard._id || c.title === editingCard.title)
            ? { ...c, title: cardTitle, description: cardDescription, image: imagePath }
            : c
        );
        setCards(updatedCards);
        toast.success('Card updated successfully');
        console.log('Card updated:', { title: cardTitle, image: imagePath });
      } else {
        // Add new card to local array
        const newCard: WhyFishoCard = {
          _id: `card-${Date.now()}`,
          title: cardTitle,
          description: cardDescription,
          image: imagePath,
        };
        const updatedCards = [...cards, newCard];
        setCards(updatedCards);
        toast.success('Card added successfully');
        console.log('New card added:', newCard);
        console.log('Updated cards array:', updatedCards);
      }

      setIsCardDialogOpen(false);
      resetCardForm();
    } catch (error: any) {
      console.error('Failed to save card:', error);
      toast.error(error?.message || 'Failed to save card');
    } finally {
      setUploadingCard(false);
    }
  };

  const resetCardForm = () => {
    setEditingCard(null);
    setCardTitle('');
    setCardDescription('');
    setCardImage(null);
    setCardImagePath('');
    setCardImagePreview('');
  };

  const hasSectionChanges =
    !initialSectionState ||
    title !== initialSectionState.title ||
    description1 !== initialSectionState.description1 ||
    getCardsSignature(cards) !== initialSectionState.cardsSignature;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading section data...</div>
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
            <h1 className="text-2xl font-semibold">Why Fisho Section Editor</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Manage the title, description, and featured cards
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
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Why Choose Fisho?"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description1">Description *</Label>
            <Textarea
              id="description1"
              value={description1}
              onChange={(e) => setDescription1(e.target.value)}
              placeholder="Enter the description for this section"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cards Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Featured Cards ({cards.length})</CardTitle>
          <Button onClick={handleAddCard} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </CardHeader>
        <CardContent>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card, index) => (
                <Card key={card._id || index} className="overflow-hidden">
                  <div className="relative h-40">
                    <ImageWithFallback
                      src={resolveImageUrl(card.image)}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-600 text-white">
                        #{index + 1}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditCard(card)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteCard(card)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-1">{card.title}</h4>
                    <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No cards added yet</p>
              <Button onClick={handleAddCard} size="sm" className="mt-3">
                <Plus className="w-4 h-4 mr-1" />
                Add First Card
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card Edit Dialog */}
      <AlertDialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingCard ? 'Edit Card' : 'Add New Card'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the details for this featured card
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cardTitle">Card Title *</Label>
              <Input
                id="cardTitle"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="e.g., Fresh Catch Everyday"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="cardDescription">Card Description *</Label>
              <Textarea
                id="cardDescription"
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                placeholder="Enter the card description"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cardImage">Card Image *</Label>
              <div className="mt-2">
                {cardImagePreview ? (
                  <div className="relative">
                    <img
                      src={cardImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCardImage(null);
                        setCardImagePreview('');
                        setCardImagePath('');
                      }}
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload image</p>
                    <Input
                      id="cardImage"
                      type="file"
                      accept="image/*"
                      onChange={handleCardImageChange}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsCardDialogOpen(false);
              resetCardForm();
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveCard}
              disabled={uploadingCard}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploadingCard ? 'Saving...' : editingCard ? 'Update Card' : 'Add Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{cardToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCard}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}
