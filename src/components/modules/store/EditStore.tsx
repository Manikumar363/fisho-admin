import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { apiFetch } from '../../../lib/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MapSection from './MapSection';

interface EditStoreProps {
  storeId: string;
  onBack: () => void;
  onStoreUpdated?: (store: any) => void;
}

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const defaultHours: Record<DayKey, { open: string; close: string; isClosed: boolean }> = {
  monday: { open: '10:00', close: '21:00', isClosed: false },
  tuesday: { open: '10:00', close: '21:00', isClosed: false },
  wednesday: { open: '10:00', close: '21:00', isClosed: false },
  thursday: { open: '10:00', close: '22:00', isClosed: false },
  friday: { open: '10:00', close: '22:00', isClosed: false },
  saturday: { open: '09:00', close: '22:00', isClosed: false },
  sunday: { open: '11:00', close: '19:00', isClosed: false },
};

export default function EditStore({ storeId, onBack, onStoreUpdated }: EditStoreProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [managersLoading, setManagersLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    description: '',
    contactNumber: '',
    managerId: '',
    isActive: true,
    operatingHours: defaultHours,
  });

  const dayEntries = useMemo(() => Object.entries(formData.operatingHours) as [DayKey, { open: string; close: string; isClosed: boolean }][], [formData.operatingHours]);

  // Fetch managers list
  useEffect(() => {
    let active = true;
    const fetchManagers = async () => {
      setManagersLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; subadmins?: any[]; pagination?: any }>(`/api/subadmin/all-subadmins?page=1&limit=100`);
        let list: any[] = [];
        if (res && res.success && Array.isArray(res.subadmins)) {
          list = res.subadmins;
        } else {
          const fallback = await apiFetch<{ success: boolean; users?: any[] }>(`/api/users/`);
          if (fallback && fallback.success && Array.isArray(fallback.users)) list = fallback.users;
        }
        if (!active) return;
        setManagers(list || []);
      } catch (err) {
        console.error('Failed to load managers', err);
        if (!active) return;
        setManagers([]);
      } finally {
        if (active) setManagersLoading(false);
      }
    };
    fetchManagers();
    return () => { active = false; };
  }, []);

  // Fetch store data
  useEffect(() => {
    setLoading(true);
    apiFetch<{ success: boolean; store: any; message?: string }>(`/api/stores/${storeId}`)
      .then((res) => {
        if (!res.success) throw new Error(res.message || 'Failed to fetch store');
        const store = res.store;
        setFormData({
          name: store.name || '',
          address: store.address || '',
          lat: store.lat?.toString() || store.location?.lat?.toString() || '',
          lng: store.lng?.toString() || store.location?.lng?.toString() || '',
          description: store.description || '',
          contactNumber: store.contactNumber || '',
          managerId: store.manager?._id || store.manager?.id || store.manager || '',
          isActive: store.isActive !== false,
          operatingHours: store.operatingHours || defaultHours,
        });
      })
      .catch((err) => {
        const msg = err?.message || 'Failed to load store';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function makeClosedHours() {
    const obj = {} as Record<DayKey, { open: string; close: string; isClosed: boolean }>;
    (Object.keys(defaultHours) as DayKey[]).forEach(d => {
      obj[d] = { open: '', close: '', isClosed: true };
    });
    return obj;
  }

  const handleTimeChange = (day: DayKey, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [field]: value, isClosed: false },
      },
    }));
  };

  const toggleClosed = (day: DayKey) => {
    setFormData(prev => {
      const next = { ...prev.operatingHours } as Record<DayKey, { open: string; close: string; isClosed: boolean }>;
      const curr = next[day];
      const isNow = !curr.isClosed;
      next[day] = { open: isNow ? '' : defaultHours[day].open, close: isNow ? '' : defaultHours[day].close, isClosed: isNow };
      return { ...prev, operatingHours: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.managerId) {
      toast.error('Please fill required fields: name, address, manager');
      return;
    }

    if (!formData.lat || !formData.lng) {
      toast.error('Please select a location so latitude and longitude are set');
      return;
    }

    const latNum = Number(formData.lat);
    const lngNum = Number(formData.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      toast.error('Selected coordinates are invalid');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ success: boolean; store: any; message?: string }>(
        `/api/stores/${storeId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name: formData.name,
            address: formData.address,
            lat: latNum,
            lng: lngNum,
            description: formData.description,
            contactNumber: formData.contactNumber,
            manager: formData.managerId,
            isActive: formData.isActive,
            operatingHours: formData.operatingHours,
          })
        }
      );

      if (!res.success) throw new Error(res.message || 'Failed to update store');
      
      toast.success(res.message || 'Store updated successfully');
      if (onStoreUpdated && res.store) {
        onStoreUpdated(res.store);
      }
      onBack();
    } catch (err: any) {
      const msg = err?.message || 'Failed to update store';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/store-mapping');
    onBack();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-6 text-gray-600">Loading store details...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[calc(100vh-6rem)] overflow-auto">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="mb-2">Edit Store</h1>
          <p className="text-gray-600">Update store details and manager information</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter store name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeDescription">Description</Label>
              <Textarea
                id="storeDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the store"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Store Location</Label>
              <MapSection
                isEditing={true}
                address={formData.address}
                onAddressChange={(addr) => setFormData({ ...formData, address: addr })}
                marker={{
                  lat: formData.lat ? Number(formData.lat) : 25.2048,
                  lng: formData.lng ? Number(formData.lng) : 55.2708,
                }}
                onMarkerChange={(lat, lng) =>
                  setFormData(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }))
                }
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                <div>Latitude: {formData.lat || '—'}</div>
                <div>Longitude: {formData.lng || '—'}</div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-4">Manager Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="managerId">Store Manager</Label>
                  <select
                    id="managerId"
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select manager (ID)</option>
                    {managersLoading && <option disabled>Loading...</option>}
                    {managers.map((m) => (
                      <option key={m._id || m.id} value={m._id || m.id}>
                        {m.name ? `${m.name} — ${m.email || m._id || m.id}` : (m.email || m._id || m.id)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="mb-2">Operating Hours</h3>
              <p className="text-sm text-gray-500">Set open/close times per day. Toggle Closed when the store is closed that day.</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm table-auto">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2 px-3">Day</th>
                      <th className="py-2 px-3">Open</th>
                      <th className="py-2 px-3">Close</th>
                      <th className="py-2 px-3">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(formData.operatingHours) as DayKey[]).map((d) => {
                      const h = formData.operatingHours[d];
                      const dayLabel = capitalize(d);
                      return (
                        <tr key={d} className="border-t">
                          <td className="py-2 px-3 align-middle">{dayLabel}</td>
                          <td className="py-2 px-3">
                            <input 
                              type="time" 
                              value={h.open} 
                              disabled={h.isClosed} 
                              onChange={(e) => handleTimeChange(d, 'open', e.target.value)} 
                              className="w-full border rounded px-2 py-1 text-sm" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="time" 
                              value={h.close} 
                              disabled={h.isClosed} 
                              onChange={(e) => handleTimeChange(d, 'close', e.target.value)} 
                              className="w-full border rounded px-2 py-1 text-sm" 
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input 
                              type="checkbox" 
                              checked={h.isClosed} 
                              onChange={() => toggleClosed(d)} 
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2 mt-3">
                <button 
                  type="button" 
                  className="text-sm px-3 py-1 border rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, operatingHours: defaultHours }))}
                >
                  Auto-fill defaults
                </button>
                <button 
                  type="button" 
                  className="text-sm px-3 py-1 border rounded" 
                  onClick={() => setFormData(prev => ({ ...prev, operatingHours: makeClosedHours() }))}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="storeStatus">Store Status</Label>
                  <p className="text-sm text-gray-500">Set the store as active or inactive</p>
                </div>
                <Switch
                  id="storeStatus"
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
