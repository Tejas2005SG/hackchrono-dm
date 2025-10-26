import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { GoogleGenerativeAI } from '@google/generative-ai';
import DisasterDataProcessor from './csvprocessor.js';
const app = express()
const PORT = process.env.PORT || 3001
import dotenv from 'dotenv'

dotenv.config()
// Middleware
app.use(cors())
app.use(express.json())

// API configuration
const AMBEE_API_KEY = 'b0745e2f3c34cc775429a5f216334bc6f255282066e93cb9d24d184a182e222c'
const AMBEE_BASE_URL = 'https://api.ambeedata.com'
const NASA_API_KEY = 'hGhg5g6SHiFeYKGbcBL0vOVqD3sTlzHzSQfzKpnV'
const NASA_FIRMS_URL = 'https://firms.modaps.eosdis.nasa.gov/api'

// Helper function to determine disaster type from Ambee event_type codes
function getDisasterType(eventType, url) {
  // Ambee event type mapping
  const type = eventType?.toUpperCase()
  
  switch (type) {
    case 'EQ': return 'earthquake'
    case 'FL': return 'flood'
    case 'WF': return 'wildfire'
    case 'CY': return 'cyclone'
    case 'SW': return 'severe_storm'  // Severe Weather (rain, thunderstorm, etc.)
    case 'DH': return 'drought_heatwave'  // Drought / Heatwave
    case 'DG': return 'dengue_outbreak'  // Dengue outbreak
    case 'AQ': return 'air_quality_hazard'  // Air quality-related hazards
    case 'LS': return 'landslide'  // Additional type from your data
    default: return type?.toLowerCase() || 'disaster'
  }
}

// Helper function to map Ambee alert levels to our color system
function mapAlertLevel(alertLevel) {
  if (!alertLevel) return 'yellow'
  
  const level = alertLevel.toLowerCase()
  if (level.includes('red')) return 'red'
  if (level.includes('orange')) return 'yellow'  // Map orange to yellow
  if (level.includes('green')) return 'green'
  
  return 'yellow'  // Default fallback
}

