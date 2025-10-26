import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store.ts';
import { api } from '../api/api.ts';
import { Eye, EyeOff } from 'lucide-react';  

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // ✅ Login - cookie will be set by backend
      const loginResponse = await api.post('/auth/login', formData);

      if (!loginResponse.data || !loginResponse.data.user_id) {
        throw new Error('Login failed: No user data returned');
      }

      console.log('Login successful:', loginResponse.data);

      // ✅ Use user data from login response (if available)
      // OR set a minimal user object and let ProtectedRoute fetch full profile
      login({
        id: loginResponse.data.user_id,
        username: loginResponse.data.user?.username || formData.email.split('@')[0],
        email: formData.email,
        created_at: new Date().toISOString()
      });

      // ✅ Navigate to dashboard - ProtectedRoute will verify auth with cookie
      navigate('/dashboard');

      // ❌ REMOVED: Don't call /auth/profile immediately after login
      // The cookie needs time to be set in the browser
      // ProtectedRoute will handle fetching profile data

    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-yellow-500/20 ring-1 ring-yellow-400/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent tracking-tight">
            Welcome Back
          </h2>
          <p className="text-zinc-400 mt-2 text-sm">Sign in to your account</p>
          <div className="w-16 h-1 bg-gradient-to-r from-yellow-500 to-yellow-400 mx-auto mt-3 rounded-full"></div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-yellow-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-800/70 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                placeholder="Enter your email"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-yellow-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-800/70 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition duration-200"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-400 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-zinc-900 font-semibold rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-zinc-800 border-t-transparent rounded-full animate-spin"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-zinc-400">
          Don't have an account?{' '}
          <button 
            onClick={() => navigate('/signup')}
            className="text-yellow-400 hover:text-yellow-300 font-medium underline underline-offset-4 transition-colors"
          >
            Sign up
          </button>
        </div>
        
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-tr from-yellow-400/10 to-transparent rounded-full blur-lg"></div>
      </div>
    </div>
  );
}

export default Login;
