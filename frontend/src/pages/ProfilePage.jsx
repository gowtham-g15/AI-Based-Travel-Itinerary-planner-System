import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';
import { 
  MapPinIcon,
  PencilIcon,
  UserCircleIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  PaperAirplaneIcon,
  StarIcon,
  HeartIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProfileData();
    fetchActivities();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await profileAPI.getProfile();
      if (response.success) {
        setProfileData(response.data.user);
        setEditFormData({
          name: response.data.user.name,
          email: response.data.user.email
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await profileAPI.getActivity();
      if (response.success) {
        setActivities(response.data.activities);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const response = await profileAPI.updateProfile(editFormData.name, editFormData.email);
      
      if (response.success) {
        setProfileData(response.data.user);
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({
      name: profileData?.name || user?.name || '',
      email: profileData?.email || user?.email || ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const displayName = profileData?.name || user?.name || 'Guest User';
  const displayEmail = profileData?.email || user?.email || 'Not provided';
  const stats = profileData?.profileStats || {
    tripsPlanned: 0,
    countriesVisited: 0,
    daysTraveled: 0,
    citiesVisited: 0
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <Link to="/home" className="flex items-center group">
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
                to="/home"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/profile"
                className="text-amber-600 border-b-2 border-amber-600 font-medium transition-colors"
              >
                Profile
              </Link>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-gray-700 font-medium">{user?.name || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="hidden sm:block text-gray-600 hover:text-red-600 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Logout
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-3">
              <Link to="/home" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
                Home
              </Link>
              <Link to="/profile" className="block text-amber-600 font-medium py-2">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block text-red-600 hover:text-red-700 font-medium py-2 w-full text-left"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-28 overflow-hidden">
        {/* Warm Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200" />
        
        {/* Decorative Clouds */}
        <div className="absolute top-10 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl" />
        <div className="absolute top-20 right-20 w-48 h-20 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-1/4 w-40 h-16 bg-white/25 rounded-full blur-xl" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
              My Profile<br />
              <span className="relative">
                Travel Dashboard
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                  <path d="M2 10C80 4 160 2 200 2C240 2 320 4 398 10" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Manage your travel adventures and explore your journey statistics
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 h-32"></div>
            <div className="px-8 pb-8">
              <div className="flex items-center -mt-16 mb-6">
                <div className="bg-white rounded-full p-3 shadow-xl">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-black text-3xl">
                      {displayName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-6 mt-12">
                  <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-600 flex items-center mt-1">
                    <StarIcon className="h-4 w-4 text-amber-500 mr-1" />
                    Travel Enthusiast
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{stats.tripsPlanned}</p>
                    <p className="text-sm text-gray-600">Trips</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.countriesVisited}</p>
                    <p className="text-sm text-gray-600">Countries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.daysTraveled}</p>
                    <p className="text-sm text-gray-600">Days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mr-4">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <p className="text-gray-600">Your personal details</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-gray-500 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="text-gray-900 font-bold text-lg">{displayName}</p>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-gray-500 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900"
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className="text-gray-900 font-bold text-lg">{displayEmail}</p>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-gray-500 mb-2">Member Since</label>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-amber-500 mr-2" />
                  <p className="text-gray-900 font-bold text-lg">
                    {profileData?.joinedDate ? new Date(profileData.joinedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'Today'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="block text-sm font-semibold text-gray-500 mb-2">Account Status</label>
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              {isEditing ? (
                <div className="flex gap-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center text-green-600 hover:text-green-700 font-semibold bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-all"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center text-gray-600 hover:text-gray-700 font-semibold bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition-all"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditProfile}
                  className="flex items-center text-amber-600 hover:text-amber-700 font-semibold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-all"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Travel Statistics */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mr-4">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Travel Statistics</h2>
                <p className="text-gray-600">Your adventure metrics</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-200">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-black text-amber-600">{stats.tripsPlanned}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Trips Planned</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GlobeAltIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-black text-blue-600">{stats.countriesVisited}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Countries</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 text-center border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-black text-purple-600">{stats.citiesVisited}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Cities</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 text-center border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <p className="text-3xl font-black text-green-600">{stats.daysTraveled}</p>
                <p className="text-sm font-semibold text-gray-700 mt-1">Days Traveled</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mr-4">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-600">Your latest travel adventures</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {activities.length > 0 ? activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                  <div className="flex items-center">
                    <div className="bg-amber-500 rounded-full p-2 mr-4">
                      {activity.type === 'itinerary' ? (
                        <MapPinIcon className="h-4 w-4 text-white" />
                      ) : activity.type === 'trip' ? (
                        <PhotoIcon className="h-4 w-4 text-white" />
                      ) : (
                        <HeartIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-red-500/30 transition-all flex items-center justify-center"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout from TravelPlanner
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