// Combined disaster data endpoint (Ambee + NASA FIRMS)
app.get('/api/disasters', async (req, res) => {
  try {
    const { lat, lng, limit = 50 } = req.query
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' })
    }

    const allEvents = []
    let ambeeData = []
    let nasaData = []

    // Fetch Ambee disaster data for all types (latest by lat-lng)
    try {
      // Use the main disasters endpoint (other specific endpoints are not authorized)
      const disasterEndpoints = [
        `${AMBEE_BASE_URL}/disasters/latest/by-lat-lng?lat=${lat}&lng=${lng}`
      ]

      for (const ambeeUrl of disasterEndpoints) {
        try {
          console.log(`Trying Ambee endpoint: ${ambeeUrl}`)
          
          const response = await fetch(ambeeUrl, {
            method: 'GET',
            headers: {
              'x-api-key': AMBEE_API_KEY,
              'Content-type': 'application/json'
            }
          })

          console.log(`Ambee response status: ${response.status} ${response.statusText}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`Ambee data received for ${ambeeUrl}:`, JSON.stringify(data, null, 2))
            
            // Convert disaster data to our format
            if (data.result && data.result.length > 0) {
              const processedData = data.result.map((disaster, index) => ({
                id: `ambee-disaster-${disaster.event_id || index}`,
                eventType: getDisasterType(disaster.event_type, ambeeUrl),
                latitude: disaster.lat,
                longitude: disaster.lng,
                severity: disaster.proximity_severity_level?.toLowerCase() || 'unknown',
                alerts: [{
                  level: mapAlertLevel(disaster.default_alert_levels),
                  message: `${disaster.event_name || 'Disaster Event'} - ${disaster.proximity_severity_level || 'Risk Level Unknown'}`
                }],
                source: 'Ambee Disasters',
                eventName: disaster.event_name,
                date: disaster.date,
                continent: disaster.continent,
                createdTime: disaster.created_time,
                sourceEventId: disaster.source_event_id,
                eventId: disaster.event_id,
                proximitySeverityLevel: disaster.proximity_severity_level,
                defaultAlertLevels: disaster.default_alert_levels,
                estimatedEndDate: disaster.estimated_end_date
              }))
              
              ambeeData.push(...processedData)
              console.log(`Added ${processedData.length} disaster events`)
              
              // Log the event types found
              const eventTypes = [...new Set(processedData.map(d => `${d.eventType} (${d.sourceEventId?.split('-')[1] || 'unknown'})`))]
              console.log('Event types found:', eventTypes.join(', '))
            }
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.log(`Ambee endpoint ${ambeeUrl} failed: ${response.status} - ${JSON.stringify(errorData)}`)
          }
        } catch (endpointError) {
          console.log(`Ambee endpoint ${ambeeUrl} error: ${endpointError.message}`)
        }
      }
      
      console.log('Total Ambee data processed:', ambeeData.length, 'disaster events')
    } catch (error) {
      console.log('Ambee API failed:', error.message)
    }

    // Fetch NASA FIRMS wildfire data
    try {
      // Calculate bounding box around the point (roughly 100km radius)
      const radius = 0.9 // degrees (roughly 100km)
      const north = parseFloat(lat) + radius
      const south = parseFloat(lat) - radius
      const east = parseFloat(lng) + radius
      const west = parseFloat(lng) - radius

      // Try different NASA FIRMS endpoints
      const nasaEndpoints = [
        `${NASA_FIRMS_URL}/area/csv/${NASA_API_KEY}/MODIS_NRT/${south},${west},${north},${east}/1`,
        `${NASA_FIRMS_URL}/area/csv/${NASA_API_KEY}/VIIRS_NRT/${south},${west},${north},${east}/1`,
        `https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_Global_24h.csv`
      ]
      
      for (const nasaUrl of nasaEndpoints) {
        try {
          console.log(`Trying NASA FIRMS endpoint: ${nasaUrl}`)
          
          const nasaResponse = await fetch(nasaUrl, {
            headers: {
              'User-Agent': 'DisasterMapDemo/1.0'
            }
          })
          
          console.log(`NASA FIRMS response status: ${nasaResponse.status} ${nasaResponse.statusText}`)
          
          if (nasaResponse.ok) {
        const csvText = await nasaResponse.text()
        const lines = csvText.split('\n')
        const headers = lines[0].split(',')
        
        // Parse CSV data
        for (let i = 1; i < lines.length && i < 20; i++) { // Limit to 20 fire points
          const line = lines[i].trim()
          if (line) {
            const values = line.split(',')
            if (values.length >= headers.length) {
              const fireEvent = {
                id: `nasa-fire-${i}`,
                eventType: 'wildfire',
                latitude: parseFloat(values[0]),
                longitude: parseFloat(values[1]),
                severity: 'high',
                confidence: values[2],
                brightness: values[3],
                scan: values[4],
                track: values[5],
                acqDate: values[6],
                acqTime: values[7],
                satellite: values[8],
                country: values[9] || 'Unknown',
                alerts: [
                  {
                    level: 'red',
                    message: `Wildfire detected with confidence ${values[2]}%. Brightness: ${values[3]}K`
                  }
                ],
                source: 'NASA FIRMS'
              }
              nasaData.push(fireEvent)
            }
          }
        }
        
            console.log('NASA FIRMS data received:', nasaData.length, 'fire points')
            break
          } else {
            console.log(`NASA FIRMS endpoint failed: ${nasaResponse.status} ${nasaResponse.statusText}`)
          }
        } catch (endpointError) {
          console.log(`NASA FIRMS endpoint error: ${endpointError.message}`)
        }
      }
    } catch (error) {
      console.log('NASA FIRMS API failed:', error.message)
    }

    // Combine all data
    allEvents.push(...ambeeData, ...nasaData)

    // If no real data, return empty array with helpful message
    if (allEvents.length === 0) {
      // Add some demo data for testing when no real data is available
      const demoEvents = [
        {
          id: 'demo-flood-1',
          eventType: 'flood',
          latitude: parseFloat(lat) + 0.01,
          longitude: parseFloat(lng) + 0.01,
          severity: 'moderate',
          alerts: [{
            level: 'yellow',
            message: 'Demo: Flood risk detected in nearby area'
          }],
          source: 'Demo Data',
          country: 'India',
          state: 'Punjab',
          city: 'Chandigarh'
        }
      ]
      
      return res.json({ 
        data: demoEvents,
        message: 'Demo data shown - No real disaster events found',
        sources: ['NASA FIRMS', 'Demo Data'],
        note: 'Ambee API key is invalid. NASA FIRMS data is working. To get Ambee data, sign up at https://dashboard.ambeedata.com/ for a free API key.',
        api_status: {
          ambee: 'Invalid API key - 401 Unauthorized',
          nasa: 'Working - 200 OK'
        }
      })
    }

    res.json({ 
      data: allEvents,
      sources: ['Ambee API', 'NASA FIRMS'],
      summary: {
        total: allEvents.length,
        ambee: ambeeData.length,
        nasa: nasaData.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching disaster data:', error)
    res.status(500).json({ 
      error: 'Failed to fetch disaster data',
      message: error.message 
    })
  }
})

// Search proxy endpoint for Nominatim
app.get('/api/search', async (req, res) => {
  try {
    const { q, countrycodes = 'in', limit = 8 } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=${countrycodes}&format=json&addressdetails=1&limit=${limit}&accept-language=en`
    
    console.log(`Searching Nominatim: ${q}`)
    
    const response = await fetch(nominatimUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DisasterMapDemo/1.0 (contact@example.com)'
      }
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    res.json(data)
    
  } catch (error) {
    console.error('Error fetching search data:', error)
    res.status(500).json({ 
      error: 'Failed to fetch search data',
      message: error.message 
    })
  }
})



// Initialize services
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const dataProcessor = new DisasterDataProcessor();

// Load data on startup
(async () => {
  try {
    await dataProcessor.loadData('./disaster_data.csv');
    console.log('✓ Server ready with disaster data');
  } catch (error) {
    console.error('✗ Failed to load disaster data:', error.message);
    console.log('Server will continue without historical data');
  }
})();

// Helper: Get location coordinates
async function getLocationCoordinates(city, state, country = 'India') {
  try {
    const query = `${city}, ${state}, ${country}`;
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: query,
        key: process.env.OPENCAGE_API_KEY,
        limit: 1
      },
      timeout: 5000
    });

    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted,
        components: result.components
      };
    }
  } catch (error) {
    console.log('Geocoding unavailable:', error.message);
  }
  return null;
}

