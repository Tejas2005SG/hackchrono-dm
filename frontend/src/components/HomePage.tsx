import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  AlertTriangle,
  Sparkles,
  Brain,
  BarChart3,
  Activity,
  Rocket,
  MapPin,
  Navigation,
  Target,
  Waves,
  Flame,
  CloudRain,
  Wind,
  Map,
  Menu,
  X,
  ChevronRight,
  Layers,
  Radio
} from 'lucide-react';


function HomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);


  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);


  const features = [
    {
      icon: Layers,
      title: 'Multi-Hazard Prediction',
      description: 'Advanced AI models predict floods, fires, earthquakes, and health crises simultaneously with unprecedented accuracy using real-time sensor data.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Navigation,
      title: 'Dynamic Evacuation Routes',
      description: 'Real-time optimization of evacuation paths based on current hazard spread, traffic conditions, and infrastructure status to maximize safety.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Map,
      title: 'Digital Twin Simulation',
      description: 'High-fidelity 3D city replicas with GIS integration enable real-time disaster scenario modeling and impact assessment before events occur.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Radio,
      title: 'Real-Time Monitoring',
      description: 'Continuous monitoring of environmental sensors, satellite imagery, and IoT devices to detect disaster precursors and provide early warnings.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Brain,
      title: 'AI-Driven Analytics',
      description: 'Machine learning algorithms analyze historical disaster patterns and current conditions to predict severity, impact zones, and optimal response strategies.',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: Activity,
      title: 'Emergency Coordination',
      description: 'Unified command center for first responders with automated resource allocation, task assignment, and inter-agency communication protocols.',
      color: 'from-indigo-500 to-blue-500'
    }
  ];


  const testimonials = [
    {
      name: 'Dr. Sarah Mitchell',
      role: 'Emergency Management Director, Metro City',
      avatar: 'SM',
      content: 'DisasterPredict reduced our emergency response time by 65%. The AI-powered evacuation routing saved countless lives during the recent flood event.',
      rating: 5
    },
    {
      name: 'James Chen',
      role: 'Chief Resilience Officer, Coastal Region',
      avatar: 'JC',
      content: 'The digital twin simulation allowed us to test 50+ disaster scenarios before they happened. We\'re now prepared for events we never imagined.',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      role: 'Fire Department Commander',
      avatar: 'MR',
      content: 'Multi-hazard prediction capabilities gave us 4-hour advance warning for wildfires. The system\'s accuracy is remarkable and constantly improving.',
      rating: 5
    }
  ];


  const hazardTypes = [
    { icon: Waves, name: 'Flooding', color: 'text-blue-400' },
    { icon: Flame, name: 'Wildfires', color: 'text-orange-400' },
    { icon: Wind, name: 'Hurricanes', color: 'text-cyan-400' },
    { icon: AlertTriangle, name: 'Earthquakes', color: 'text-red-400' },
    { icon: CloudRain, name: 'Storms', color: 'text-purple-400' },
    { icon: Activity, name: 'Health Crisis', color: 'text-green-400' }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-zinc-900/80 backdrop-blur-lg border-b border-yellow-500/20 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/25">
                <Shield size={22} className="text-zinc-900" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-yellow-100 to-yellow-200 bg-clip-text text-transparent">
                Rakshak AI
              </span>
            </div>


            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-zinc-300 hover:text-yellow-400 transition-colors">Features</a>
              <a href="#demo" className="text-zinc-300 hover:text-yellow-400 transition-colors">Demo</a>
              <a href="#testimonials" className="text-zinc-300 hover:text-yellow-400 transition-colors">Case Studies</a>
              <a href="#contact" className="text-zinc-300 hover:text-yellow-400 transition-colors">Contact</a>
              <button 
                onClick={() => navigate('/login')}
                className="text-zinc-300 hover:text-yellow-400 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-900 px-6 py-2 rounded-xl font-semibold hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-lg shadow-yellow-500/25"
              >
                Request Access
              </button>
            </div>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-zinc-300 hover:text-yellow-400"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>


        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900/95 backdrop-blur-lg border-t border-zinc-800">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-zinc-300 hover:text-yellow-400 transition-colors">Features</a>
              <a href="#demo" className="block text-zinc-300 hover:text-yellow-400 transition-colors">Demo</a>
              <a href="#testimonials" className="block text-zinc-300 hover:text-yellow-400 transition-colors">Case Studies</a>
              <a href="#contact" className="block text-zinc-300 hover:text-yellow-400 transition-colors">Contact</a>
              <button 
                onClick={() => navigate('/login')}
                className="block w-full text-left text-zinc-300 hover:text-yellow-400 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-900 px-6 py-3 rounded-xl font-semibold hover:from-yellow-400 hover:to-yellow-300 transition-all"
              >
                Request Access
              </button>
            </div>
          </div>
        )}
      </nav>


      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-medium mb-8">
              <Sparkles size={16} className="mr-2" />
              AI-Powered Multi-Hazard Digital Twin Platform
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-200 bg-clip-text text-transparent">
                Predict Disasters
              </span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Save Lives
              </span>
            </h1>
            
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto mb-12">
              Advanced digital twin technology simulates multiple disaster scenarios simultaneously. Predict floods, fires, earthquakes, and health crises with AI-driven precision. Optimize evacuation routes dynamically and coordinate emergency responses in real-time to protect communities.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-2xl shadow-yellow-500/25 flex items-center"
              >
                Request Demo
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a href="#demo" className="group flex items-center text-white hover:text-yellow-400 transition-colors">
                <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mr-3 group-hover:bg-yellow-500/10 transition-colors">
                  <Play size={20} />
                </div>
                Watch Simulation
              </a>
            </div>
          </div>


          {/* Hazard Types Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-20">
            {hazardTypes.map((hazard, index) => (
              <div key={index} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50 hover:border-yellow-500/30 transition-all text-center">
                <hazard.icon size={32} className={`${hazard.color} mx-auto mb-3`} />
                <div className="text-zinc-300 text-sm font-medium">{hazard.name}</div>
              </div>
            ))}
          </div>


          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
            {[
              { number: '92.4%', label: 'Prediction Accuracy' },
              { number: '4.2hrs', label: 'Avg Warning Time' },
              { number: '65%', label: 'Faster Response' },
              { number: '50M+', label: 'Lives Protected' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-yellow-400 mb-2">{stat.number}</div>
                <div className="text-zinc-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Video Demo Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              See DisasterPredict in Action
            </h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              Watch how our digital twin platform simulates real-world disaster scenarios and provides actionable intelligence for emergency management teams
            </p>
          </div>


          {/* Video Container */}
          <div className="relative rounded-3xl overflow-hidden border border-yellow-500/20 shadow-2xl shadow-yellow-500/10">
            <div className="aspect-video bg-zinc-900/50 backdrop-blur-sm">
              {/* Replace with actual video embed */}
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/BaWnRznp1AU?si=GGZ2y21-5GPcpEM3"
                title="DisasterPredict Platform Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>


          {/* Video Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: MapPin,
                title: 'Real-Time Visualization',
                description: 'Live 3D mapping of disaster spread and impact zones'
              },
              {
                icon: Navigation,
                title: 'Smart Routing',
                description: 'AI-optimized evacuation paths updated every second'
              },
              {
                icon: BarChart3,
                title: 'Impact Analytics',
                description: 'Predictive damage assessment and resource needs'
              }
            ].map((item, index) => (
              <div key={index} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50 text-center">
                <item.icon size={32} className="text-yellow-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Advanced Disaster Intelligence
            </h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              Comprehensive multi-hazard prediction and response optimization powered by cutting-edge AI and GIS technology
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 border border-zinc-700/50 hover:border-yellow-500/30 transition-all duration-300 hover:transform hover:scale-105">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-300`}>
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-zinc-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              From data collection to emergency response, our platform operates seamlessly
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Data Collection',
                description: 'Continuous monitoring of sensors, satellites, weather stations, and IoT devices across the city',
                icon: Radio
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Machine learning models process multi-source data to predict disaster likelihood and severity',
                icon: Brain
              },
              {
                step: '03',
                title: 'Simulation',
                description: 'Digital twin runs thousands of scenarios to identify optimal response strategies',
                icon: Layers
              },
              {
                step: '04',
                title: 'Response',
                description: 'Automated alerts, evacuation routing, and resource deployment to emergency teams',
                icon: Navigation
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 border border-zinc-700/50 hover:border-yellow-500/30 transition-all">
                  <div className="text-yellow-400/30 text-5xl font-bold mb-4">{item.step}</div>
                  <item.icon size={32} className="text-yellow-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-300 text-sm leading-relaxed">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight size={24} className="text-yellow-400/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Proven Impact
            </h2>
            <p className="text-xl text-zinc-300">
              Emergency management leaders trust DisasterPredict to protect their communities
            </p>
          </div>


          <div className="relative">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-zinc-700/50">
              <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} className="text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-xl lg:text-2xl text-white font-medium mb-8 leading-relaxed">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full flex items-center justify-center text-zinc-900 font-bold mr-4">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div>
                  <div className="font-semibold text-white">{testimonials[currentTestimonial].name}</div>
                  <div className="text-zinc-400">{testimonials[currentTestimonial].role}</div>
                </div>
              </div>
            </div>


            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-yellow-400' : 'bg-zinc-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Technology Stack Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
              Built on industry-leading frameworks and algorithms for maximum reliability
            </p>
          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Machine Learning',
              'Deep Learning',
              'GIS Mapping',
              'IoT Integration',
              'Real-Time Analytics',
              'Cloud Computing',
              'Predictive Modeling',
              'Satellite Imagery'
            ].map((tech, index) => (
              <div key={index} className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50 hover:border-yellow-500/30 transition-all text-center">
                <div className="text-zinc-300 font-medium">{tech}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-sm rounded-3xl p-12 border border-yellow-500/20">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Protect Your Community Today
            </h2>
            <p className="text-xl text-zinc-300 mb-8">
              Join leading emergency management agencies worldwide using DisasterPredict to save lives and minimize disaster impact. Request a personalized demo for your city.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button 
                onClick={() => navigate('/signup')}
                className="group bg-gradient-to-r from-yellow-500 to-yellow-400 text-zinc-900 px-8 py-4 rounded-2xl font-bold text-lg hover:from-yellow-400 hover:to-yellow-300 transition-all shadow-2xl shadow-yellow-500/25 flex items-center"
              >
                Request Demo
                <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="text-zinc-300 hover:text-yellow-400 transition-colors font-semibold">
                Talk to Emergency Specialist
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-zinc-950/50 border-t border-zinc-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center">
                  <Shield size={22} className="text-zinc-900" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white via-yellow-100 to-yellow-200 bg-clip-text text-transparent">
                  DisasterPredict
                </span>
              </div>
              <p className="text-zinc-400 max-w-md">
                Advanced multi-hazard digital twin platform protecting communities through AI-powered disaster prediction and real-time emergency response optimization.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Technology</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Case Studies</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-zinc-400">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Research</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Partners</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 mt-12 pt-8 text-center text-zinc-400">
            <p>&copy; 2025 DisasterPredict. All rights reserved. Built to save lives.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


export default HomePage;
