// src/components/modules/Profile.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Shield, Calendar, Key, Edit2, Save, X, Upload, Camera, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { getAdminData, getUserRole, getToken, setAdminData as saveAdminData } from '../../lib/api';
import { toast } from 'react-toastify';

interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  location?: string;
  joinDate?: string;
  image?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    role: 'admin',
    location: '',
    joinDate: new Date().toISOString().split('T')[0],
    image: ''
  });
  const [editData, setEditData] = useState<ProfileData>(adminData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();

      if (!token) {
        setError('Authentication token not found. Please login again.');
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/get-profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Failed to fetch profile';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (data.success && data.user) {
        const profileData = data.user;
        const formattedData: ProfileData = {
          id: profileData.id || profileData._id,
          name: profileData.name || 'Admin User',
          email: profileData.email || 'admin@fisho.com',
          phone: profileData.phone || '',
          role: profileData.role || 'admin',
          location: profileData.location || 'Not specified',
          joinDate: profileData.createdAt 
            ? new Date(profileData.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          image: profileData.image || ''
        };
        setAdminData(formattedData);
        setEditData(formattedData);
        setImagePreview(profileData.image || '');
      } else {
        setError('Failed to load profile data');
        toast.error('Failed to load profile data');
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(adminData);
      setImagePreview(adminData.image || '');
      setSelectedImage(null);
    }
    setIsEditing(!isEditing);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsSaving(true);

    try {
      const token = getToken();

      if (!token) {
        toast.error('Please login again');
        navigate('/login');
        return;
      }

      // Create FormData to handle file upload
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('phone', editData.phone || '');
      
      // Append image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/update-profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Failed to update profile';
        toast.error(msg);
        setIsSaving(false);
        return;
      }

      if (data.success) {
        const updatedData: ProfileData = {
          ...adminData,
          name: data.user.name,
          phone: data.user.phone,
          email: data.user.email,
          image: data.user.image || adminData.image
        };
        setAdminData(updatedData);
        setEditData(updatedData);
        setIsEditing(false);
        setSelectedImage(null);
        
        // Update localStorage with new admin data
        saveAdminData(data.user);
        
        toast.success(data.message || 'Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      toast.error(msg);
      console.error('Update profile error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !adminData.name) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500">View and manage your account information</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="mb-4">{error}</p>
              <Button 
                onClick={fetchProfileData}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-500">View and manage your account information</p>
          </div>
        </div>
        {!isEditing && (
          <Button
            onClick={handleEditToggle}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="flex flex-col items-center">
          <CardContent className="p-8 w-full">
            <div className="flex flex-col items-center">
              {/* Profile Image Container with Upload Button */}
              <div className="relative mb-6 w-fit mx-auto">
                {/* Profile Image */}
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-blue-600" />
                  )}
                </div>

                {/* Upload Button - Circle positioned below right */}
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2">
                    <label
                      htmlFor="profile-image-input"
                      aria-label="Upload profile image"
                      className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </label>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                      disabled={isSaving}
                    />
                  </div>
                )}
              </div>

              {/* Name and Badge */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">{adminData.name}</h2>
              <Badge className="capitalize bg-blue-100 text-blue-700 hover:bg-blue-100 mb-4">
                {adminData.role === 'subadmin' ? 'Sub Admin' : 'Admin'}
              </Badge>

              {/* Join Date 
              {adminData.joinDate && (
                <p className="text-gray-500 text-sm text-center">
                  Joined {new Date(adminData.joinDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}*/}
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-600">Full Name</Label>
                    <Input
                      value={isEditing ? editData.name : adminData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Email Address</Label>
                    <Input
                      value={adminData.email}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-600">Phone Number</Label>
                    <Input
                      value={isEditing ? editData.phone : (adminData.phone || 'Not specified')}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>
                  {/* <div className="space-y-2"> 
                    <Label className="text-gray-600">Location</Label>
                    <Input
                      value={adminData.location || 'Not specified'}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>*/}
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-10 pt-6 border-t border-gray-200">
                    <Button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handleEditToggle}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500">Update your password to keep your account secure</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/change-password', { state: { email: adminData.email } })}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}