// Helper: Build comprehensive RAG context
function buildRAGContext(location, disasterType) {
  const riskAssessment = dataProcessor.getRiskAssessment(location, disasterType);
  const similarDisasters = dataProcessor.findSimilar(location, disasterType, { limit: 10 });
  const stats = riskAssessment.stats;

  let context = `DISASTER PREDICTION CONTEXT\n`;
  context += `=${'='.repeat(50)}\n\n`;
  
  context += `TARGET LOCATION:\n`;
  context += `  State: ${location.state}\n`;
  context += `  City: ${location.city}\n`;
  if (location.district) context += `  District: ${location.district}\n`;
  if (location.landmark) context += `  Landmark: ${location.landmark}\n`;
  context += `\nDISASTER TYPE: ${disasterType}\n\n`;
  
  context += `RISK ASSESSMENT:\n`;
  context += `  Risk Level: ${riskAssessment.riskLevel}\n`;
  context += `  Risk Score: ${riskAssessment.riskScore}/100\n`;
  context += `  Historical Data Available: ${riskAssessment.hasHistoricalData ? 'Yes' : 'No'}\n`;
  context += `  Recent Incidents (Last 10 years): ${riskAssessment.recentIncidents}\n\n`;

  if (riskAssessment.hasHistoricalData) {
    context += `HISTORICAL STATISTICS:\n`;
    context += `  Total Incidents Analyzed: ${stats.totalIncidents}\n`;
    context += `  Average Deaths per Incident: ${stats.avgDeaths}\n`;
    context += `  Average People Affected: ${stats.avgAffected.toLocaleString()}\n`;
    context += `  Average Economic Damage: $${stats.avgDamage.toLocaleString()}K USD\n`;
    context += `  Maximum Deaths (Single Event): ${stats.maxDeaths}\n`;
    context += `  Maximum Affected (Single Event): ${stats.maxAffected.toLocaleString()}\n`;
    context += `  Fatality Rate: ${stats.fatalityRate}%\n`;
    context += `  Economic Impact Rate: ${stats.economicImpactRate}%\n\n`;

    context += `TOP HISTORICAL INCIDENTS:\n`;
    similarDisasters.slice(0, 5).forEach((d, i) => {
      context += `  ${i + 1}. ${d.location || 'Unknown'} (${d.startYear || 'Unknown Year'})\n`;
      context += `     Deaths: ${d.totalDeaths || 0} | Affected: ${(d.affected || 0).toLocaleString()}\n`;
      if (d.totalDamage) context += `     Damage: $${d.totalDamage.toLocaleString()}K USD\n`;
      if (d.magnitude) context += `     Magnitude: ${d.magnitude} ${d.magnitudeScale || ''}\n`;
      context += `\n`;
    });
  } else {
    context += `NO HISTORICAL DATA FOUND:\n`;
    context += `This region has no recorded history of ${disasterType} events.\n`;
    context += `Analysis will be based on similar disasters in comparable regions\n`;
    context += `and general disaster management principles.\n\n`;
  }

  return {
    context,
    riskAssessment,
    similarDisasters: similarDisasters.slice(0, 3),
    stats
  };
}

