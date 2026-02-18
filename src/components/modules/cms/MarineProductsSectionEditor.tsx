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
import { toast } from 'react-toastify';
import { apiFetch } from '../../../lib/api';

interface MarineProductCard {
  id: string;
  description: string;
  image: string;
  order?: number;
}

interface MarineProductsSectionData {
  _id?: string;
  mainHeading: string;
  mainDescription: string;
  cards: MarineProductCard[];
  isActive?: boolean;
}

interface MarineProductsSectionEditorProps {
  sectionItem?: any;
  onCancel: () => void;
}

export default function MarineProductsSectionEditor({ sectionItem, onCancel }: MarineProductsSectionEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mainHeading, setMainHeading] = useState('Check Out Our Marine Products in Dubai');
  const [mainDescription, setMainDescription] = useState('');
  const [cards, setCards] = useState<MarineProductCard[]>([]);
  const [editingCard, setEditingCard] = useState<MarineProductCard | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<MarineProductCard | null>(null);

  // Card form states
  const [cardDescription, setCardDescription] = useState('');
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string>('');
  const [uploadingCard, setUploadingCard] = useState(false);

  const IMAGE_BASE = ((import.meta as any).env?.VITE_IMAGE_BASE_URL || (import.meta as any).env?.VITE_BASE_URL) as string | undefined;

  // Load existing section data
  useEffect(() => {
    loadSectionData();
  }, []);

  const loadSectionData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API endpoint when available
      // For now, using static data
      const staticData: MarineProductsSectionData = {
        mainHeading: 'Check Out Our Marine Products in Dubai',
        mainDescription: 'Fisho.ae has stocked a whole tide of seafood and marine products, especially in Dubai, such as',
        cards: [
          {
            id: '1',
            description: 'Some fresh local fish types like Hamour, Kingfish, and Sheri.',
            image: '/placeholder-marine1.jpg',
            order: 1
          },
          {
            id: '2',
            description: 'Imported fish like Salmon, Tuna, and Mackerel.',
            image: '/placeholder-marine2.jpg',
            order: 2
          },
          {
            id: '3',
            description: 'Shellfish like prawns, crabs, lobsters.',
            image: '/placeholder-marine3.jpg',
            order: 3
          },
          {
            id: '4',
            description: 'Specifically for seafood lovers, specialty products.',
            image: '/placeholder-marine4.jpg',
            order: 4
          }
        ]
      };

      setMainHeading(staticData.mainHeading);
      setMainDescription(staticData.mainDescription);
      setCards(staticData.cards);
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
    if (!mainDescription.trim()) {
      toast.error('Main description is required');
      return;
    }

    setSaving(true);
    try {
      const sectionData: MarineProductsSectionData = {
        mainHeading,
        mainDescription,
        cards,
        isActive: true
      };

      // TODO: Replace with actual API endpoint when available
      // const res = await apiFetch('/api/marine-products-section', {
      //   method: 'POST',
      //   body: JSON.stringify(sectionData)
      // });

      toast.success('Section saved successfully');
      console.log('Section data to save:', sectionData);
      
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

  const handleAddCard = () => {
    setEditingCard(null);
    setCardDescription('');
    setCardImage(null);
    setCardImagePreview('');
    setIsCardDialogOpen(true);
  };

  const handleEditCard = (card: MarineProductCard) => {
    setEditingCard(card);
    setCardDescription(card.description);
    setCardImage(null);
    setCardImagePreview(card.image.startsWith('/') && IMAGE_BASE ? `${IMAGE_BASE}${card.image}` : card.image);
    setIsCardDialogOpen(true);
  };

  const handleDeleteCard = (card: MarineProductCard) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCard = () => {
    if (!cardToDelete) return;
    setCards(cards.filter(c => c.id !== cardToDelete.id));
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
      let imageUrl = editingCard?.image || '';

      // Upload image if new file selected
      if (cardImage) {
        const formData = new FormData();
        formData.append('image', cardImage);

        // TODO: Replace with actual image upload endpoint
        // const uploadRes = await apiFetch('/api/upload/image', {
        //   method: 'POST',
        //   body: formData
        // });
        // imageUrl = uploadRes.imageUrl;

        // For now, use preview URL
        imageUrl = cardImagePreview;
      }

      if (editingCard) {
        // Update existing card
        setCards(cards.map(c => 
          c.id === editingCard.id 
            ? { ...c, description: cardDescription, image: imageUrl }
            : c
        ));
        toast.success('Card updated successfully');
      } else {
        // Add new card
        const newCard: MarineProductCard = {
          id: `card-${Date.now()}`,
          description: cardDescription,
          image: imageUrl,
          order: cards.length + 1
        };
        setCards([...cards, newCard]);
        toast.success('Card added successfully');
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
    setCardDescription('');
    setCardImage(null);
    setCardImagePreview('');
  };

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
            <h1 className="text-2xl font-semibold">Marine Products Section Editor</h1>
          </div>
          <p className="text-gray-600 mt-1">
            Manage the main heading, description, and product image cards
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
              placeholder="e.g., Check Out Our Marine Products in Dubai"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="mainDescription">Main Description *</Label>
            <Textarea
              id="mainDescription"
              value={mainDescription}
              onChange={(e) => setMainDescription(e.target.value)}
              placeholder="Enter the main description for this section"
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cards Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Product Image Cards ({cards.length})</CardTitle>
          <Button onClick={handleAddCard} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </CardHeader>
        <CardContent>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cards.map((card, index) => (
                <Card key={card.id} className="overflow-hidden">
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={card.image.startsWith('/') && IMAGE_BASE ? `${IMAGE_BASE}${card.image}` : card.image}
                      alt={card.description}
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
                    <p className="text-sm text-gray-600 line-clamp-2">{card.description}</p>
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
              {editingCard ? 'Edit Product Card' : 'Add New Product Card'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the details for this product image card
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cardDescription">Card Description *</Label>
              <Textarea
                id="cardDescription"
                value={cardDescription}
                onChange={(e) => setCardDescription(e.target.value)}
                placeholder="e.g., Some fresh local fish types like Hamour, Kingfish, and Sheri."
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cardImage">Product Image *</Label>
              <div className="mt-2">
                {cardImagePreview ? (
                  <div className="relative">
                    <img
                      src={cardImagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setCardImage(null);
                        setCardImagePreview('');
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
              Are you sure you want to delete this card? This action cannot be undone.
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
    </div>
  );
}
