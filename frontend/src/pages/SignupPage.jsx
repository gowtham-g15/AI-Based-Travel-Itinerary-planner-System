import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PaperAirplaneIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, Bars3Icon, XMarkIcon, SparklesIcon, StarIcon, HeartIcon } from '@heroicons/react/24/outline';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await signup(formData.name, formData.email, formData.password);
      if (result.success) {
        navigate('/home');
      } else {
        setError(result.message || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2 transform group-hover:scale-105 transition-transform duration-200">
                  <PaperAirplaneIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-bold text-gray-900">
                TravelPlanner
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="text-amber-600 border-b-2 border-amber-600 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <Link to="/login" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
                Login
              </Link>
              <Link to="/signup" className="block text-amber-600 font-medium py-2">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-md mx-auto">
          {/* Signup Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-600">Start planning your perfect trips today</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 flex items-center">
                <HeartIcon className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500 pr-12"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500 pr-12"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <input type="checkbox" required className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to{' '}
                  <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/" className="text-amber-600 hover:text-amber-700 font-medium">Privacy Policy</Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Create Account
                    <StarIcon className="h-5 w-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-600 hover:text-amber-700 font-bold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center">
              <StarIcon className="h-5 w-5 text-amber-500 mr-2" />
              Free forever
            </span>
            <span className="flex items-center">
              <HeartIcon className="h-5 w-5 text-red-500 mr-2" />
              No credit card
            </span>
            <span className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
              Secure signup
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