// Main prediction endpoint
app.post('/api/predict-disaster', async (req, res) => {
  try {
    const { location, disasterType } = req.body;

    // Validation
    if (!location || !location.state || !location.city || !disasterType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['location.state', 'location.city', 'disasterType']
      });
    }

    if (!dataProcessor.loaded) {
      return res.status(503).json({ 
        error: 'Disaster data still loading. Please try again in a few seconds.'
      });
    }

    console.log(`\n🔍 Processing prediction: ${disasterType} in ${location.city}, ${location.state}`);

    // Get location coordinates (non-blocking)
    const coordinatesPromise = getLocationCoordinates(location.city, location.state);

    // Build RAG context
    const { context, riskAssessment, similarDisasters, stats } = buildRAGContext(location, disasterType);

    console.log(`📊 Risk Level: ${riskAssessment.riskLevel} | Historical Incidents: ${stats.totalIncidents}`);

    // Create Gemini prompt
    const prompt = `You are an expert disaster management analyst with access to comprehensive historical disaster data. Analyze the following scenario and provide detailed predictions.

${context}

TASK: Provide a detailed "What If" analysis for a potential ${disasterType} in ${location.city}, ${location.state}.

YOUR RESPONSE MUST:
1. Be based on the historical data provided above when available
2. Consider regional characteristics, climate, geography, and infrastructure
3. Provide realistic, actionable predictions and strategies
4. Use actual emergency contact numbers for India/the specific state
5. Include specific evacuation routes and shelter locations where possible

OUTPUT FORMAT (strict JSON):
{
  "riskLevel": "${riskAssessment.riskLevel}",
  "historicalContext": "2-3 paragraphs explaining the region's history with this disaster, referencing specific incidents from the data above. If no history exists, explain why this region might still be vulnerable.",
  "impactAssessment": {
    "casualties": "Specific estimate with range (e.g., '50-200 deaths expected based on historical averages')",
    "affectedPopulation": "Specific estimate with context (e.g., 'Approximately 100,000-500,000 people in low-lying areas')",
    "infrastructureDamage": "Detailed assessment of buildings, roads, utilities, hospitals, etc.",
    "economicImpact": "Monetary estimate with breakdown (e.g., '$50-100 million in immediate damages')"
  },
  "evacuationPlan": [
    "7-8 specific, actionable evacuation steps in chronological order",
    "Include timing, routes, shelter locations, and priority groups"
  ],
  "responseStrategies": [
    "7-8 detailed response strategies for authorities",
    "Include immediate actions, resource allocation, communication plans"
  ],
  "emergencyResources": [
    {"name": "National Disaster Response Force (NDRF)", "contact": "Actual phone number"},
    {"name": "State Emergency Operations Center", "contact": "Actual phone number"},
    {"name": "District Collector Office", "contact": "District-specific number"},
    {"name": "Fire Services", "contact": "101 or local number"},
    {"name": "Ambulance Services", "contact": "108"},
    {"name": "Police Emergency", "contact": "100"},
    {"name": "Local Hospital Emergency", "contact": "District-specific number"}
  ]
}

IMPORTANT: Return ONLY the JSON object, no additional text or formatting.`;

    // Call Gemini AI
    console.log('🤖 Calling Gemini AI...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let aiResponse = response.text();

    // Clean and parse JSON
    aiResponse = aiResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let predictionData;
    try {
      predictionData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('JSON parse error. Raw response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Get coordinates (await the promise)
    const coordinates = await coordinatesPromise;

    // Format similar incidents for response
    const similarIncidents = similarDisasters.map(d => ({
      location: d.location || 'Unknown Location',
      year: d.startYear || 'Unknown',
      deaths: d.totalDeaths || 0,
      affected: d.affected || 0,
      damage: d.totalDamage || 0,
      summary: `${d.disasterType || disasterType}: ${d.totalDeaths || 0} casualties, ${(d.affected || 0).toLocaleString()} affected` + 
               (d.totalDamage ? `, $${d.totalDamage.toLocaleString()}K damage` : '')
    }));

    // Complete response
    const finalResponse = {
      ...predictionData,
      location,
      disasterType,
      coordinates,
      riskScore: riskAssessment.riskScore,
      similarIncidents,
      dataSource: {
        historicalIncidents: stats.totalIncidents,
        hasHistoricalData: riskAssessment.hasHistoricalData,
        recentIncidents: riskAssessment.recentIncidents,
        dataQuality: stats.totalIncidents > 5 ? 'High' : stats.totalIncidents > 0 ? 'Medium' : 'Low'
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        model: 'gemini-pro',
        dataVersion: '1.0'
      }
    };

    console.log('✅ Prediction generated successfully\n');
    res.json(finalResponse);

  } catch (error) {
    console.error('❌ Prediction error:', error);
    res.status(500).json({ 
      error: 'Failed to generate prediction',
      details: error.message,
      type: error.name
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    dataLoaded: dataProcessor.loaded,
    recordCount: dataProcessor.data.length,
    serverTime: new Date().toISOString()
  });
});

// Get comprehensive statistics
app.get('/api/stats', (req, res) => {
  if (!dataProcessor.loaded) {
    return res.status(503).json({ error: 'Data not loaded yet' });
  }

  const summary = dataProcessor.getSummary();
  res.json(summary);
});

// Get disaster trends
app.get('/api/trends/:disasterType', (req, res) => {
  if (!dataProcessor.loaded) {
    return res.status(503).json({ error: 'Data not loaded yet' });
  }

  const { disasterType } = req.params;
  const yearRange = parseInt(req.query.years) || 20;
  
  const trends = dataProcessor.getTrends(disasterType, yearRange);
  res.json({
    disasterType,
    yearRange,
    trends
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Disaster Map API is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📡 Disaster API endpoint: http://localhost:${PORT}/api/disasters`)
})