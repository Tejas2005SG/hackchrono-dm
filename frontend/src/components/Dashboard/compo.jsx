import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MapPin, Shield, Droplets, Wind, Thermometer, Navigation, Route, X, Loader2 } from 'lucide-react';

// SearchBox component
function SearchBox({ onPlaceSelect }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect?.({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          label: place.name || place.formatted_address,
        });
      }
    });
  }, [onPlaceSelect]);

  return (
    <div className="absolute top-4 left-4 z-10 w-80">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a location..."
        className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/70 backdrop-blur-md shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
      />
    </div>
  );
}

export default function CesiumMap({ center, radiusKm = 2, markers = [], statusText, alertsData, onCenterChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const markerInstancesRef = useRef([]);
  const [showAlertsPanel, setShowAlertsPanel] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showEvacuationPanel, setShowEvacuationPanel] = useState(false);
  const [evacuationData, setEvacuationData] = useState(null);
  const [loadingEvacuation, setLoadingEvacuation] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const existing = document.getElementById('google-maps-js');
      if (existing) {
        existing.addEventListener('load', () => {
          setMapLoaded(true);
          initializeMap();
        }, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-js';
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCSoYgNq1PQdzwz_Gg133A7G0-SBfRIuwQ&libraries=places,geometry,visualization&v=beta`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const initializeMap = () => {
    if (!containerRef.current || !window.google) return;

    const defaultLocation = center || { lat: 28.6139, lng: 77.209 };

    const mapOptions = {
      center: defaultLocation,
      zoom: 18,
      tilt: 67.5,
      heading: 0,
      mapTypeId: window.google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
      rotateControl: true,
      scaleControl: true,
      gestureHandling: 'greedy',
      isFractionalZoomEnabled: true,
      renderingType: 'VECTOR',
      mapId: undefined,
    };

    mapRef.current = new window.google.maps.Map(containerRef.current, mapOptions);
  };

  // Update map center and radius circle
  useEffect(() => {
    if (!mapRef.current || !window.google || !center) return;

    if (markerRef.current) markerRef.current.setMap(null);
    if (circleRef.current) circleRef.current.setMap(null);

    mapRef.current.panTo(center);
    setTimeout(() => {
      mapRef.current.setZoom(18);
      mapRef.current.setTilt(67.5);
    }, 250);

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      animation: window.google.maps.Animation.DROP,
      title: 'Analysis Center',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#1d4ed8',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 1000,
    });

    circleRef.current = new window.google.maps.Circle({
      strokeColor: '#2563eb',
      strokeOpacity: 1,
      strokeWeight: 4,
      fillColor: '#3b82f6',
      fillOpacity: 0.35,
      map: mapRef.current,
      center: center,
      radius: radiusKm * 1000, // Convert km to meters
      zIndex: 999,
      clickable: false,
    });

    const bounds = circleRef.current.getBounds();
    mapRef.current.fitBounds(bounds);
  }, [center, radiusKm]);

  // Update disaster markers
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    markerInstancesRef.current.forEach(marker => marker.setMap(null));
    markerInstancesRef.current = [];

    markers.forEach((mk) => {
      const marker = new window.google.maps.Marker({
        position: { lat: mk.lat, lng: mk.lng },
        map: mapRef.current,
        title: mk.type || 'Disaster Event',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: mk.color || '#ef4444',
          fillOpacity: 0.9,
          strokeColor: '#000000',
          strokeWeight: 1,
        },
        zIndex: 998,
      });

      // FIXED: Corrected the CSS typo here
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <div style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 4px;">
              ${mk.type || 'Disaster Event'}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
              ${mk.message || 'No details available'}
            </div>
            <div style="font-size: 11px; color: #0ea5e9; font-weight: 600;">
              Source: ${mk.source || 'Unknown'}
            </div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current, marker);
      });

      markerInstancesRef.current.push(marker);
    });
  }, [markers]);

  // Fetch Evacuation Analysis from Gemini
  const fetchEvacuationAnalysis = async () => {
    if (!center || !alertsData) {
      alert('Please ensure location and disaster data are loaded first');
      return;
    }

    setLoadingEvacuation(true);
    setShowEvacuationPanel(true);

    try {
      const context = {
        location: {
          name: center.label || 'Unknown Location',
          latitude: center.lat,
          longitude: center.lng,
          radius: radiusKm,
        },
        disasters: alertsData.data || [],
        summary: alertsData.summary || {},
        totalEvents: alertsData.data?.length || 0,
        mapMarkers: markers.map(m => ({
          type: m.type,
          lat: m.lat,
          lng: m.lng,
          severity: m.severity,
        })),
      };

      const prompt = `You are an expert disaster management AI assistant. Analyze the following disaster situation and provide comprehensive evacuation guidance.

**Location Context:**
- Location Name: ${context.location.name}
- Coordinates: ${context.location.latitude}, ${context.location.longitude}
- Monitoring Radius: ${context.location.radius}km

**Current Disaster Situation:**
${JSON.stringify(context.disasters, null, 2)}

**Total Events Detected:** ${context.totalEvents}

**Task:**
Provide a detailed evacuation analysis in the following JSON format:
{
  "overallRiskLevel": "LOW/MODERATE/HIGH/CRITICAL",
  "evacuationRecommended": true/false,
  "safePaths": [
    {
      "name": "Route Name",
      "description": "Detailed description of the safe route",
      "direction": "North/South/East/West or specific direction",
      "estimatedDistance": "distance in km",
      "safetyRating": "1-10",
      "landmarks": ["landmark1", "landmark2"],
      "advantages": ["reason1", "reason2"]
    }
  ],
  "unsafePaths": [
    {
      "name": "Route Name",
      "description": "Detailed description why this route is unsafe",
      "direction": "North/South/East/West or specific direction",
      "hazards": ["hazard1", "hazard2"],
      "riskLevel": "MODERATE/HIGH/CRITICAL",
      "affectedBy": ["disaster type affecting this route"]
    }
  ],
  "safeZones": [
    {
      "name": "Safe Zone Name",
      "type": "Shelter/High Ground/Community Center/Hospital",
      "direction": "General direction from current location",
      "estimatedDistance": "distance",
      "capacity": "estimated capacity if known",
      "facilities": ["facility1", "facility2"]
    }
  ],
  "immediateActions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "emergencyContacts": [
    {
      "service": "Service Name",
      "number": "Contact Number",
      "purpose": "When to use this contact"
    }
  ],
  "timeframe": "How quickly evacuation should occur if needed",
  "specialConsiderations": [
    "Consideration for elderly/children",
    "Weather considerations",
    "Other relevant factors"
  ]
}

**Important Guidelines:**
1. Base your analysis on the actual disaster data provided
2. Consider the geographic location and typical infrastructure in that region
3. If no disasters are detected, still provide general evacuation knowledge for the area
4. Provide realistic, actionable guidance
5. Include specific directional guidance (North, South, East, West, Northeast, etc.)
6. Consider multiple disaster types if present

Return ONLY the JSON object, no additional text.`;

      // FIXED: Changed from gemini-2.5-flash to gemini-1.5-flash
      const API_KEY = 'AIzaSyDZsoiHNfrJtZ5DilTVNJhPH9AwAohD4UQ';
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

      console.log('🚀 Sending request to Gemini API...');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Gemini API Error Response:', errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API Response:', data);

      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        console.error('❌ No text in response:', data);
        throw new Error('No response from Gemini');
      }

      console.log('📄 Generated Text:', generatedText);

      let jsonText = generatedText;
      // Remove markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\n?([\s\S]*?)\n?```/) || generatedText.match(/```\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log('✂️ Extracted JSON from code block');
      }

      try {
        const evacuationAnalysis = JSON.parse(jsonText.trim());
        console.log('✅ Successfully parsed JSON:', evacuationAnalysis);
        setEvacuationData(evacuationAnalysis);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('📄 Failed to parse text:', jsonText);
        throw new Error(`Failed to parse JSON: ${parseError.message}`);
      }
    } catch (error) {
      console.error('❌ Error fetching evacuation analysis:', error);
      setEvacuationData({
        error: true,
        message: error.message || 'Failed to generate evacuation analysis',
        fallback: {
          overallRiskLevel: 'UNKNOWN',
          evacuationRecommended: false,
          immediateActions: [
            'Stay informed about the situation',
            'Keep emergency supplies ready',
            'Follow local authority instructions',
            'Have multiple communication methods available',
          ],
        },
      });
    } finally {
      setLoadingEvacuation(false);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
      
      {/* UI Components */}
      <SearchBox onPlaceSelect={(p) => onCenterChange?.({ lat: p.lat, lng: p.lng, label: p.label })} />
      
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="group relative rounded-xl border border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.18)] transition-shadow">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/60 via-white/30 to-white/10 opacity-60" />
          <div className="relative px-4 py-2 flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-md bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/20 p-1">
              <MapPin className="w-4 h-4" />
            </span>
            <span className="text-sm font-medium text-gray-800 drop-shadow-sm">{statusText}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-16 left-3 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowAlertsPanel(!showAlertsPanel)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-emerald-600 to-green-600 px-4 py-2 text-white shadow-lg shadow-emerald-900/20 hover:from-emerald-500 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-0 transition"
        >
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Current Analysis</span>
        </button>

        <button
          onClick={fetchEvacuationAnalysis}
          disabled={loadingEvacuation}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-orange-600 to-red-600 px-4 py-2 text-white shadow-lg shadow-orange-900/20 hover:from-orange-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-0 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingEvacuation ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Route className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">Evacuation Paths</span>
        </button>
      </div>

      {/* Alerts Panel */}
      {showAlertsPanel && (
        <div className="absolute top-28 left-3 z-10 w-[22rem] max-h-[28rem] overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_12px_45px_-10px_rgba(0,0,0,0.35)]">
          <div className="relative">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-white/80 to-white/40 backdrop-blur-xl border-b border-white/30">
              <h3 className="text-base font-semibold text-gray-900 tracking-tight">Current Analysis</h3>
              <button
                onClick={() => setShowAlertsPanel(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 hover:bg-black/5 transition"
                aria-label="Close analysis"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Analysis Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[24rem]">
              {/* Analysis Summary */}
              <div className="rounded-xl p-3 mb-1 border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-md bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/20 p-1">
                    <Shield className="w-4 h-4" />
                  </span>
                  Area Analysis Summary
                </h4>
                <div className="text-sm text-blue-800/90 space-y-1">
                  <div><strong>Name:</strong> {center?.label || 'Unknown'}</div>
                  <div><strong>Location:</strong> {center ? `${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}` : 'Unknown'}</div>
                  <div><strong>Radius:</strong> {radiusKm}km monitoring area</div>
                  <div><strong>Data Sources:</strong> {alertsData?.sources?.join(', ') || 'Ambee API, NASA FIRMS'}</div>
                  {alertsData?.summary && (
                    <div><strong>Events Found:</strong> {alertsData.summary.total} total ({alertsData.summary.ambee} disasters, {alertsData.summary.nasa} wildfires)</div>
                  )}
                </div>
              </div>

              {/* Structured Event Display */}
              {alertsData?.data && Array.isArray(alertsData.data) && alertsData.data.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Analysis ({alertsData.data.length})
                  </h4>
                  {alertsData.data.map((event, index) => (
                    <div
                      key={event.id || index}
                      className={`p-3 rounded-xl border ${getAlertColor(
                        event.alerts?.[0]?.level || event.severity || 'gray'
                      )} shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getAlertIcon(event.eventType || event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-sm capitalize">
                              {event.eventType || event.type || 'Disaster Event'}
                            </h5>
                            {event.alerts?.[0]?.level && (
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ring-1 ring-inset ${
                                event.alerts[0].level === 'red' ? 'bg-red-100 text-red-800 ring-red-300' :
                                event.alerts[0].level === 'yellow' ? 'bg-yellow-100 text-yellow-800 ring-yellow-300' :
                                event.alerts[0].level === 'green' ? 'bg-green-100 text-green-800 ring-green-300' :
                                'bg-gray-100 text-gray-800 ring-gray-300'
                              }`}>
                                {event.alerts[0].level.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="space-y-2">
                            {event.alerts?.[0]?.message && (
                              <p className="text-xs leading-relaxed bg-white/60 p-2 rounded-md">
                                {event.alerts[0].message}
                              </p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700">
                              {event.id && <div><strong>ID:</strong> {event.id}</div>}
                              {event.severity && <div><strong>Severity:</strong> {event.severity}</div>}
                              {event.latitude && <div><strong>Lat:</strong> {event.latitude.toFixed(6)}</div>}
                              {event.longitude && <div><strong>Lng:</strong> {event.longitude.toFixed(6)}</div>}
                              {event.country && <div><strong>Country:</strong> {event.country}</div>}
                              {event.state && <div><strong>State:</strong> {event.state}</div>}
                              {event.city && <div><strong>City:</strong> {event.city}</div>}
                              {event.source && <div><strong>Source:</strong> {event.source}</div>}
                              {event.confidence && <div><strong>Confidence:</strong> {event.confidence}%</div>}
                              {event.brightness && <div><strong>Brightness:</strong> {event.brightness}K</div>}
                              {event.satellite && <div><strong>Satellite:</strong> {event.satellite}</div>}
                              {event.acqDate && <div><strong>Date:</strong> {event.acqDate}</div>}
                              {event.timestamp && <div><strong>Time:</strong> {new Date(event.timestamp).toLocaleString()}</div>}
                            </div>
                            {event.alerts && event.alerts.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-semibold text-gray-800 mb-1">All Alerts ({event.alerts.length}):</div>
                                {event.alerts.map((alert, alertIndex) => (
                                  <div key={alertIndex} className="bg-white/60 p-2 rounded-md text-[11px] mb-1 ring-1 ring-black/5">
                                    <div><strong>Level:</strong> {alert.level}</div>
                                    {alert.message && <div><strong>Message:</strong> {alert.message}</div>}
                                    {alert.timestamp && <div><strong>Time:</strong> {new Date(alert.timestamp).toLocaleString()}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : alertsData?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-semibold text-red-800 mb-2">API Error</h4>
                  <div className="text-sm text-red-700">
                    <div><strong>Error:</strong> {alertsData.error}</div>
                    <div><strong>Message:</strong> {alertsData.message}</div>
                    {alertsData.attempted_endpoints && (
                      <div className="mt-2">
                        <strong>Attempted Endpoints:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {alertsData.attempted_endpoints.map((endpoint, idx) => (
                            <li key={idx} className="text-xs">{endpoint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Shield className="w-12 h-12 mx-auto mb-2 text-green-400" />
                  <p className="font-semibold text-green-700 mb-1">✅ Area Status: Safe</p>
                  <p className="text-sm">No active disaster events detected</p>
                  <p className="text-xs mt-2">Monitoring: Floods, Earthquakes, Wildfires, Storms</p>
                  <div className="mt-4 p-3 rounded-xl border border-green-200/60 bg-gradient-to-br from-green-50 to-white">
                    <p className="text-xs text-green-800/90">
                      <strong>Analysis:</strong> This area appears to be free from immediate disaster threats. 
                      Continue monitoring for any changes in conditions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evacuation Analysis Panel */}
      {showEvacuationPanel && (
        <div className="absolute top-28 right-4 z-10 w-[28rem] max-h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_12px_45px_-10px_rgba(0,0,0,0.35)]">
          <div className="relative">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/80 to-red-500/80 backdrop-blur-xl border-b border-white/30">
              <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                Evacuation Analysis
              </h3>
              <button
                onClick={() => setShowEvacuationPanel(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white hover:bg-white/20 transition"
                aria-label="Close evacuation panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
              {loadingEvacuation ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                  <p className="text-gray-700 font-medium">Analyzing disaster data...</p>
                  <p className="text-gray-500 text-sm mt-2">Generating evacuation routes</p>
                </div>
              ) : evacuationData?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Analysis Error</h4>
                  <p className="text-sm text-red-700 mb-3">{evacuationData.message}</p>
                  {evacuationData.fallback && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="font-semibold text-gray-800 mb-2">General Safety Actions:</p>
                      <ul className="space-y-1 text-sm text-gray-700">
                        {evacuationData.fallback.immediateActions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : evacuationData ? (
                <>
                  <div className={`rounded-xl p-4 border ${
                    evacuationData.overallRiskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300' :
                    evacuationData.overallRiskLevel === 'HIGH' ? 'bg-orange-50 border-orange-300' :
                    evacuationData.overallRiskLevel === 'MODERATE' ? 'bg-yellow-50 border-yellow-300' :
                    'bg-green-50 border-green-300'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-6 h-6" />
                      <div>
                        <h4 className="font-semibold text-gray-800">Overall Risk Assessment</h4>
                        <p className={`text-sm font-medium ${
                          evacuationData.overallRiskLevel === 'CRITICAL' ? 'text-red-700' :
                          evacuationData.overallRiskLevel === 'HIGH' ? 'text-orange-700' :
                          evacuationData.overallRiskLevel === 'MODERATE' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          Risk Level: {evacuationData.overallRiskLevel}
                        </p>
                        <p className="text-sm text-gray-700">
                          Evacuation {evacuationData.evacuationRecommended ? 'Recommended' : 'Not Required'}
                        </p>
                      </div>
                    </div>
                    {evacuationData.timeframe && (
                      <p className="text-xs text-gray-600">
                        <strong>Timeframe:</strong> {evacuationData.timeframe}
                      </p>
                    )}
                  </div>
                  {evacuationData.safePaths?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-green-500" />
                        Safe Evacuation Paths ({evacuationData.safePaths.length})
                      </h4>
                      <div className="space-y-3">
                        {evacuationData.safePaths.map((path, index) => (
                          <div key={index} className="p-3 rounded-lg bg-green-50/50 border border-green-200">
                            <h5 className="font-medium text-green-800">{path.name}</h5>
                            <p className="text-xs text-gray-700 mt-1">{path.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                              <div><strong>Direction:</strong> {path.direction}</div>
                              <div><strong>Distance:</strong> {path.estimatedDistance}</div>
                              <div><strong>Safety Rating:</strong> {path.safetyRating}/10</div>
                            </div>
                            {path.landmarks?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Landmarks:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                  {path.landmarks.map((landmark, i) => (
                                    <li key={i}>{landmark}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {path.advantages?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Advantages:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                  {path.advantages.map((advantage, i) => (
                                    <li key={i}>{advantage}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evacuationData.unsafePaths?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Unsafe Paths to Avoid ({evacuationData.unsafePaths.length})
                      </h4>
                      <div className="space-y-3">
                        {evacuationData.unsafePaths.map((path, index) => (
                          <div key={index} className="p-3 rounded-lg bg-red-50/50 border border-red-200">
                            <h5 className="font-medium text-red-800">{path.name}</h5>
                            <p className="text-xs text-gray-700 mt-1">{path.description}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                              <div><strong>Direction:</strong> {path.direction}</div>
                              <div><strong>Risk Level:</strong> {path.riskLevel}</div>
                            </div>
                            {path.hazards?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Hazards:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                  {path.hazards.map((hazard, i) => (
                                    <li key={i}>{hazard}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {path.affectedBy?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Affected By:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                  {path.affectedBy.map((disaster, i) => (
                                    <li key={i}>{disaster}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evacuationData.safeZones?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        Safe Zones ({evacuationData.safeZones.length})
                      </h4>
                      <div className="space-y-3">
                        {evacuationData.safeZones.map((zone, index) => (
                          <div key={index} className="p-3 rounded-lg bg-blue-50/50 border border-blue-200">
                            <h5 className="font-medium text-blue-800">{zone.name}</h5>
                            <p className="text-xs text-gray-700 mt-1">{zone.type}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                              <div><strong>Direction:</strong> {zone.direction}</div>
                              <div><strong>Distance:</strong> {zone.estimatedDistance}</div>
                              {zone.capacity && <div><strong>Capacity:</strong> {zone.capacity}</div>}
                            </div>
                            {zone.facilities?.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Facilities:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                  {zone.facilities.map((facility, i) => (
                                    <li key={i}>{facility}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evacuationData.immediateActions?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Immediate Actions
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {evacuationData.immediateActions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {evacuationData.emergencyContacts?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        Emergency Contacts
                      </h4>
                      <div className="space-y-3">
                        {evacuationData.emergencyContacts.map((contact, index) => (
                          <div key={index} className="p-3 rounded-lg bg-purple-50/50 border border-purple-200">
                            <h5 className="font-medium text-purple-800">{contact.service}</h5>
                            <p className="text-xs text-gray-700 mt-1"><strong>Number:</strong> {contact.number}</p>
                            <p className="text-xs text-gray-700 mt-1"><strong>Purpose:</strong> {contact.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evacuationData.specialConsiderations?.length > 0 && (
                    <div className="rounded-xl p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Special Considerations
                      </h4>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {evacuationData.specialConsiderations.map((consideration, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>{consideration}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <Navigation className="w-12 h-12 mx-auto mb-2 text-orange-400" />
                  <p className="font-semibold text-orange-700 mb-1">No Evacuation Data</p>
                  <p className="text-sm">Click "Evacuation Paths" to generate analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg font-semibold">Loading 3D Maps...</p>
            <p className="text-slate-500 text-sm mt-2">Initializing WebGL & 3D Buildings</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get alert color
function getAlertColor(level) {
  switch (level?.toLowerCase()) {
    case 'red':
    case 'critical':
      return 'border-red-200 bg-red-50/50';
    case 'yellow':
    case 'moderate':
      return 'border-yellow-200 bg-yellow-50/50';
    case 'green':
    case 'low':
      return 'border-green-200 bg-green-50/50';
    default:
      return 'border-gray-200 bg-gray-50/50';
  }
}

// Helper function to get alert icon
function getAlertIcon(type) {
  const iconProps = { className: 'w-5 h-5' };
  switch (type?.toLowerCase()) {
    case 'flood':
      return <Droplets {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    case 'earthquake':
      return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    case 'wildfire':
    case 'fire':
      return <Thermometer {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'storm':
    case 'hurricane':
      return <Wind {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    default:
      return <AlertTriangle {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  }
}