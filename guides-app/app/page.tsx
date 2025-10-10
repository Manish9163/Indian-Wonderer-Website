'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Toast from './components/Toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning' | 'info'} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login for:', email);
      const response = await fetch(`http://localhost/fu/backend/api/guide_login.php?email=${encodeURIComponent(email)}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.guide) {
        // Store guide data in localStorage
        localStorage.setItem('guide', JSON.stringify(data.guide));
        localStorage.setItem('guideStats', JSON.stringify(data.stats));
        console.log('Login successful, redirecting to dashboard');
        
        setToast({
          message: `Welcome back, ${data.guide.first_name}! 👋`,
          type: 'success'
        });
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setError(data.message || 'Login failed. Please check your email.');
        setToast({
          message: data.message || 'Login failed. Please check your email.',
          type: 'error'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Please try again.');
      setToast({
        message: 'Connection error. Please check your internet and try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Guide Portal</h1>
          <p className="text-gray-600">Sign in to manage your tours</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="guide@example.com"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Demo: Use <span className="font-mono bg-gray-100 px-2 py-1 rounded">amit@guides.com</span>
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
