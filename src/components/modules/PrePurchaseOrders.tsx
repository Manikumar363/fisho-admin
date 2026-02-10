import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Trash2, Download, X, Calendar } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';

interface Particular {
  id: string;
  product: string;
  costPrice: string;
  quantity: string;
  amount: number;
  vat: string;
  totalAmount: number;
  rfv?: string;
}

export default function PrePurchaseOrders() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [ppoToDelete, setPpoToDelete] = useState<string | null>(null);
  const [isDeletingPpo, setIsDeletingPpo] = useState(false);
  const [selectedPpo, setSelectedPpo] = useState<any>(null);
  const [isLoadingViewPpo, setIsLoadingViewPpo] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPpoId, setEditingPpoId] = useState<string | null>(null);
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [rfv, setRfv] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPpo, setIsLoadingPpo] = useState(false);
  const [ppos, setPpos] = useState<any[]>([]);
  const [pposLoading, setPposLoading] = useState(false);
  const [pposError, setPposError] = useState<string | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [particulars, setParticulars] = useState<Particular[]>([
    {
      id: '1',
      product: '',
      costPrice: '',
      quantity: '',
      amount: 0,
      vat: '',
      totalAmount: 0
    }
  ]);

  useEffect(() => {
    fetchPpos();
    fetchVendors();
    fetchProducts();
  }, []);

  // Auto-update global RFV when particulars change
  useEffect(() => {
    const totalValue = particulars.reduce((sum, p) => sum + p.totalAmount, 0);
    if (totalValue === 0) {
      setRfv('');
    } else {
      // Round to nearest 10
      const roundedValue = Math.ceil(totalValue / 10) * 10;
      setRfv(roundedValue.toFixed(2));
    }
  }, [particulars]);

  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        vendors: any[];
        message?: string;
      }>('/api/vendors');

      if (!res.success) throw new Error(res.message || 'Failed to fetch vendors');
      setVendors(res.vendors || []);
    } catch (e: any) {
      console.error('Fetch vendors error:', e);
    } finally {
      setVendorsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        products: any[];
        message?: string;
      }>('/api/products');

      if (!res.success) throw new Error(res.message || 'Failed to fetch products');
      setProducts(res.products || []);
    } catch (e: any) {
      console.error('Fetch products error:', e);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchPpos = async () => {
    setPposLoading(true);
    setPposError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        count: number;
        ppos: any[];
        message?: string;
      }>('/api/ppos');

      if (!res.success) throw new Error(res.message || 'Failed to fetch PPOs');

      setPpos(res.ppos || []);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load PPOs';
      setPposError(msg);
      console.error('Fetch PPOs error:', e);
    } finally {
      setPposLoading(false);
    }
  };

  const handleViewPpo = async (ppoId: string) => {
    setIsLoadingViewPpo(true);
    setShowViewModal(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        ppo: any;
        message?: string;
      }>(`/api/ppos/${ppoId}`);

      if (!res.success) throw new Error(res.message || 'Failed to fetch PPO details');

      setSelectedPpo(res.ppo);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load PPO details';
      console.error('Fetch PPO details error:', e);
      toast.error(msg);
      setShowViewModal(false);
    } finally {
      setIsLoadingViewPpo(false);
    }
  };

  const handleEditPpo = async (ppoId: string) => {
    setIsLoadingPpo(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        ppo: any;
        message?: string;
      }>(`/api/ppos/${ppoId}`);

      if (!res.success) throw new Error(res.message || 'Failed to fetch PPO details');

      const ppo = res.ppo;
      
      // Populate form with PPO data
      setBillNo(ppo.billNo);
      setDate(ppo.date.split('T')[0]); // Format date for input
      setVendor(ppo.vendor._id || ppo.vendor);
      setNotes(ppo.notes || '');
      
      // Map particulars with product IDs
      const mappedParticulars = ppo.particulars.map((p: any, index: number) => ({
        id: p._id || index.toString(),
        product: p.product._id || p.product,
        costPrice: p.costPrice.toString(),
        quantity: p.quantity.toString(),
        amount: p.amount,
        vat: p.vat.toString(),
        totalAmount: p.totalAmount
      }));
      
      setParticulars(mappedParticulars);
      setRfv(ppo.rfv?.toString() || '');
      setIsEditMode(true);
      setEditingPpoId(ppoId);
      setShowAddForm(true);
    } catch (e: any) {
      const msg = e?.message || 'Failed to load PPO details';
      console.error('Fetch PPO details error:', e);
      toast.error(msg);
    } finally {
      setIsLoadingPpo(false);
    }
  };

  const handleDeletePpo = async () => {
    if (!ppoToDelete) return;

    setIsDeletingPpo(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message?: string;
      }>(`/api/ppos/${ppoToDelete}`, {
        method: 'DELETE'
      });

      if (!res.success) throw new Error(res.message || 'Failed to delete PPO');

      toast.success(res.message || 'PPO deleted successfully');
      setShowDeleteDialog(false);
      setPpoToDelete(null);
      
      // Refresh PPOs list
      await fetchPpos();
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete PPO';
      console.error('Delete PPO error:', e);
      toast.error(msg);
    } finally {
      setIsDeletingPpo(false);
    }
  };

  const handleDownloadPpo = async (ppoId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/ppos/${ppoId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PPO');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PPO_${ppoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PPO downloaded successfully');
    } catch (e: any) {
      const msg = e?.message || 'Failed to download PPO';
      console.error('Download PPO error:', e);
      toast.error(msg);
    }
  };

  const handleAddParticular = () => {
    setParticulars([
      ...particulars,
      {
        id: Date.now().toString(),
        product: '',
        costPrice: '',
        quantity: '',
        amount: 0,
        vat: '',
        totalAmount: 0,
        rfv: ''
      }
    ]);
  };

  const handleRemoveParticular = (id: string) => {
    if (particulars.length > 1) {
      setParticulars(particulars.filter(p => p.id !== id));
    }
  };

  // Function to calculate RFV (Round Figure Value) from total amount
  const calculateRFV = (amount: number): string => {
    if (amount === 0) return '';
    
    // Round to nearest 10
    const roundedValue = Math.ceil(amount / 10) * 10;
    return roundedValue.toFixed(2);
  };

  const handleParticularChange = (id: string, field: keyof Particular, value: string) => {
    setParticulars(particulars.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        
        // Calculate amount (Cost Price × Quantity)
        const costPrice = parseFloat(updated.costPrice) || 0;
        const quantity = parseFloat(updated.quantity) || 0;
        updated.amount = costPrice * quantity;
        
        // Calculate total amount (Amount + VAT%)
        const vat = parseFloat(updated.vat) || 0;
        updated.totalAmount = updated.amount + (updated.amount * vat / 100);
        
        // Auto-calculate RFV from totalAmount
        updated.rfv = calculateRFV(updated.totalAmount);
        
        return updated;
      }
      return p;
    }));
  };

  const calculatePPOTotal = () => {
    return particulars.reduce((sum, p) => sum + p.totalAmount, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!billNo || !date || !vendor) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate at least one particular
    const validParticulars = particulars.filter(p => p.product && p.costPrice && p.quantity && p.vat !== '');
    if (validParticulars.length === 0) {
      toast.error('Please add at least one particular');
      return;
    }

    setIsSubmitting(true);
    try {
      // Map particulars to include product IDs
      const mappedParticulars = validParticulars.map(p => ({
        product: p.product,
        costPrice: parseFloat(p.costPrice),
        quantity: parseFloat(p.quantity),
        amount: p.amount,
        vat: parseFloat(p.vat),
        totalAmount: p.totalAmount
      }));

      const ppoValue = calculatePPOTotal();

      const url = isEditMode ? `/api/ppos/${editingPpoId}` : '/api/ppos';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await apiFetch<{
        success: boolean;
        ppo?: any;
        message?: string;
      }>(url, {
        method,
        body: JSON.stringify({
          billNo,
          date,
          vendor,
          particulars: mappedParticulars,
          notes,
          rfv: rfv ? parseFloat(rfv) : 0,
          ppoValue
        }),
      });

      if (!res.success) throw new Error(res.message || `Failed to ${isEditMode ? 'update' : 'create'} PPO`);

      toast.success(res.message || `PPO ${isEditMode ? 'updated' : 'created'} successfully`);
      
      // Reset form
      setBillNo('');
      setDate('');
      setVendor('');
      setNotes('');
      setRfv('');
      setParticulars([{
        id: '1',
        product: '',
        costPrice: '',
        quantity: '',
        amount: 0,
        vat: '',
        totalAmount: 0,
        rfv: ''
      }]);
      setShowAddForm(false);
      setIsEditMode(false);
      setEditingPpoId(null);
      
      // Refresh PPOs list
      await fetchPpos();
    } catch (e: any) {
      const msg = e?.message || `Failed to ${isEditMode ? 'update' : 'create'} PPO`;
      console.error(`${isEditMode ? 'Update' : 'Create'} PPO error:`, e);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="mb-2">{isEditMode ? 'Edit Pre-Purchase Order' : 'Add Pre-Purchase Order'}</h1>
            <p className="text-gray-600">{isEditMode ? 'Update the pre-purchase order details' : 'Create a new pre-purchase order'}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(false);
              setIsEditMode(false);
              setEditingPpoId(null);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>PPO Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billNo">Bill No *</Label>
                  <Input
                    id="billNo"
                    value={billNo}
                    onChange={(e) => setBillNo(e.target.value)}
                    placeholder="Enter bill number"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={vendor} onValueChange={setVendor}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v) => (
                        <SelectItem key={v._id} value={v._id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter notes (optional)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rfv">RFV (Round Figure Value)</Label>
                <Input
                  id="rfv"
                  type="number"
                  value={rfv}
                  disabled
                  className="bg-gray-50"
                  placeholder="Auto-calculated"
                />
              </div>

              {/* Particulars Table */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label>Particulars</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParticular}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Particular
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Product *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Cost Price (<span className="dirham-symbol">&#xea;</span>) *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Quantity *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Amount (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">VAT % *</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Total Amount (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">RFV (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {particulars.map((particular) => (
                        <tr key={particular.id} className="border-t">
                          <td className="py-3 px-4">
                            <Select
                              value={particular.product}
                              onValueChange={(value: string) => handleParticularChange(particular.id, 'product', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product._id} value={product._id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.costPrice}
                              onChange={(e) => handleParticularChange(particular.id, 'costPrice', e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.quantity}
                              onChange={(e) => handleParticularChange(particular.id, 'quantity', e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={particular.amount.toFixed(2)}
                              disabled
                              className="bg-gray-50"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.vat}
                              onChange={(e) => handleParticularChange(particular.id, 'vat', e.target.value)}
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.01"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              value={particular.totalAmount.toFixed(2)}
                              disabled
                              className="bg-gray-50 font-semibold"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={particular.rfv || ''}
                              disabled
                              className="bg-gray-50"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveParticular(particular.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              disabled={particulars.length === 1}
                            >
                              <Trash2 className={`w-4 h-4 ${particulars.length === 1 ? 'text-gray-300' : 'text-red-600'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="mt-4 flex justify-end">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-700">Total PPO Value:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        <span className="dirham-symbol mr-2">&#xea;</span>{calculatePPOTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update PPO' : 'Save PPO')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
        {/* Toast Notifications (ensure toasts show while add form is open) */}
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
          theme="light"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="mb-2">Pre-Purchase Orders</h1>
          <p className="text-gray-600">Manage all pre-purchase orders</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Pre-Purchase Order
        </Button>
      </div>

      {/* PPO List Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pre-Purchase Orders ({ppos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">PPO ID</th>
                  <th className="text-left py-3 px-4">Vendor</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">No. of Particulars</th>
                  <th className="text-left py-3 px-4">PPO Value</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pposLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">Loading PPOs...</td></tr>
                ) : pposError ? (
                  <tr><td colSpan={6} className="py-8 text-center text-red-600">{pposError}</td></tr>
                ) : ppos.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No PPOs found</td></tr>
                ) : (
                  ppos.map((ppo) => (
                    <tr key={ppo._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-blue-600">{ppo.billNo}</td>
                      <td className="py-3 px-4">{ppo.vendor?.name || '—'}</td>
                      <td className="py-3 px-4">{new Date(ppo.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">{ppo.particulars?.length || 0}</td>
                      <td className="py-3 px-4 font-light"><span className="dirham-symbol mr-2">&#xea;</span>{ppo.ppoValue.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="View"
                          onClick={() => handleViewPpo(ppo._id)}
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Edit"
                          onClick={() => handleEditPpo(ppo._id)}
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Delete"
                          onClick={() => {
                            setPpoToDelete(ppo._id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-gray-100 rounded" 
                          title="Download"
                          onClick={() => handleDownloadPpo(ppo._id)}
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
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

      {/* View PPO Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[1400px] w-full max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pre-Purchase Order Details</DialogTitle>
          </DialogHeader>
          {isLoadingViewPpo ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedPpo ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Bill No</Label>
                  <p className="font-semibold">{selectedPpo.billNo}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Date</Label>
                  <p className="font-semibold">{selectedPpo.formattedDate || new Date(selectedPpo.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vendor Name</Label>
                  <p className="font-semibold">{selectedPpo.vendor?.name || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Company Name</Label>
                  <p className="font-semibold">{selectedPpo.vendor?.companyName || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vendor Email</Label>
                  <p className="font-semibold">{selectedPpo.vendor?.email || '—'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Vendor Phone</Label>
                  <p className="font-semibold">{selectedPpo.vendor?.phone || '—'}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedPpo.notes && (
                <div>
                  <Label className="text-gray-600">Notes</Label>
                  <p className="font-semibold">{selectedPpo.notes}</p>
                </div>
              )}

              {/* RFV */}
              {selectedPpo.rfv && (
                <div>
                  <Label className="text-gray-600">RFV (Round Figure Value)</Label>
                  <p className="font-semibold"><span className="dirham-symbol mr-1">&#xea;</span>{parseFloat(selectedPpo.rfv).toFixed(2)}</p>
                </div>
              )}

              {/* Particulars */}
              <div>
                <Label className="text-gray-600 text-lg font-semibold mb-3 block">Particulars</Label>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold">Product</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">Cost Price (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">Quantity</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">Amount (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">VAT %</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">Total Amount (<span className="dirham-symbol">&#xea;</span>)</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold">RFV (<span className="dirham-symbol">&#xea;</span>)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPpo.particulars?.map((particular: any, index: number) => (
                        <tr key={particular._id || index} className="border-t">
                          <td className="py-3 px-6">{particular.product?.name || '—'}</td>
                          <td className="py-3 px-6"><span className="dirham-symbol mr-2" >&#xea;</span>{particular.costPrice.toFixed(2)}</td>
                          <td className="py-3 px-6">{particular.quantity}</td>
                          <td className="py-3 px-6"><span className="dirham-symbol mr-2">&#xea;</span>{particular.amount.toFixed(2)}</td>
                          <td className="py-3 px-6">{particular.vat}%</td>
                          <td className="py-3 px-6 font-semibold"><span className="dirham-symbol mr-2">&#xea;</span>{particular.totalAmount.toFixed(2)}</td>
                          <td className="py-3 px-6">{particular.rfv ? <><span className="dirham-symbol mr-2">&#xea;</span>{parseFloat(particular.rfv).toFixed(2)}</> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700">Total PPO Value:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      <span className="dirham-symbol">&#xea;</span>{selectedPpo.ppoValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Pre-Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">Are you sure you want to delete this pre-purchase order? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setPpoToDelete(null);
              }}
              disabled={isDeletingPpo}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeletePpo}
              disabled={isDeletingPpo}
            >
              {isDeletingPpo ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
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
        theme="light"
      />
    </div>
  );
}
