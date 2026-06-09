import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { itineraryAPI } from '../services/api';
import { 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  HeartIcon,
  CameraIcon,
  ShoppingBagIcon,
  CakeIcon,
  MusicalNoteIcon,
  BookOpenIcon,
  DocumentArrowDownIcon,
  ArrowRightIcon,
  SparklesIcon,
  GlobeAltIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  PaperAirplaneIcon,
  StarIcon,
  HomeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    numberOfTravelers: '1',
    budget: '',
    accommodation: 'hotel',
    interests: []
  });
  
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const interestOptions = [
    { id: 'nature', label: 'Nature', icon: HeartIcon },
    { id: 'temples', label: 'Temples', icon: BookOpenIcon },
    { id: 'adventure', label: 'Adventure', icon: CameraIcon },
    { id: 'shopping', label: 'Shopping', icon: ShoppingBagIcon },
    { id: 'food', label: 'Food & Dining', icon: CakeIcon },
    { id: 'music', label: 'Music & Nightlife', icon: MusicalNoteIcon }
  ];

  const handleInterestToggle = (interestId) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadItinerary = () => {
    if (!itinerary) return;
    
    // Import jsPDF dynamically
    import('jspdf').then((jsPDFModule) => {
      const { jsPDF } = jsPDFModule;
      const doc = new jsPDF();
      
      // Set font to a standard font for better compatibility
      doc.setFont('helvetica');
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TRAVEL ITINERARY', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let yPosition = 35;
      
      // Trip Overview
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Trip Overview', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Destination: ${itinerary.preferences?.destination || 'Coimbatore'}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Duration: ${itinerary.trip_duration} Days`, 20, yPosition);
      yPosition += 7;
      doc.text(`Budget: ${itinerary.budget?.currency}${itinerary.budget?.total} (${itinerary.budget?.currency}${itinerary.budget?.daily}/day)`, 20, yPosition);
      yPosition += 15;
      
      // Daily Plans
      itinerary.daily_plans?.forEach((day) => {
        // Check if we need a new page
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Day header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`DAY ${day.day}`, 20, yPosition);
        yPosition += 10;
        
        // Places
        if (day.places && day.places.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Places to Visit:', 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          day.places.forEach((place, index) => {
            if (yPosition > 260) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.text(`${index + 1}. ${place.name} (${place.category})`, 25, yPosition);
            yPosition += 6;
            doc.text(`   Location: ${place.area}`, 25, yPosition);
            yPosition += 5;
            doc.text(`   Duration: ${place.visit_duration || place.duration || '1-2 hours'}`, 25, yPosition);
            yPosition += 5;
            if (place.bestTimeToVisit) {
              doc.text(`   Best Time: ${place.bestTimeToVisit}`, 25, yPosition);
              yPosition += 5;
            }
            doc.text(`   Rating: ${place.rating}`, 25, yPosition);
            yPosition += 5;
            if (place.entryFee && place.entryFee !== 'Free') {
              doc.text(`   Entry Fee: ${place.entryFee}`, 25, yPosition);
              yPosition += 5;
            }
            yPosition += 5;
          });
        }
        
        // Restaurants
        if (day.restaurants) {
          yPosition += 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Dining Options:', 20, yPosition);
          yPosition += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
            const restaurants = day.restaurants[mealType];
            if (restaurants && restaurants.length > 0) {
              if (yPosition > 260) {
                doc.addPage();
                yPosition = 20;
              }
              
              doc.setFont('helvetica', 'bold');
              doc.text(`   ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:`, 25, yPosition);
              yPosition += 6;
              
              doc.setFont('helvetica', 'normal');
              restaurants.forEach((restaurant) => {
                if (yPosition > 260) {
                  doc.addPage();
                  yPosition = 20;
                }
                
                doc.text(`   - ${restaurant.name} (${restaurant.cuisine || 'Food'})`, 30, yPosition);
                yPosition += 5;
                doc.text(`     Location: ${restaurant.area}`, 30, yPosition);
                yPosition += 5;
                doc.text(`     Rating: ${restaurant.rating}`, 30, yPosition);
                yPosition += 7;
              });
            }
          });
        }
        
        yPosition += 10;
      });
      
      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
      }
      
      // Save PDF
      const fileName = `travel-itinerary-${itinerary.preferences?.destination || 'coimbatore'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      // Show success message
      alert('PDF downloaded successfully!');
    }).catch((error) => {
      console.error('Error loading jsPDF:', error);
      alert('Error generating PDF. Downloading as text file instead.');
      // Fallback to text download if jsPDF fails
      downloadAsText();
    });
  };
  
  const downloadAsText = () => {
    // Original text download as fallback
    let content = `TRAVEL ITINERARY\n`;
    content += `==================\n\n`;
    content += `Destination: ${itinerary.preferences?.destination || 'Coimbatore'}\n`;
    content += `Duration: ${itinerary.trip_duration} Days\n`;
    content += `Budget: ${itinerary.budget?.currency}${itinerary.budget?.total} (${itinerary.budget?.currency}${itinerary.budget?.daily}/day)\n\n`;
    
    content += `DAILY PLANS\n`;
    content += `------------\n\n`;
    
    itinerary.daily_plans?.forEach((day) => {
      content += `DAY ${day.day}\n`;
      content += `${'='.repeat(20)}\n\n`;
      
      if (day.places && day.places.length > 0) {
        content += `Places to Visit:\n`;
        day.places.forEach((place, index) => {
          content += `${index + 1}. ${place.name} (${place.category})\n`;
          content += `   📍 ${place.area}\n`;
          content += `   ⏱️ ${place.visit_duration || place.duration || '1-2 hours'}\n`;
          if (place.bestTimeToVisit) {
            content += `   🕐 Best Time: ${place.bestTimeToVisit}\n`;
          }
          content += `   ⭐ Rating: ${place.rating}\n`;
          if (place.entryFee && place.entryFee !== 'Free') {
            content += `   💰 Entry Fee: ${place.entryFee}\n`;
          }
          content += `\n`;
        });
      }
      
      if (day.restaurants) {
        content += `Dining Options:\n`;
        
        ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
          const restaurants = day.restaurants[mealType];
          if (restaurants && restaurants.length > 0) {
            content += `   ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:\n`;
            restaurants.forEach((restaurant) => {
              content += `   • ${restaurant.name} (${restaurant.cuisine || 'Food'})\n`;
              content += `     📍 ${restaurant.area}\n`;
              content += `     ⭐ Rating: ${restaurant.rating}\n`;
            });
          }
        });
        content += `\n`;
      }
      
      content += `${'-'.repeat(40)}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-itinerary-${itinerary.preferences?.destination || 'coimbatore'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateItinerary = async (e) => {
    e.preventDefault();
    
    if (!formData.destination || !formData.startDate || !formData.endDate || !formData.numberOfTravelers || !formData.budget) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseInt(formData.budget) < 1000) {
      alert('Minimum budget should be ₹1000');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await itineraryAPI.generate(formData);
      
      if (response.success) {
        setItinerary(response.data.tripPlan);
      } else {
        alert(response.message || 'Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Generate itinerary error:', error);
      alert('Failed to generate itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const regeneratePlan = () => {
    generateItinerary(new Event('submit'));
  };

  const deleteTrip = async (tripId) => {
    try {
      const response = await itineraryAPI.deleteItinerary(tripId);
      
      if (response.success) {
        alert('Itinerary deleted successfully!');
        setItinerary(null); // Clear current itinerary
      } else {
        alert(response.message || 'Failed to delete itinerary');
      }
    } catch (error) {
      console.error('Delete itinerary error:', error);
      alert('Failed to delete itinerary. Please try again.');
    }
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
                className="text-amber-600 border-b-2 border-amber-600 font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                to="/profile"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
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
              <Link to="/home" className="block text-amber-600 font-medium py-2">
                Home
              </Link>
              <Link to="/profile" className="block text-gray-600 hover:text-gray-900 font-medium py-2">
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
              Welcome back,<br />
              <span className="relative">
                {user?.name || 'Traveler'}!
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                  <path d="M2 10C80 4 160 2 200 2C240 2 320 4 398 10" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Ready for your next adventure? Let's create an amazing travel plan tailored just for you.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Travel Planning Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Plan Your Trip</h2>
                <p className="text-gray-600">AI-powered personalized itineraries</p>
              </div>
            </div>
            
            <form onSubmit={generateItinerary} className="space-y-6">
              <div>
                <label htmlFor="destination" className="block text-sm font-semibold text-gray-700 mb-2">
                  Destination (City)
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                    placeholder="Delhi, Mumbai, Bangalore..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="numberOfTravelers" className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Travelers
                </label>
                <div className="relative">
                  <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="numberOfTravelers"
                    name="numberOfTravelers"
                    value={formData.numberOfTravelers}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-semibold text-gray-700 mb-2">
                  What's your budget? (₹)
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    min="1000"
                    max="500000"
                    step="100"
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder-gray-500"
                    placeholder="Enter amount in rupees"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="accommodation" className="block text-sm font-semibold text-gray-700 mb-2">
                  Accommodation Preference
                </label>
                <div className="relative">
                  <HomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="accommodation"
                    name="accommodation"
                    value={formData.accommodation}
                    onChange={handleChange}
                    className="block w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 appearance-none"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="hostel">Hostel</option>
                    <option value="resort">Resort</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  What interests you?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {interestOptions.map((interest) => {
                    const Icon = interest.icon;
                    return (
                      <label
                        key={interest.id}
                        className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all ${
                          formData.interests.includes(interest.id)
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } border`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest.id)}
                          onChange={() => handleInterestToggle(interest.id)}
                          className="sr-only"
                        />
                        <Icon className="h-5 w-5 mr-2 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">{interest.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating your magic...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Generate My Itinerary
                      <ArrowRightIcon className="h-5 w-5 ml-2" />
                    </>
                  )}
                </button>
                {itinerary && (
                  <button
                    onClick={regeneratePlan}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all flex items-center justify-center"
                  >
                    <ArrowRightIcon className="h-5 w-5 mr-2" />
                    Regenerate Plan
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Itinerary Display */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mr-4">
                <GlobeAltIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Itinerary</h2>
                <p className="text-gray-600">Personalized travel plan</p>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PaperAirplaneIcon className="h-6 w-6 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Crafting your perfect journey...</p>
              </div>
            ) : itinerary ? (
              <div className="space-y-6">
                {/* Trip Overview Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-1 rounded-3xl">
                  <div className="bg-white rounded-3xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <GlobeAltIcon className="h-6 w-6 text-amber-500 mr-2" />
                          <h3 className="text-2xl font-black text-gray-900">{itinerary.preferences?.destination || 'Coimbatore'}</h3>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1 text-amber-500" />
                            {itinerary.trip_duration} Days
                          </span>
                          <span className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1 text-green-500" />
                            {itinerary.budget?.currency}{itinerary.budget?.total || 'Medium'}
                          </span>
                          <span className="flex items-center">
                            <UsersIcon className="h-4 w-4 mr-1 text-blue-500" />
                            {formData.numberOfTravelers || 1} {formData.numberOfTravelers > 1 ? 'Travelers' : 'Traveler'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end mb-1">
                          {[1,2,3,4,5].map((star) => (
                            <StarIcon key={star} className="h-5 w-5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">AI Generated</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-2xl text-center">
                        <MapPinIcon className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Places</p>
                        <p className="text-sm font-bold text-gray-900">{itinerary.daily_plans?.reduce((acc, day) => acc + (day.places?.length || 0), 0)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-2xl text-center">
                        <CakeIcon className="h-5 w-5 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Dining</p>
                        <p className="text-sm font-bold text-gray-900">{itinerary.daily_plans?.reduce((acc, day) => acc + (day.restaurants ? Object.keys(day.restaurants).reduce((r, key) => r + (day.restaurants[key]?.length || 0), 0) : 0), 0)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-2xl text-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-600">Daily</p>
                        <p className="text-sm font-bold text-gray-900">{itinerary.budget?.currency}{itinerary.budget?.daily || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {itinerary.daily_plans?.map((day, dayIndex) => (
                    <div key={day.day} className="group">
                      {/* Day Header */}
                      <div className="flex items-center mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                          <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-black text-lg shadow-lg">
                            {day.day}
                          </div>
                        </div>
                        <div className="ml-4">
                          <h4 className="text-xl font-black text-gray-900">Day {day.day}</h4>
                          <p className="text-sm text-gray-500">Your personalized adventure</p>
                        </div>
                      </div>
                      
                      {/* Places Section */}
                      {day.places && day.places.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-2 rounded-xl mr-3">
                              <MapPinIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <h5 className="text-lg font-bold text-gray-900">Places to Visit</h5>
                            <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-semibold">
                              {day.places.length} stops
                            </span>
                          </div>
                          <div className="space-y-3">
                            {day.places.map((place, index) => (
                              <div key={index} className="group/item hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="flex items-center p-4">
                                  <div className="relative mr-4">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-400 rounded-xl blur opacity-20 group-hover/item:opacity-30 transition-opacity" />
                                    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200">
                                      <span className="text-amber-600 font-black text-lg">{index + 1}</span>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h6 className="font-bold text-gray-900 text-lg mb-1">{place.name}</h6>
                                        <div className="flex items-center space-x-3 text-xs">
                                          <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-1 rounded-full font-semibold">
                                            {place.category}
                                          </span>
                                          <span className="flex items-center text-gray-500">
                                            <MapPinIcon className="h-3 w-3 mr-1" />
                                            {place.area}
                                          </span>
                                          <span className="flex items-center text-gray-500">
                                            <ClockIcon className="h-3 w-3 mr-1" />
                                            {place.visit_duration || place.duration || '1-2 hours'}
                                          </span>
                                        </div>
                                        {place.bestTimeToVisit && (
                                          <div className="flex items-center mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                                            <ClockIcon className="h-3 w-3 mr-1" />
                                            Best Time: {place.bestTimeToVisit}
                                          </div>
                                        )}
                                        {place.entryFee && place.entryFee !== 'Free' && (
                                          <div className="flex items-center mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg inline-block">
                                            <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                            Entry: {place.entryFee}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right ml-4">
                                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 px-3 py-2 rounded-xl border border-amber-200">
                                          <div className="flex items-center">
                                            <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400 mr-1" />
                                            <span className="font-black text-amber-600">{place.rating}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Restaurants Section */}
                      {day.restaurants && (day.restaurants.breakfast?.length > 0 || day.restaurants.lunch?.length > 0 || day.restaurants.dinner?.length > 0) && (
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-2 rounded-xl mr-3">
                              <CakeIcon className="h-5 w-5 text-green-600" />
                            </div>
                            <h5 className="text-lg font-bold text-gray-900">Dining Experiences</h5>
                            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-semibold">
                              {Object.keys(day.restaurants).reduce((acc, key) => acc + (day.restaurants[key]?.length || 0), 0)} restaurants
                            </span>
                          </div>
                          <div className="grid gap-4">
                            {/* Breakfast */}
                            {day.restaurants.breakfast?.length > 0 && (
                              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200">
                                <div className="flex items-center mb-3">
                                  <div className="bg-orange-200 text-orange-700 p-2 rounded-xl mr-3">
                                    <span className="text-lg">🌅</span>
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-orange-800">Breakfast</h6>
                                    <p className="text-xs text-orange-600">Start your day right</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {day.restaurants.breakfast.map((restaurant, index) => (
                                    <div key={`breakfast-${index}`} className="bg-white rounded-xl p-3 border border-orange-100 hover:shadow-md transition-shadow">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg p-2 mr-3">
                                            <CakeIcon className="h-4 w-4 text-orange-600" />
                                          </div>
                                          <div>
                                            <h7 className="font-bold text-gray-900">{restaurant.name}</h7>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                                                {restaurant.cuisine || 'Food'}
                                              </span>
                                              <span className="text-xs text-gray-500 flex items-center">
                                                <MapPinIcon className="h-3 w-3 mr-1" />
                                                {restaurant.area}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-100 to-orange-100 px-2 py-1 rounded-lg">
                                          <div className="flex items-center">
                                            <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                                            <span className="font-bold text-amber-600 text-sm">{restaurant.rating}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Lunch */}
                            {day.restaurants.lunch?.length > 0 && (
                              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 border border-yellow-200">
                                <div className="flex items-center mb-3">
                                  <div className="bg-yellow-200 text-yellow-700 p-2 rounded-xl mr-3">
                                    <span className="text-lg">☀️</span>
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-yellow-800">Lunch</h6>
                                    <p className="text-xs text-yellow-600">Midday refuel</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {day.restaurants.lunch.map((restaurant, index) => (
                                    <div key={`lunch-${index}`} className="bg-white rounded-xl p-3 border border-yellow-100 hover:shadow-md transition-shadow">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className="bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg p-2 mr-3">
                                            <CakeIcon className="h-4 w-4 text-yellow-600" />
                                          </div>
                                          <div>
                                            <h7 className="font-bold text-gray-900">{restaurant.name}</h7>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-semibold">
                                                {restaurant.cuisine || 'Food'}
                                              </span>
                                              <span className="text-xs text-gray-500 flex items-center">
                                                <MapPinIcon className="h-3 w-3 mr-1" />
                                                {restaurant.area}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-100 to-yellow-100 px-2 py-1 rounded-lg">
                                          <div className="flex items-center">
                                            <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                                            <span className="font-bold text-amber-600 text-sm">{restaurant.rating}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Dinner */}
                            {day.restaurants.dinner?.length > 0 && (
                              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-200">
                                <div className="flex items-center mb-3">
                                  <div className="bg-indigo-200 text-indigo-700 p-2 rounded-xl mr-3">
                                    <span className="text-lg">🌙</span>
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-indigo-800">Dinner</h6>
                                    <p className="text-xs text-indigo-600">Evening delight</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {day.restaurants.dinner.map((restaurant, index) => (
                                    <div key={`dinner-${index}`} className="bg-white rounded-xl p-3 border border-indigo-100 hover:shadow-md transition-shadow">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg p-2 mr-3">
                                            <CakeIcon className="h-4 w-4 text-indigo-600" />
                                          </div>
                                          <div>
                                            <h7 className="font-bold text-gray-900">{restaurant.name}</h7>
                                            <div className="flex items-center space-x-2 mt-1">
                                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                                                {restaurant.cuisine || 'Food'}
                                              </span>
                                              <span className="text-xs text-gray-500 flex items-center">
                                                <MapPinIcon className="h-3 w-3 mr-1" />
                                                {restaurant.area}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-100 to-indigo-100 px-2 py-1 rounded-lg">
                                          <div className="flex items-center">
                                            <StarIcon className="h-3 w-3 fill-amber-400 text-amber-400 mr-1" />
                                            <span className="font-bold text-amber-600 text-sm">{restaurant.rating}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={downloadItinerary}
                    className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <DocumentArrowDownIcon className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                      Download Itinerary
                    </div>
                  </button>
                  <button 
                    onClick={() => setItinerary(null)}
                    className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center">
                      <XMarkIcon className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Clear Plan
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No itinerary yet</h3>
                <p className="text-gray-600">Fill in the form to generate your personalized travel plan</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
