"use client"

import { useState, useEffect, useRef } from "react"
import {
  MapPin,
  Navigation,
  Loader2,
  Maximize2,
  Minimize2,
  Info,
  Search,
  RotateCw,
  Move,
  Building2,
  Box,
  Eye,
  AlertTriangle,
  X,
  CheckCircle,
  ChevronDown,
  Code,
  Copy,
  Calendar,
  Users,
  Shield,
  Route,
  Phone,
  Package,
  MapIcon,
  Clock,
  Home,
} from "lucide-react"

interface Location {
  lat: number
  lng: number
}

interface MapState {
  zoom: number
  tilt: number
  heading: number
  mapType: string
  radius: number
}

interface DisasterDetails {
  description: string
  primary_risks: string[]
  vulnerable_areas: string[]
  expected_impact: string
  historical_context: string
  contributing_factors: string[]
}

interface EvacuationPlan {
  preparation_phase: string[]
  immediate_actions: string[]
  during_disaster: string[]
  evacuation_routes: string[]
  post_disaster: string[]
  emergency_contacts: string[]
  essential_supplies: string[]
}

interface PredictionData {
  disaster_name: string
  severity: string
  country: string
  state: string
  location: string
  latitude: number
  longitude: number
  start_day: string
  end_day: string
  evacuations: number
  affected_population: number
  disaster_details: DisasterDetails
  evacuation_plan: EvacuationPlan
  warnings: string | null
  error: string | null
}

