import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation
  const isPasswordValid = (password: string): boolean => {
    return password.length >= 8;
  };

  const passwordsMatch = newPassword === confirmPassword;
  const isFormValid = isPasswordValid(newPassword) && passwordsMatch && newPassword !== '';

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError('Email not found. Please start from the beginning.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Password reset failed';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success(data.message || 'Password reset successful!');
        // Redirect to login after 1.5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        const msg = data.message || 'Password reset failed';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-blue-600 mb-2">Fisho Admin Panel</h1>
          <p className="text-gray-600">Create a new password</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="mb-6">Reset Password</h2>

          {error && (
            <div className="text-red-600 text-sm text-center mb-4">{error}</div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10 pr-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10 cursor-pointer disabled:opacity-50"
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {newPassword && !isPasswordValid(newPassword) && (
                <p className="text-red-500 text-xs mt-1">Password must be at least 8 characters</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="pl-10 pr-12"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10 cursor-pointer disabled:opacity-50"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isFormValid || loading}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {loading ? 'Resetting Password...' : 'Save Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
