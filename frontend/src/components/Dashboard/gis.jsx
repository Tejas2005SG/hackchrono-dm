import React, { useEffect, useState } from 'react'
import CesiumMap from './compo'
import * as turf from '@turf/turf'

function App() {
  const [center, setCenter] = useState(null)
  const [markers, setMarkers] = useState([])
  const [statusText, setStatusText] = useState('')
  const [alertsData, setAlertsData] = useState([])

  useEffect(() => {
    // Ask for geolocation permission before access
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        // default to New Delhi if permission denied
        setCenter({ lat: 28.6139, lng: 77.209 })
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  useEffect(() => {
    if (!center) return
    const controller = new AbortController()
    const fetchData = async () => {
      try {
        // Use backend proxy to bypass CORS for Ambee API
        const proxyUrl = `https://hackchrono-dm.onrender.com/api/disasters?lat=${center.lat}&lng=${center.lng}&limit=50`
        console.log('[DisastersAPI] Request URL:', proxyUrl, 'center:', center)
        const res = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Content-type': 'application/json'
          },
          signal: controller.signal
        })
        console.log('[DisastersAPI] Response status:', res.status, res.statusText)
        
        if (!res.ok) {
          throw new Error(`Backend proxy error: ${res.status} ${res.statusText}`)
        }
        
        const data = await res.json()
        console.log('[DisastersAPI] Parsed JSON:', data)
        
        // Store the complete API response for display
        setAlertsData(data)
        
        const newMarkers = []
        const alerts = []
        
        // Handle different response structures
        let events = []
        if (data.data && Array.isArray(data.data)) {
          events = data.data
        } else if (Array.isArray(data)) {
          events = data
        } else if (data.events && Array.isArray(data.events)) {
          events = data.events
        }
        
        console.log('[DisastersAPI] Events extracted:', events)
        
        events.forEach((event, index) => {
          // Extract coordinates from various possible fields
          const lat = event.latitude || event.lat || event.coordinates?.lat || event.location?.lat
          const lng = event.longitude || event.lng || event.coordinates?.lng || event.location?.lng
          
          if (lat && lng) {
            // Use exact colors from API response
            let color = '#6b7280' // default gray
            
            // Check for color in various possible fields
            if (event.color) {
              color = event.color
            } else if (event.alerts && event.alerts.length > 0) {
              const alertLevel = event.alerts[0].level || event.alerts[0].severity
              switch (alertLevel?.toLowerCase()) {
                case 'red':
                case 'high':
                case 'critical':
                  color = '#ef4444'
                  break
                case 'yellow':
                case 'orange':
                case 'moderate':
                case 'medium':
                  color = '#f59e0b'
                  break
                case 'green':
                case 'low':
                case 'safe':
                  color = '#10b981'
                  break
                default:
                  color = '#6b7280'
              }
            } else if (event.severity) {
              switch (event.severity?.toLowerCase()) {
                case 'high':
                case 'critical':
                  color = '#ef4444'
                  break
                case 'moderate':
                case 'medium':
                  color = '#f59e0b'
                  break
                case 'low':
                case 'minimal':
                  color = '#10b981'
                  break
                default:
                  color = '#6b7280'
              }
            }
            
            // Special handling for NASA wildfire data
            if (event.source === 'NASA FIRMS') {
              color = '#dc2626' // Bright red for wildfires
            }
            
            newMarkers.push({
              id: `${event.source === 'NASA FIRMS' ? 'nasa' : 'ambee'}-${event.id || event.event_id || index}`,
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              color,
              type: event.eventType || event.type || event.event_type || 'disaster',
              severity: event.severity || 'unknown',
              alerts: event.alerts || [],
              message: event.alerts?.[0]?.message || event.description || event.message || 'No details available',
              source: event.source || 'Unknown',
              // Store all original data for display
              originalData: event
            })
            
            // Collect alerts for status text
            if (event.alerts && event.alerts.length > 0) {
              alerts.push({
                level: event.alerts[0].level,
                message: event.alerts[0].message,
                type: event.eventType || event.type || event.event_type,
                source: event.source
              })
            }
          }
        })

        // Compute status within 5km radius
        const centerPoint = turf.point([center.lng, center.lat])
        const buffered = turf.buffer(centerPoint, 5, { units: 'kilometers' })
        const incidentsNearby = newMarkers.filter((m) => {
          const pt = turf.point([m.lng, m.lat])
          return turf.booleanPointInPolygon(pt, buffered)
        })
        
        const summary = incidentsNearby.length
          ? `🚨 ${incidentsNearby.length} active events nearby: ${incidentsNearby
              .map((m) => `${m.type} (${m.alerts[0]?.level || 'unknown'})`)
              .join(', ')}`
          : '✅ Area analysis: No active threats'
        setStatusText(summary)
        setMarkers(newMarkers)
      } catch (e) {
        console.error('[DisastersAPI] Error fetching disaster data:', e)
        setStatusText('Status unavailable')
        setAlertsData({
          error: 'Connection to backend failed',
          message: e?.message || 'Failed to fetch',
          attempted_endpoints: [
            `https://hackchrono-dm.onrender.com/api/disasters?lat=${center.lat}&lng=${center.lng}&limit=50`
          ]
        })
      }
    }
    fetchData()
    return () => controller.abort()
  }, [center])

  return (
    <div className="w-full h-screen">
      <CesiumMap 
        center={center} 
        radiusKm={5} 
        markers={markers}
        statusText={statusText}
        alertsData={alertsData}
        onCenterChange={setCenter}
      />
    </div>
  )
}

export default App
