import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, MapPin, Loader2, AlertTriangle, Info, Clock, Map } from 'lucide-react';

const Whatif = () => {
  const [location, setLocation] = useState({
    country: '',
    state: '',
    city: '',
    district: '',
    landmark: ''
  });
  
  const [suggestions, setSuggestions] = useState({
    countries: [],
    states: [],
    cities: []
  });
  
  const [showDropdown, setShowDropdown] = useState({
    country: false,
    state: false,
    city: false
  });
  
  const [disasterType, setDisasterType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  const dropdownRef = useRef(null);

  const disasterTypes = [
    'Flood', 'Earthquake', 'Cyclone', 'Drought', 'Landslide',
    'Fire', 'Tsunami', 'Heat Wave', 'Cold Wave', 'Storm'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown({ country: false, state: false, city: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch countries
  const fetchCountries = async (query) => {
    if (query.length < 2) return;
    
    setLoadingLocation(true);
    try {
      const response = await fetch(`https://restcountries.com/v3.1/name/${query}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const countries = data.map(c => ({
          name: c.name.common,
          code: c.cca2
        })).slice(0, 10);
        setSuggestions(prev => ({ ...prev, countries }));
        setShowDropdown(prev => ({ ...prev, country: true }));
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Fetch states for a country
  const fetchStates = async (country) => {
    if (!country) return;
    
    setLoadingLocation(true);
    try {
      const response = await fetch(`https://hackchrono-dm.onrender.com/api/locations/states?country=${encodeURIComponent(country)}`);
      const data = await response.json();
      
      if (data.states) {
        setSuggestions(prev => ({ ...prev, states: data.states }));
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  // Fetch cities for a state
  const fetchCities = async (query, state) => {
    if (query.length < 2 || !state) return;
    
    setLoadingLocation(true);
    try {
      const response = await fetch(`https://hackchrono-dm.onrender.com/api/locations/cities?state=${encodeURIComponent(state)}&query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.cities) {
        setSuggestions(prev => ({ ...prev, cities: data.cities }));
        setShowDropdown(prev => ({ ...prev, city: true }));
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleLocationChange = (field, value) => {
    setLocation(prev => ({ ...prev, [field]: value }));
    
    if (field === 'country' && value.length >= 2) {
      fetchCountries(value);
    } else if (field === 'state' && value.length >= 2) {
      setShowDropdown(prev => ({ ...prev, state: true }));
    } else if (field === 'city' && value.length >= 2) {
      fetchCities(value, location.state);
    }
  };

  const selectCountry = (country) => {
    setLocation(prev => ({ ...prev, country: country.name }));
    setShowDropdown(prev => ({ ...prev, country: false }));
    fetchStates(country.name);
  };

  const selectState = (state) => {
    setLocation(prev => ({ ...prev, state }));
    setShowDropdown(prev => ({ ...prev, state: false }));
  };

  const selectCity = (city) => {
    setLocation(prev => ({ ...prev, city }));
    setShowDropdown(prev => ({ ...prev, city: false }));
  };

  const handleSubmit = async () => {
    if (!location.country || !location.state || !location.city || !disasterType) {
      setError('Please fill in Country, State, City, and Disaster Type');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('https://hackchrono-dm.onrender.com/api/predict-disaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          disasterType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <AlertTriangle className="text-yellow-500" size={40} />
            Disaster "What If" Predictor
          </h1>
          <p className="text-gray-300">AI-powered disaster scenario analysis with real-time location search</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-gray-800 rounded-xl shadow-lg p-6 text-white" ref={dropdownRef}>
            <div className="space-y-4">
              {/* Country Input */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  <MapPin className="inline mr-1" size={16} />
                  Country *
                </label>
                <input
                  type="text"
                  value={location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  placeholder="Start typing country name..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                />
                {showDropdown.country && suggestions.countries.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.countries.map((country, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCountry(country)}
                        className="px-4 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      >
                        {country.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* State Input */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  State/Province *
                </label>
                <input
                  type="text"
                  value={location.state}
                  onChange={(e) => handleLocationChange('state', e.target.value)}
                  placeholder="Start typing state..."
                  disabled={!location.country}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 disabled:bg-gray-800 disabled:text-gray-500"
                />
                {showDropdown.state && suggestions.states.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.states.map((state, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectState(state)}
                        className="px-4 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      >
                        {state}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* City Input */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  placeholder="Start typing city..."
                  disabled={!location.state}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400 disabled:bg-gray-800 disabled:text-gray-500"
                />
                {showDropdown.city && suggestions.cities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.cities.map((city, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCity(city)}
                        className="px-4 py-2 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  District (Optional)
                </label>
                <input
                  type="text"
                  value={location.district}
                  onChange={(e) => handleLocationChange('district', e.target.value)}
                  placeholder="e.g., Downtown, Suburban"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

              {/* Landmark */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={location.landmark}
                  onChange={(e) => handleLocationChange('landmark', e.target.value)}
                  placeholder="e.g., Central Station"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>

              {/* Disaster Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  <AlertCircle className="inline mr-1" size={16} />
                  Disaster Type *
                </label>
                <select
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-gray-700">Select disaster type</option>
                  {disasterTypes.map(type => (
                    <option key={type} value={type} className="bg-gray-700">{type}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 text-white py-3 rounded-lg font-semibold hover:from-gray-800 hover:to-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-yellow-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Analyzing...
                  </>
                ) : (
                  'Generate Prediction'
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-gray-800 rounded-xl shadow-lg p-6 overflow-y-auto max-h-screen text-white">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Info size={64} className="mb-4" />
                <p className="text-lg text-center">Enter location details and select disaster type to see comprehensive predictions</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="animate-spin text-yellow-500 mb-4" size={48} />
                <p className="text-gray-300">Analyzing historical data and generating predictions...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="border-b border-gray-700 pb-4">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    What If: {result.disasterType} in {result.location.city}, {result.location.state}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      result.riskLevel === 'High' ? 'bg-red-900 bg-opacity-50 text-red-300 border border-red-700' :
                      result.riskLevel === 'Medium' ? 'bg-yellow-900 bg-opacity-30 text-yellow-300 border border-yellow-700' :
                      'bg-green-900 bg-opacity-50 text-green-300 border border-green-700'
                    }`}>
                      Risk Level: {result.riskLevel}
                    </span>
                    {result.riskScore && (
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                        Risk Score: {result.riskScore}/100
                      </span>
                    )}
                  </div>
                </div>

                {result.whatWillHappen && (
                  <div className="bg-red-900 bg-opacity-30 border-l-4 border-red-600 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-500" />
                      What Will Happen If This Disaster Occurs
                    </h3>
                    <div className="space-y-3 text-sm">
                      {result.whatWillHappen.immediate && (
                        <div>
                          <p className="font-semibold text-red-400 mb-1">Immediate Effects (0-6 hours):</p>
                          <p className="text-gray-300">{result.whatWillHappen.immediate}</p>
                        </div>
                      )}
                      {result.whatWillHappen.shortTerm && (
                        <div>
                          <p className="font-semibold text-orange-400 mb-1">Short-term Impact (6-72 hours):</p>
                          <p className="text-gray-300">{result.whatWillHappen.shortTerm}</p>
                        </div>
                      )}
                      {result.whatWillHappen.longTerm && (
                        <div>
                          <p className="font-semibold text-yellow-400 mb-1">Long-term Consequences (3+ days):</p>
                          <p className="text-gray-300">{result.whatWillHappen.longTerm}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Info size={20} className="text-yellow-500" />
                    Historical Context
                  </h3>
                  <p className="text-gray-300 text-sm">{result.historicalContext}</p>
                </div>

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-3">Impact Assessment</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Potential Casualties:</span> <span className="text-gray-300">{result.impactAssessment.casualties}</span></p>
                    <p><span className="font-semibold">Affected Population:</span> <span className="text-gray-300">{result.impactAssessment.affectedPopulation}</span></p>
                    <p><span className="font-semibold">Infrastructure Damage:</span> <span className="text-gray-300">{result.impactAssessment.infrastructureDamage}</span></p>
                    <p><span className="font-semibold">Economic Impact:</span> <span className="text-gray-300">{result.impactAssessment.economicImpact}</span></p>
                  </div>
                </div>

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Clock size={20} className="text-yellow-500" />
                    Evacuation Steps (Follow In Order)
                  </h3>
                  <div className="space-y-3">
                    {result.evacuationPlan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-gray-800 p-3 rounded border border-gray-600">
                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-yellow-600 text-black rounded-full font-bold text-sm">
                          {idx + 1}
                        </span>
                        <p className="text-gray-300 text-sm pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-3">Response Strategies for Authorities</h3>
                  <div className="space-y-2 text-sm">
                    {result.responseStrategies.map((strategy, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-gray-800 p-2 rounded">
                        <span className="font-bold text-yellow-500 flex-shrink-0">•</span>
                        <p className="text-gray-300">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-3">Emergency Contacts & Resources</h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    {result.emergencyResources.map((resource, idx) => (
                      <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-600">
                        <p className="font-semibold text-white">{resource.name}</p>
                        <p className="text-yellow-400 font-mono">{resource.contact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.similarIncidents && result.similarIncidents.length > 0 && (
                  <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                    <h3 className="font-bold text-white mb-3">Similar Historical Incidents</h3>
                    <div className="space-y-2 text-sm">
                      {result.similarIncidents.map((incident, idx) => (
                        <div key={idx} className="border-l-4 border-gray-600 pl-3 bg-gray-800 p-2 rounded">
                          <p className="font-semibold text-white">{incident.location} - {incident.year}</p>
                          <p className="text-gray-400">{incident.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whatif;