import { Link } from 'react-router-dom';
import { 
  ArrowRightIcon, 
  MapPinIcon, 
  SparklesIcon,
  ShareIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  StarIcon,
  HeartIcon,
  PhotoIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  GlobeAltIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}>
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
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                How it Works
              </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/login"
                className="hidden sm:block text-gray-600 hover:text-gray-900 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-gray-900 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all hover:shadow-lg"
              >
                Get started
              </Link>
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
              <button 
                onClick={() => scrollToSection('features')}
                className="block text-gray-600 hover:text-gray-900 font-medium py-2 w-full text-left"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="block text-gray-600 hover:text-gray-900 font-medium py-2 w-full text-left"
              >
                How it Works
              </button>
              <Link to="/login" className="block text-gray-600 hover:text-gray-900 font-medium py-2 sm:hidden">
                Log in
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-20 sm:pt-24 lg:pt-28 overflow-hidden">
        {/* Warm Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-orange-300 to-amber-400" />
        
        {/* Decorative Clouds */}
        <div className="absolute top-20 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl" />
        <div className="absolute top-40 right-20 w-48 h-20 bg-white/30 rounded-full blur-2xl" />
        <div className="absolute bottom-40 left-1/4 w-40 h-16 bg-white/25 rounded-full blur-xl" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6">
                Travel<br />
                <span className="relative">
                  Smarter
                  <svg className="absolute -bottom-2 sm:-bottom-3 left-0 w-full" viewBox="0 0 400 12" fill="none">
                    <path d="M2 10C80 4 160 2 200 2C240 2 320 4 398 10" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </span>
                .
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                AI-powered travel planning that brings India to you. Create personalized itineraries for Delhi, Mumbai, Bangalore and more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center bg-gray-900 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/20"
                >
                  Start planning
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-gray-600">
                <span className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                  Free forever
                </span>
                <span className="flex items-center">
                  <StarIcon className="h-5 w-5 text-amber-500 mr-2" />
                  50K+ happy travelers
                </span>
              </div>
            </div>

            {/* Right Content - Visual Cards */}
            <div className="relative hidden lg:block">
              {/* Main Image Card */}
              <div className="relative">
                {/* Decorative Arch Frame with India Gate */}
                <div className="absolute -top-4 right-0 w-72 h-96 bg-gradient-to-b from-blue-900 to-blue-800 rounded-t-full overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=600&fit=crop" 
                    alt="India Gate"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Floating Card 1 - Profile */}
                <div className="absolute top-10 -left-8 bg-white rounded-2xl shadow-xl p-4 animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">JD</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Trip to Kerala</p>
                      <p className="text-xs text-gray-500">Planning in progress...</p>
                    </div>
                  </div>
                </div>

                {/* Floating Card 2 - Likes */}
                <div className="absolute top-40 -right-4 bg-white rounded-2xl shadow-xl p-3 animate-bounce" style={{animationDuration: '3.5s', animationDelay: '0.5s'}}>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <HeartIcon className="h-4 w-4 text-red-500" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">2.4k likes</span>
                  </div>
                </div>

                {/* Floating Card 3 - Itinerary */}
                <div className="absolute bottom-20 -left-4 bg-white rounded-2xl shadow-xl p-4 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <MapPinIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">5 Days in Delhi</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
                        Ready to explore
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 4 - Rating */}
                <div className="absolute bottom-40 right-0 bg-white rounded-2xl shadow-xl p-3 animate-bounce" style={{animationDuration: '3.2s', animationDelay: '0.8s'}}>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => (
                        <StarIcon key={star} className="h-4 w-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Visual */}
            <div className="lg:hidden flex justify-center">
              <div className="relative w-64 h-80">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-800 rounded-t-full overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                {/* Mobile Floating Cards */}
                <div className="absolute -top-2 -left-4 bg-white rounded-xl shadow-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">JD</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Paris Trip</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-20 -right-4 bg-white rounded-xl shadow-lg p-2">
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-semibold">2.4k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden sm:block">
          <div className="w-6 h-10 border-2 border-gray-900/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-900/50 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold mb-4">
              Simple & Fast
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Plan in 3 easy steps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From dream to destination in minutes, not hours
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: MapPinIcon,
                title: 'Tell us where',
                desc: 'Enter your destination and travel dates. Add preferences for activities, budget, and travel style.',
                color: 'from-amber-400 to-orange-500'
              },
              {
                step: '02',
                icon: SparklesIcon,
                title: 'AI magic happens',
                desc: 'Our AI analyzes millions of options to create your perfect personalized itinerary.',
                color: 'from-purple-500 to-pink-500'
              },
              {
                step: '03',
                icon: ShareIcon,
                title: 'Go explore',
                desc: 'Export your plan, share with friends, and embark on your adventure with confidence.',
                color: 'from-emerald-400 to-teal-500'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="bg-gray-50 rounded-3xl p-8 h-full hover:bg-amber-50/50 transition-colors duration-300">
                  <div className="text-6xl font-black text-gray-200 mb-4">{item.step}</div>
                  <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold mb-4">
              Powerful Features
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Packed with tools to make travel planning effortless
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: SparklesIcon, title: 'AI Planning', desc: 'Smart recommendations tailored to you' },
              { icon: CurrencyDollarIcon, title: 'Budget Smart', desc: 'Track costs and stay on budget' },
              { icon: CalendarIcon, title: 'Day-by-Day', desc: 'Detailed schedules with perfect timing' },
              { icon: GlobeAltIcon, title: 'Global Maps', desc: 'Interactive maps with POIs marked' },
              { icon: UsersIcon, title: 'Collaborate', desc: 'Plan trips together with friends' },
              { icon: PhotoIcon, title: 'Travel Journal', desc: 'Document your adventures' },
            ].map((feature, idx) => (
              <div key={idx} className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-amber-200">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready for your next adventure?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of travelers who plan smarter with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center bg-amber-500 text-gray-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-400 transition-all hover:shadow-xl hover:shadow-amber-500/30"
            >
              Start planning free
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-all"
            >
              Sign in
            </Link>
          </div>
          
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <span className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              No credit card required
            </span>
            <span className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Cancel anytime
            </span>
            <span className="flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              Unlimited trips
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link to="/" className="flex items-center mb-4">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-2">
                  <PaperAirplaneIcon className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">TravelPlanner</span>
              </Link>
              <p className="text-gray-600 text-sm leading-relaxed">
                AI-powered travel planning for modern explorers.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Features</Link></li>
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">About</Link></li>
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</Link></li>
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy</Link></li>
                <li><Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 TravelPlanner. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/login" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Log in</Link>
              <Link to="/signup" className="text-gray-500 hover:text-gray-900 text-sm transition-colors">Sign up</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