interface PredictionResult {
  predictions: PredictionData[]
  timestamp: string
  total_locations: number
  status?: string
  message?: string
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function LocationDigitalTwin() {
  const [location, setLocation] = useState<Location | null>(null)
  const [manualLat, setManualLat] = useState<string>("")
  const [manualLon, setManualLon] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [mapState, setMapState] = useState<MapState>({
    zoom: 20,
    tilt: 67.5,
    heading: 0,
    mapType: "satellite",
    radius: 5,
  })
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [mapLoaded, setMapLoaded] = useState<boolean>(false)
  const [locationSource, setLocationSource] = useState<string>("")
  const [is3DMode, setIs3DMode] = useState<boolean>(true)
  const [hostelWithinRadius, setHostelWithinRadius] = useState<boolean>(false)
  const [placesWithinRadius, setPlacesWithinRadius] = useState<any[]>([])
  const [loadingPlaces, setLoadingPlaces] = useState<boolean>(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false)
  const [showPredictionModal, setShowPredictionModal] = useState<boolean>(false)
  const [selectedPlace, setSelectedPlace] = useState<any>(null)

  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const circleRef = useRef<any>(null)
  const hostelMarkerRef = useRef<any>(null)
  const autocompleteRef = useRef<any>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const radiusLabelRef = useRef<any>(null)
  const centerLabelRef = useRef<any>(null)
  const radiusLineRef = useRef<any>(null)

  const HOSTEL_LOCATION: Location = {
    lat: 30.771059422664788,
    lng: 76.56887993123189,
  }

  const getBackendURL = () => {
    return 'http://localhost:8000'
  }

  const BACKEND_URL = getBackendURL()

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCSoYgNq1PQdzwz_Gg133A7G0-SBfRIuwQ&libraries=places,geometry,visualization&v=beta`
      script.async = true
      script.defer = true
      script.onload = () => {
        setMapLoaded(true)
        initializeMap()
      }
      script.onerror = () => {
        setError("Failed to load Google Maps. Please refresh the page.")
      }
      document.head.appendChild(script)
    }

    loadGoogleMapsScript()
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    const defaultLocation = { lat: 40.7589, lng: -73.9851 }

    googleMapRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultLocation,
      zoom: 20,
      tilt: 67.5,
      heading: 45,
      mapTypeId: window.google.maps.MapTypeId.HYBRID,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
      rotateControl: true,
      scaleControl: true,
      gestureHandling: "greedy",
      isFractionalZoomEnabled: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
        position: window.google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ["satellite", "hybrid", "roadmap", "terrain"],
      },
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      streetViewControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      rotateControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
      },
      styles: [
        { featureType: "poi.business", stylers: [{ visibility: "on" }] },
        { featureType: "poi.park", stylers: [{ visibility: "on" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }, { weight: 3 }] },
        { featureType: "road", elementType: "labels", stylers: [{ visibility: "on" }] },
        { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
      ],
      renderingType: "VECTOR" as any,
    })

    if (window.google.maps.WebGLOverlayView) {
      console.log("WebGL 3D buildings enabled")
    }

    if (searchInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        fields: ["geometry", "name", "formatted_address", "place_id"],
      })
      autocompleteRef.current.bindTo("bounds", googleMapRef.current)

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace()
        if (place.geometry?.location) {
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
          setLocation(newLocation)
          setLocationSource(`Search: ${place.name || "Unknown"}`)
          updateMapLocation(newLocation, true)
          setError("")
        }
      })
    }

    ;["zoom_changed", "tilt_changed", "heading_changed", "maptypeid_changed"].forEach((event) => {
      googleMapRef.current.addListener(event, () => {
        setMapState((prev) => ({
          ...prev,
          zoom: googleMapRef.current.getZoom(),
          tilt: googleMapRef.current.getTilt(),
          heading: googleMapRef.current.getHeading(),
          mapType: googleMapRef.current.getMapTypeId(),
        }))
      })
    })

    setLocation(defaultLocation)
    setLocationSource("Demo Location: Times Square, NYC")
    updateMapLocation(defaultLocation, false)
  }

  const calculateDistance = (loc1: Location, loc2: Location): number => {
    if (!window.google) return 0
    return (
      window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(loc1.lat, loc1.lng),
        new window.google.maps.LatLng(loc2.lat, loc2.lng),
      ) / 1000
    )
  }

  const searchPlacesInRadius = (centerLocation: Location, radiusKm: number) => {
    if (!googleMapRef.current || !window.google) return

    setLoadingPlaces(true)
    const placesService = new window.google.maps.places.PlacesService(googleMapRef.current)

    const hostelDistance = calculateDistance(centerLocation, HOSTEL_LOCATION)
    const hostelData = hostelDistance <= radiusKm ? [{
      name: "Shivalik Girls Hostel",
      lat: HOSTEL_LOCATION.lat,
      lng: HOSTEL_LOCATION.lng,
      distance: hostelDistance,
      types: ["hostel", "lodging"],
      vicinity: "Kharar, Punjab",
    }] : []

    const request = {
      location: new window.google.maps.LatLng(centerLocation.lat, centerLocation.lng),
      radius: radiusKm * 1000,
    }

    placesService.nearbySearch(request, (results: any, status: any) => {
      let placesData: any[] = [...hostelData]
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const apiPlaces = results
          .map((place: any) => {
            const distance = calculateDistance(centerLocation, {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            })

            if (distance <= radiusKm) {
              return {
                name: place.name,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                distance: distance,
                types: place.types || [],
                vicinity: place.vicinity || "N/A",
              }
            }
            return null
          })
          .filter((place: any) => place !== null)
          .sort((a: any, b: any) => a.distance - b.distance)

        placesData = [...hostelData, ...apiPlaces]
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        placesData = hostelData
      } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
        console.warn("Places API query limit reached")
        placesData = hostelData
      }

      setPlacesWithinRadius(placesData)
      setLoadingPlaces(false)
    })
  }

  const updateMapLocation = (loc: Location, animate = true) => {
    if (!googleMapRef.current || !window.google) return

    if (markerRef.current) markerRef.current.setMap(null)
    if (circleRef.current) circleRef.current.setMap(null)
    if (hostelMarkerRef.current) hostelMarkerRef.current.setMap(null)
    if (radiusLabelRef.current) {
      radiusLabelRef.current.setMap(null)
      radiusLabelRef.current = null
    }
    if (centerLabelRef.current) {
      centerLabelRef.current.setMap(null)
      centerLabelRef.current = null
    }
    if (radiusLineRef.current) {
      radiusLineRef.current.setMap(null)
      radiusLineRef.current = null
    }

    if (animate) {
      googleMapRef.current.panTo(loc)
      setTimeout(() => {
        googleMapRef.current.setZoom(mapState.zoom)
        googleMapRef.current.setTilt(mapState.tilt)
      }, 250)
    } else {
      googleMapRef.current.setCenter(loc)
    }

    markerRef.current = new window.google.maps.Marker({
      position: loc,
      map: googleMapRef.current,
      animation: window.google.maps.Animation.DROP,
      title: "Point Source",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: "#06b6d4",
        fillOpacity: 0.9,
        strokeColor: "#ffffff",
        strokeWeight: 4,
      },
      zIndex: 1000,
    })

    circleRef.current = new window.google.maps.Circle({
      strokeColor: "#2563eb",
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      map: googleMapRef.current,
      center: loc,
      radius: mapState.radius * 1000,
      zIndex: 999,
      clickable: false,
    })

    const distance = calculateDistance(loc, HOSTEL_LOCATION)
    const isWithinRadius = distance <= mapState.radius
    setHostelWithinRadius(isWithinRadius)

    if (isWithinRadius) {
      hostelMarkerRef.current = new window.google.maps.Marker({
        position: HOSTEL_LOCATION,
        map: googleMapRef.current,
        title: "Shivalik girls hostel",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: "#f59e0b",
          fillOpacity: 0.95,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        zIndex: 998,
      })

      new window.google.maps.Marker({
        position: HOSTEL_LOCATION,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0.01,
          fillOpacity: 0,
          strokeOpacity: 0,
        },
        label: {
          text: "Shivalik Girls Hostel",
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
        },
        zIndex: 1001,
      })
    }

    const bounds = circleRef.current.getBounds()
    googleMapRef.current.fitBounds(bounds)

    searchPlacesInRadius(loc, mapState.radius)

    centerLabelRef.current = new window.google.maps.Marker({
      position: loc,
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 0.01,
        fillOpacity: 0,
        strokeOpacity: 0,
      },
      label: {
        text: "Point Source",
        color: "#ffffff",
        fontSize: "12px",
        fontWeight: "700",
      },
      zIndex: 1001,
    })

    const radiusMeters = mapState.radius * 1000
    const labelPos = window.google.maps.geometry.spherical.computeOffset(loc, radiusMeters, 90)

    radiusLabelRef.current = new window.google.maps.Marker({
      position: labelPos,
      map: googleMapRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 0.01,
        fillOpacity: 0,
        strokeOpacity: 0,
      },
      label: {
        text: `${mapState.radius.toFixed(1)} km radius`,
        color: "#60a5fa",
        fontSize: "12px",
        fontWeight: "700",
      },
      zIndex: 1001,
    })
  }

  const getGPSLocation = () => {
    setLoading(true)
    setError("")

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setLocation(loc)
        setLocationSource(`GPS (±${position.coords.accuracy.toFixed(0)}m accuracy)`)
        setLoading(false)
        updateMapLocation(loc, true)
      },
      (err) => {
        setError(`GPS Error: ${err.message}`)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const setManualLocation = () => {
    const lat = Number.parseFloat(manualLat)
    const lng = Number.parseFloat(manualLon)

    if (isNaN(lat) || isNaN(lng)) {
      setError("Please enter valid numbers for coordinates")
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Invalid coordinates. Lat: -90 to 90, Lng: -180 to 180")
      return
    }

    const loc: Location = { lat, lng }
    setLocation(loc)
    setLocationSource("Manual Entry")
    setError("")
    updateMapLocation(loc, true)
  }

  const updateZoom = (value: number) => {
    const newZoom = Number.parseFloat(value.toFixed(1))
    setMapState((prev) => ({ ...prev, zoom: newZoom }))
    if (googleMapRef.current) {
      googleMapRef.current.setZoom(newZoom)
    }
  }

  const updateTilt = (value: number) => {
    const newTilt = Number.parseFloat(value.toFixed(1))
    setMapState((prev) => ({ ...prev, tilt: newTilt }))
    if (googleMapRef.current) {
      googleMapRef.current.setTilt(newTilt)
    }
  }

  const updateHeading = (value: number) => {
    setMapState((prev) => ({ ...prev, heading: value }))
    if (googleMapRef.current) {
      googleMapRef.current.setHeading(value)
    }
  }

  const updateRadius = (value: number) => {
    const newRadius = Number.parseFloat(value.toFixed(1))
    setMapState((prev) => ({ ...prev, radius: newRadius }))

    if (circleRef.current && location) {
      circleRef.current.setRadius(newRadius * 1000)

      const distance = calculateDistance(location, HOSTEL_LOCATION)
      const isWithinRadius = distance <= newRadius
      setHostelWithinRadius(isWithinRadius)

      if (hostelMarkerRef.current) {
        hostelMarkerRef.current.setMap(null)
        hostelMarkerRef.current = null
      }

      if (isWithinRadius && googleMapRef.current) {
        hostelMarkerRef.current = new window.google.maps.Marker({
          position: HOSTEL_LOCATION,
          map: googleMapRef.current,
          title: "Shivalik Girls Hostel",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: "#f59e0b",
            fillOpacity: 0.95,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          },
          zIndex: 998,
        })

        new window.google.maps.Marker({
          position: HOSTEL_LOCATION,
          map: googleMapRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 0.01,
            fillOpacity: 0,
            strokeOpacity: 0,
          },
          label: {
            text: "Shivalik Girls Hostel",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "700",
          },
          zIndex: 1001,
        })
      }

      const bounds = circleRef.current.getBounds()
      if (googleMapRef.current) {
        googleMapRef.current.fitBounds(bounds)
      }

      if (location) {
        searchPlacesInRadius(location, newRadius)
      }

      repositionRadiusLabel()
    }
  }

  const updateMapType = (type: string) => {
    setMapState((prev) => ({ ...prev, mapType: type }))
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(type)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const enable3DMode = () => {
    setMapState((prev) => ({
      ...prev,
      zoom: 20,
      tilt: 67.5,
      mapType: "satellite",
    }))

    if (googleMapRef.current) {
      googleMapRef.current.setZoom(20)
      googleMapRef.current.setTilt(67.5)
      googleMapRef.current.setMapTypeId("satellite")
    }
    setIs3DMode(true)
  }

  const reset2DView = () => {
    setMapState((prev) => ({
      ...prev,
      zoom: 15,
      tilt: 0,
      heading: 0,
    }))

    if (googleMapRef.current) {
      googleMapRef.current.setZoom(15)
      googleMapRef.current.setTilt(0)
      googleMapRef.current.setHeading(0)
    }
    setIs3DMode(false)
  }

  const autoRotate = () => {
    if (!googleMapRef.current) return

    let currentHeading = mapState.heading
    const rotateInterval = setInterval(() => {
      currentHeading = (currentHeading + 3) % 360
      if (googleMapRef.current) {
        googleMapRef.current.setHeading(currentHeading)
        setMapState((prev) => ({ ...prev, heading: currentHeading }))
      }
    }, 40)

    setTimeout(() => {
      clearInterval(rotateInterval)
    }, 12000)
  }

  const repositionRadiusLabel = () => {
    if (!window.google || !googleMapRef.current || !circleRef.current) return
    const center = circleRef.current.getCenter()
    if (!center) return
    const loc = { lat: center.lat(), lng: center.lng() }
    const radiusMeters = mapState.radius * 1000
    const labelPos = window.google.maps.geometry.spherical.computeOffset(loc, radiusMeters, 90)

    if (radiusLabelRef.current) {
      radiusLabelRef.current.setPosition(labelPos)
      radiusLabelRef.current.setLabel({
        text: `${mapState.radius.toFixed(1)} km radius`,
        color: "#60a5fa",
        fontSize: "12px",
        fontWeight: "700",
      })
    } else {
      radiusLabelRef.current = new window.google.maps.Marker({
        position: labelPos,
        map: googleMapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 0.01,
          fillOpacity: 0,
          strokeOpacity: 0,
        },
        label: {
          text: `${mapState.radius.toFixed(1)} km radius`,
          color: "#60a5fa",
          fontSize: "12px",
          fontWeight: "700",
        },
        zIndex: 1001,
      })
    }

    if (radiusLineRef.current) {
      radiusLineRef.current.setMap(null)
      radiusLineRef.current = null
    }
  }

  const predictDisaster = async (place: any) => {
    setPredictionLoading(true)
    setSelectedPlace(place)
    setPredictionResult(null)
    setShowPredictionModal(true)

    try {
      const response = await fetch(`${BACKEND_URL}/disaster/predictdisaster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            {
              latitude: place.lat,
              longitude: place.lng,
            },
          ],
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`)
      }

      const data: PredictionResult = await response.json()
      setPredictionResult(data)
    } catch (err: any) {
      setPredictionResult({
        predictions: [],
        timestamp: new Date().toISOString(),
        total_locations: 0,
        status: "error",
        message: err.message || "Failed to connect to disaster prediction API.",
      })
    } finally {
      setPredictionLoading(false)
    }
  }

  const closePredictionModal = () => {
    setShowPredictionModal(false)
    setPredictionResult(null)
    setSelectedPlace(null)
  }

  // Helper function to get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'red'
      case 'medium':
      case 'moderate':
        return 'amber'
      case 'low':
        return 'green'
      default:
        return 'slate'
    }
  }

  // Helper function to get disaster icon
  const getDisasterIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('earthquake')) return '🌍'
    if (lowerType.includes('flood')) return '🌊'
    if (lowerType.includes('hurricane') || lowerType.includes('cyclone')) return '🌀'
    if (lowerType.includes('tornado')) return '🌪️'
    if (lowerType.includes('wildfire')) return '🔥'
    if (lowerType.includes('tsunami')) return '🌊'
    if (lowerType.includes('drought')) return '☀️'
    if (lowerType.includes('landslide')) return '⛰️'
    if (lowerType.includes('volcanic')) return '🌋'
    return '⚠️'
  }

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Render disaster prediction card
  const renderDisasterPrediction = (prediction: PredictionData, index: number) => {
    const severityColor = getSeverityColor(prediction.severity)
    const icon = getDisasterIcon(prediction.disaster_name)

    const colorClasses = {
      red: 'from-red-900/20 to-red-800/10 border-red-500/50',
      amber: 'from-amber-900/20 to-amber-800/10 border-amber-500/50',
      green: 'from-green-900/20 to-green-800/10 border-green-500/50',
      slate: 'from-slate-900/20 to-slate-800/10 border-slate-500/50',
    }

    const textColorClasses = {
      red: 'text-red-400',
      amber: 'text-amber-400',
      green: 'text-green-400',
      slate: 'text-slate-400',
    }

    const bgColorClasses = {
      red: 'bg-red-500/20',
      amber: 'bg-amber-500/20',
      green: 'bg-green-500/20',
      slate: 'bg-slate-500/20',
    }

    return (
      <div key={index} className={`bg-gradient-to-br ${colorClasses[severityColor as keyof typeof colorClasses]} border rounded-xl p-6 shadow-xl`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">{prediction.disaster_name}</h3>
              <div className={`${bgColorClasses[severityColor as keyof typeof bgColorClasses]} px-3 py-1 rounded-full inline-block mt-2`}>
                <span className={`${textColorClasses[severityColor as keyof typeof textColorClasses]} font-bold text-sm uppercase`}>
                  {prediction.severity} Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Time Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <MapIcon className="w-5 h-5" />
              Location Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-white font-semibold">{prediction.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">State:</span>
                <span className="text-white font-semibold">{prediction.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Country:</span>
                <span className="text-white font-semibold">{prediction.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Coordinates:</span>
                <span className="text-white font-mono text-xs">{prediction.latitude.toFixed(6)}, {prediction.longitude.toFixed(6)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Timeline & Impact
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Start Date:</span>
                <span className="text-white font-semibold">{formatDate(prediction.start_day)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">End Date:</span>
                <span className="text-white font-semibold">{formatDate(prediction.end_day)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evacuations:</span>
                <span className="text-orange-400 font-bold">{prediction.evacuations.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Affected Population:</span>
                <span className="text-red-400 font-bold">{prediction.affected_population.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disaster Details */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Disaster Details
          </h4>
          <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
            <p className="text-slate-200 text-sm leading-relaxed">{prediction.disaster_details.description}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-red-400 font-semibold mb-2 text-sm">Primary Risks</h5>
              <ul className="text-xs text-slate-300 space-y-1">
                {prediction.disaster_details.primary_risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-amber-400 font-semibold mb-2 text-sm">Vulnerable Areas</h5>
              <ul className="text-xs text-slate-300 space-y-1">
                {prediction.disaster_details.vulnerable_areas.map((area, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg">
              <h5 className="text-blue-400 font-semibold mb-2 text-sm">Contributing Factors</h5>
              <ul className="text-xs text-slate-300 space-y-1">
                {prediction.disaster_details.contributing_factors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h5 className="text-purple-400 font-semibold mb-2 text-sm">Expected Impact</h5>
            <p className="text-slate-200 text-sm">{prediction.disaster_details.expected_impact}</p>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-lg mt-4">
            <h5 className="text-cyan-400 font-semibold mb-2 text-sm">Historical Context</h5>
            <p className="text-slate-200 text-sm">{prediction.disaster_details.historical_context}</p>
          </div>
        </div>

        {/* Evacuation Plan */}
        <div>
          <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Evacuation Plan
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-3">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-cyan-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Preparation Phase
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.preparation_phase.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-red-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Immediate Actions
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.immediate_actions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-purple-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  During Disaster
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.during_disaster.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-green-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Evacuation Routes
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.evacuation_routes.map((route, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{route}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-blue-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Emergency Contacts
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.emergency_contacts.map((contact, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 mt-1">•</span>
                      <span>{contact}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h5 className="text-amber-400 font-semibold mb-2 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Essential Supplies
                </h5>
                <ul className="text-xs text-slate-300 space-y-1">
                  {prediction.evacuation_plan.essential_supplies.map((supply, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>
                      <span>{supply}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 p-3 rounded-lg">
            <h5 className="text-pink-400 font-semibold mb-2 text-sm flex items-center gap-2">
              <Home className="w-4 h-4" />
              Post Disaster Recovery
            </h5>
            <ul className="text-xs text-slate-300 space-y-1">
              {prediction.evacuation_plan.post_disaster.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-pink-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold mb-3 text-yellow-100 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Building2 className="w-12 h-12 text-yellow-200" />
            3D Location Digital Twin with Disaster Prediction
          </h1>
          <p className="text-slate-300 text-lg">Photorealistic 3D Satellite View with Real Buildings & AI Disaster Prediction</p>
          {/* <p className="text-slate-500 text-sm mt-2">Backend: {BACKEND_URL}</p> */}
        </div>

        <div className="backdrop-blur-lg rounded-xl p-4 mb-6 border border-yellow-500">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={enable3DMode}
              className=" text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg border border-yellow-500 shadow-yellow-500/20"
            >
              <Box className="w-5 h-5" />
              Enable Full 3D View
            </button>

            <button
              onClick={reset2DView}
              className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Reset to 2D
            </button>

            <button
              onClick={autoRotate}
              disabled={!location}
              className="  text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg border border-yellow-500 shadow-yellow-500/20"
            >
              <RotateCw className="w-5 h-5" />
              360° Auto-Rotate
            </button>

            <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-lg border border-yellow-500/50 z-10 shadow-lg shadow-yellow-500/30">
              <div className={`w-3 h-3 rounded-full ${is3DMode ? "bg-green-500 animate-pulse" : "bg-slate-500"}`}></div>
              <span className="text-sm font-semibold">{is3DMode ? "3D Mode Active" : "2D Mode"}</span>
            </div>

            {hostelWithinRadius && (
              <div className="flex items-center gap-2 bg-amber-900/50 px-4 py-2 rounded-lg border border-amber-500/50 z-10 shadow-lg shadow-amber-500/30 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-bounce"></div>
                <span className="text-sm font-semibold text-amber-300">Shivalik Hostel Detected!</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 mb-6 border border-slate-700">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                <Navigation className="w-5 h-5" />
                GPS Location
              </h3>
              <button
                onClick={getGPSLocation}
                disabled={loading}
                className="w-full bg-yellow-700  text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-5 h-5" />
                    Capture GPS
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                <Move className="w-5 h-5" />
                Manual Coordinates
              </h3>
              <input
                type="text"
                placeholder="Latitude (e.g., 40.7128)"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <input
                type="text"
                placeholder="Longitude (e.g., -74.0060)"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <button
                onClick={setManualLocation}
                className="w-full bg-yellow-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-300 shadow-lg"
              >
                Set Location
              </button>
            </div>

            <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-400">
                <Search className="w-5 h-5" />
                Search Places
              </h3>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Try 'Burj Khalifa, Dubai'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Search any location worldwide
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-700">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                Search Radius
              </label>
              <input
                type="range"
                min="0.1"
                max="20"
                step="0.5"
                value={mapState.radius}
                onChange={(e) => updateRadius(Number.parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm font-bold text-cyan-400 mt-1">{mapState.radius.toFixed(1)} km</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                Zoom Level
              </label>
              <input
                type="range"
                min="12"
                max="21"
                step="0.5"
                value={mapState.zoom}
                onChange={(e) => updateZoom(Number.parseFloat(e.target.value))}
                className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm font-bold text-blue-400 mt-1">
                {mapState.zoom >= 18 ? "3D Max" : `Level ${mapState.zoom.toFixed(1)}`}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Tilt (3D Angle)
              </label>
              <input
                type="range"
                min="0"
                max="85"
                step="2.5"
                value={mapState.tilt}
                onChange={(e) => updateTilt(Number.parseFloat(e.target.value))}
                className="w-full accent-purple-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm font-bold text-purple-400 mt-1">
                {mapState.tilt === 0 ? "Flat" : `${mapState.tilt.toFixed(1)}°`}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-1">
                <RotateCw className="w-3 h-3 text-pink-400" />
                Rotation
              </label>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={mapState.heading}
                onChange={(e) => updateHeading(Number.parseInt(e.target.value))}
                className="w-full accent-pink-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-center text-sm font-bold text-pink-400 mt-1">{mapState.heading}°</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Map Type
              </label>
              <select
                value={mapState.mapType}
                onChange={(e) => updateMapType(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-sm"
              >
                <option value="satellite">🛰️ Satellite</option>
                <option value="hybrid">🗺️ Hybrid</option>
                <option value="roadmap">🚗 Roadmap</option>
                <option value="terrain">⛰️ Terrain</option>
              </select>
            </div>
          </div>

          {location && (
            <div className="mt-6 p-5  rounded-lg border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-400 font-semibold">Source:</span>
                  <span className="text-white font-bold">{locationSource}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-semibold">Latitude:</span>
                  <span className="text-white font-mono">{location.lat.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-purple-400 font-semibold">Longitude:</span>
                  <span className="text-white font-mono">{location.lng.toFixed(6)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-semibold">View:</span>
                  <span className="text-white font-bold">{is3DMode ? "3D Active" : "2D"}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200 flex items-start gap-3 animate-pulse">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="font-semibold">{error}</span>
            </div>
          )}
        </div>

        <div
          className={`bg-slate-900 backdrop-blur-lg rounded-xl overflow-hidden border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 relative ${isFullscreen ? "fixed inset-4 z-50" : "h-[750px]"}`}
        >
          <div ref={mapRef} className="w-full h-full" />

          {location && (
            <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-md px-5 py-4 rounded-xl border-2 border-cyan-500/50 z-10 shadow-lg shadow-cyan-500/30">
              <div className="flex items-center gap-2 text-sm mb-2 font-semibold drop-shadow">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400">3D Digital Twin</span>
              </div>
              <div className="space-y-1.5 text-xs drop-shadow">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-slate-300">Radius:</span>
                  <span className="text-white font-bold">{mapState.radius.toFixed(1)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-300">Zoom:</span>
                  <span className="text-white font-bold">{mapState.zoom.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-slate-300">Tilt:</span>
                  <span className="text-white font-bold">{mapState.tilt.toFixed(1)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-slate-300">Heading:</span>
                  <span className="text-white font-bold">{mapState.heading}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">Type:</span>
                  <span className="text-white font-bold capitalize">{mapState.mapType}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-700">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
                {hostelWithinRadius && (
                  <div className="pt-2 mt-2 border-t border-amber-700/50 bg-amber-900/30 -mx-2 px-2 py-2 rounded">
                    <div className="flex items-center gap-2 text-amber-300 font-bold">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                      <span>🏨 Shivalik Hostel Inside!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {is3DMode && (
            <div className="absolute bottom-4 left-4 bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 rounded-full z-10 flex items-center gap-2 shadow-lg shadow-cyan-500/50 animate-pulse">
              <Box className="w-4 h-4" />
              <span className="text-sm font-bold">3D MODE ACTIVE</span>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 bg-slate-900/95 hover:bg-slate-800 p-3 rounded-xl transition-all z-10 border-2 border-slate-700 hover:border-cyan-500 shadow-lg"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-cyan-400" />
            ) : (
              <Maximize2 className="w-5 h-5 text-cyan-400" />
            )}
          </button>

          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-20">
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-cyan-400" />
                <p className="text-slate-300 text-lg font-semibold">Loading Photorealistic 3D Maps...</p>
                <p className="text-slate-500 text-sm mt-2">Initializing WebGL & 3D Buildings</p>
              </div>
            </div>
          )}
        </div>

        {location && (
          <div className="mt-6 bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
                <MapPin className="w-6 h-6" />
                Places Within {mapState.radius.toFixed(1)} km Radius
              </h3>Photorealistic 3D Features
              {loadingPlaces && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Searching...</span>
                </div>
              )}
            </div>

            {placesWithinRadius.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/50 border-b-2 border-cyan-500/50">
                      <th className="text-left p-3 font-bold text-cyan-400">#</th>
                      <th className="text-left p-3 font-bold text-cyan-400">Place Name</th>
                      <th className="text-left p-3 font-bold text-blue-400">Latitude</th>
                      <th className="text-left p-3 font-bold text-purple-400">Longitude</th>
                      <th className="text-left p-3 font-bold text-green-400">Distance (km)</th>
                      <th className="text-left p-3 font-bold text-pink-400">Type</th>
                      <th className="text-left p-3 font-bold text-amber-400">Address</th>
                      <th className="text-left p-3 font-bold text-red-400">Disaster Prediction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placesWithinRadius.map((place, index) => (
                      <tr
                        key={index}
                        className={`border-b border-slate-700 hover:bg-slate-900/50 transition-colors ${
                          place.name === "Shivalik Girls Hostel" ? "bg-amber-900/20 border-amber-500/30" : ""
                        }`}
                      >
                        <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                        <td className="p-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            {place.name === "Shivalik Girls Hostel" && (
                              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                            )}
                            {place.name}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-blue-300">{place.lat.toFixed(6)}</td>
                        <td className="p-3 font-mono text-purple-300">{place.lng.toFixed(6)}</td>
                        <td className="p-3 font-bold text-green-300">{place.distance.toFixed(2)}</td>
                        <td className="p-3 text-pink-300 text-xs">{place.types.slice(0, 2).join(", ")}</td>
                        <td className="p-3 text-slate-300 text-xs">{place.vicinity}</td>
                        <td className="p-3">
                          <button
                            onClick={() => predictDisaster(place)}
                            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2 text-xs shadow-lg hover:shadow-xl"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            Predict
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 p-3 bg-slate-900/50 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-slate-300">
                      Total Places Found: <span className="font-bold text-white">{placesWithinRadius.length}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-slate-300">
                      Search Radius: <span className="font-bold text-white">{mapState.radius.toFixed(1)} km</span>
                    </span>
                  </div>
                </div>
              </div>
            ) : !loadingPlaces ? (
              <div className="text-center py-8 text-slate-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-semibold">No places found within the current radius</p>
                <p className="text-sm mt-2">Try increasing the search radius or selecting a different location</p>
              </div>
            ) : null}
          </div>
        )}

        {/* Disaster Prediction Modal */}
        {showPredictionModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-red-500/50 shadow-2xl shadow-red-500/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-red-600 to-orange-600 p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Disaster Prediction Analysis</h2>
                    <p className="text-red-100 text-sm mt-1">
                      {selectedPlace?.name || "Location Analysis"} - {selectedPlace ? `${selectedPlace.lat.toFixed(4)}, ${selectedPlace.lng.toFixed(4)}` : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closePredictionModal}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6">
                {predictionLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-red-400" />
                    <p className="text-slate-300 text-lg font-semibold">Analyzing Location with AI...</p>
                    <p className="text-slate-500 text-sm mt-2">Running disaster prediction models</p>
                  </div>
                ) : predictionResult ? (
                  <div className="space-y-6">
                    {predictionResult.status === "error" ? (
                      <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                          <h3 className="text-lg font-bold text-red-400">Prediction Error</h3>
                        </div>
                        <p className="text-red-200">{predictionResult.message}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Success Header */}
                        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                          <div>
                            <h3 className="text-lg font-bold text-green-400">Analysis Complete</h3>
                            <p className="text-green-200 text-sm">
                              AI prediction processed successfully - {predictionResult.total_locations} location(s) analyzed
                            </p>
                          </div>
                        </div>

                        {/* Render Disaster Predictions */}
                        {predictionResult.predictions && predictionResult.predictions.length > 0 ? (
                          <div className="space-y-6">
                            {predictionResult.predictions.map((prediction, index) => 
                              renderDisasterPrediction(prediction, index)
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
                            <p className="text-amber-200">No disaster predictions received from the server</p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <h4 className="text-lg font-bold text-slate-300 mb-3">Analysis Metadata</h4>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-900/30 p-3 rounded border border-slate-700">
                              <span className="text-slate-400">Total Predictions:</span>
                              <p className="text-white font-semibold">{predictionResult.predictions?.length || 0}</p>
                            </div>
                            <div className="bg-slate-900/30 p-3 rounded border border-slate-700">
                              <span className="text-slate-400">Analyzed At:</span>
                              <p className="text-white font-semibold">{new Date(predictionResult.timestamp).toLocaleString()}</p>
                            </div>
                            <div className="bg-slate-900/30 p-3 rounded border border-slate-700">
                              <span className="text-slate-400">Locations:</span>
                              <p className="text-white font-semibold">{predictionResult.total_locations}</p>
                            </div>
                          </div>
                        </div>

                        {/* Raw JSON (Collapsible for Developers) */}
                        <details className="group">
                          <summary className="cursor-pointer p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/70 transition-colors flex items-center justify-between text-sm">
                            <span className="text-slate-300 font-medium flex items-center gap-2">
                              <Code className="w-4 h-4" />
                              View Raw JSON (Developer)
                            </span>
                            <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="mt-3 p-3 bg-slate-900/80 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-slate-400 font-mono">Raw Response Data</span>
                              <button
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(predictionResult, null, 2))}
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                            </div>
                            <pre className="text-xs text-slate-300 bg-slate-950 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto font-mono border border-slate-600">
                              {JSON.stringify(predictionResult, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}

                    {/* Close Button */}
                    <button
                      onClick={closePredictionModal}
                      className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      Close Analysis
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6  backdrop-blur rounded-xl p-6 border border-yellow-500/30">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
            <Building2 className="w-6 h-6" />
            Photorealistic 3D Features
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-cyan-400 mb-1">WebGL 3D Buildings</div>
                <div className="text-xs">Real building structures with accurate heights & textures</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-blue-400 mb-1">85° Maximum Tilt</div>
                <div className="text-xs">Near-horizontal viewing for immersive 3D cityscapes</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-purple-400 mb-1">360° Rotation</div>
                <div className="text-xs">Complete rotation control with smooth auto-rotate</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-pink-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-pink-400 mb-1">High-Res Satellite</div>
                <div className="text-xs">Crystal-clear satellite imagery at zoom level 21</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-green-400 mb-1">Street View Integration</div>
                <div className="text-xs">Seamless switch to ground-level panoramic views</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-2"></div>
              <div>
                <div className="font-bold text-amber-400 mb-1">AI Disaster Prediction</div>
                <div className="text-xs">Comprehensive disaster analysis with evacuation plans</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6  backdrop-blur rounded-xl p-6 border border-yellow-500/30">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
            <Info className="w-5 h-5" />
            Pro Tips for Best Experience
          </h3>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Use <strong>Satellite</strong> map type for best 3D building rendering
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Set zoom to <strong>19-21</strong> for maximum 3D detail
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Tilt between <strong>60°-75°</strong> for optimal building views
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Try <strong>major cities</strong> for complete 3D coverage
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Use <strong>Auto-Rotate</strong> for cinematic 360° tours
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400">▸</span>
              <span>
                Click <strong>Predict</strong> button for detailed disaster analysis
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
