import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

export default function OTPVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');
  const otpValue = parseInt(otp.join(''));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email not found. Please go back and try again.');
      return;
    }

    if (!isOtpComplete) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/submit-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'OTP verification failed';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (data.success) {
        toast.success(data.message || 'OTP verified successfully');
        // Navigate to reset password page with email
        navigate('/reset-password', { state: { email } });
      } else {
        const msg = data.message || 'OTP verification failed';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) {
      setError('Email not found. Please go back and try again.');
      return;
    }

    setResendLoading(true);
    setError(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/get-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.message || 'Failed to resend OTP';
        setError(msg);
        toast.error(msg);
        setResendLoading(false);
        return;
      }

      if (data.success) {
        toast.success(data.message || 'OTP resent successfully to your email');
        setOtp(['', '', '', '', '', '']);
        // Focus on first OTP input
        document.getElementById('otp-0')?.focus();
      } else {
        const msg = data.message || 'Failed to resend OTP';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      setError(msg);
      toast.error(msg);
      console.error('Resend OTP error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/forgot-password')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="text-center mb-8">
          <h1 className="text-blue-600 mb-2">Fisho Admin Panel</h1>
          <p className="text-gray-600">Verify your identity</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="mb-2">OTP Verification</h2>
          <p className="text-gray-600 mb-6">
            Enter the 6-digit OTP sent to {email || 'your email'}
          </p>

          {error && (
            <div className="text-red-600 text-sm text-center mb-4">{error}</div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <Label>Enter 6-digit OTP</Label>
              <div className="flex gap-2 mt-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      handleOtpChange(index, e.target.value);
                      setError(null);
                    }}
                    className="text-center p-3 w-full"
                    required
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!isOtpComplete || loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendLoading}
                className="text-blue-600 hover:underline disabled:text-gray-400"
              >
                {resendLoading ? 'Resending OTP...' : 'Resend OTP'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
