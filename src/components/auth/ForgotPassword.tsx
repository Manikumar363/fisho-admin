import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation
  const isEmailValid = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEmailValid(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/get-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Failed to send OTP';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success(data.message || 'OTP sent successfully to your email');
        // Navigate to OTP verification page and pass email
        navigate('/verify-otp', { state: { email } });
      } else {
        const msg = data.message || 'Failed to send OTP';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('Send OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <h1 className="text-blue-600 mb-2">Fisho Admin Panel</h1>
          <p className="text-gray-600">Reset your password</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="mb-2">Forgot Password</h2>
          <p className="text-gray-600 mb-6">Enter your email to receive an OTP.</p>

          {error && (
            <div className="text-red-600 text-sm text-center mb-4">{error}</div>
          )}

          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fisho.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isEmailValid(email) || loading}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
