import json
import re
from datetime import datetime, timezone
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

# --- SYSTEM PROMPT ---

# --- SYSTEM PROMPT ---
SYSTEM_MSG = """
You are an expert disaster predictor with access to historical patterns, geological data, and climate trends.

Given location coordinates (latitude, longitude) and the current date, predict the NEXT LIKELY FUTURE disaster for that location.

Important rules:
1. The prediction MUST be for a FUTURE date (after the current date provided)
2. start_day and end_day must be in YYYY-MM-DD format and be realistic future dates
3. For start_day: predict when the disaster is likely to begin (within next 3-12 months)
4. For end_day: predict when the disaster is likely to end (consider typical duration)
5. For evacuations: provide a realistic SPECIFIC NUMBER estimate based on population density and disaster severity (e.g., 5000, 25000, 100000, 500000)
6. Consider the location's historical disaster patterns, geography, climate, and season
7. Provide detailed disaster information including severity, impact areas, and risk factors
8. Provide comprehensive evacuation steps specific to the predicted disaster type

Return the prediction strictly as a JSON object with the following fields:

{{
  "disaster_name": "Type of disaster (e.g., Earthquake, Flood, Cyclone, Heat Wave, Wildfire, Tsunami, etc.)",
  "severity": "Low/Moderate/High/Severe/Catastrophic",
  "country": "Country name",
  "state": "State or region name",
  "location": "Specific location name",
  "latitude": 0.0,
  "longitude": 0.0,
  "start_day": "YYYY-MM-DD (future date)",
  "end_day": "YYYY-MM-DD (future date)",
  "evacuations": 0,
  "affected_population": 0,
  "disaster_details": {{
    "description": "Detailed description of the predicted disaster",
    "primary_risks": ["risk1", "risk2", "risk3"],
    "vulnerable_areas": ["area1", "area2"],
    "expected_impact": "Description of expected impact on infrastructure, lives, economy",
    "historical_context": "Brief history of similar disasters in this region",
    "contributing_factors": ["factor1", "factor2"]
  }},
  "evacuation_plan": {{
    "preparation_phase": [
      "Step 1: Specific preparation action",
      "Step 2: Another preparation action",
      "Step 3: More preparation steps"
    ],
    "immediate_actions": [
      "Action 1: What to do when disaster is imminent",
      "Action 2: Emergency contacts and alerts",
      "Action 3: Safety measures"
    ],
    "during_disaster": [
      "Step 1: Actions during the disaster",
      "Step 2: Safety protocols",
      "Step 3: Communication methods"
    ],
    "evacuation_routes": [
      "Primary route: Description",
      "Secondary route: Description",
      "Assembly points: Locations"
    ],
    "post_disaster": [
      "Step 1: What to do after disaster",
      "Step 2: Recovery actions",
      "Step 3: Support resources"
    ],
    "emergency_contacts": [
      "Local emergency: Contact info",
      "Disaster management: Contact info",
      "Medical services: Contact info"
    ],
    "essential_supplies": [
      "Item 1: Water (minimum 3 days supply)",
      "Item 2: Non-perishable food",
      "Item 3: First aid kit",
      "Item 4: Other essentials"
    ]
  }}
}}

Do not include any text outside the JSON. Be specific and realistic with all predictions.
"""

# --- REVERSE GEOCODING ---
def get_location_from_coordinates(latitude: float, longitude: float) -> dict:
    """Get location details from latitude and longitude"""
    try:
        geolocator = Nominatim(user_agent="disaster_predictor_v2")
        location = geolocator.reverse(f"{latitude}, {longitude}", language='en', timeout=10)
        
        if location:
            address = location.raw.get('address', {})
            return {
                "location": address.get('city') or address.get('town') or address.get('village') or address.get('suburb', 'Unknown'),
                "state": address.get('state', 'Unknown'),
                "country": address.get('country', 'Unknown'),
                "display_name": location.address
            }
    except GeocoderTimedOut:
        print("⚠️ Geocoding service timed out. Using coordinates only.")
    except Exception as e:
        print(f"⚠️ Geocoding error: {e}")
    
    return {
        "location": f"Coordinates: {latitude}, {longitude}",
        "state": "Unknown",
        "country": "Unknown",
        "display_name": f"Location at {latitude}, {longitude}"
    }

# --- BUILD LLM CHAIN ---
def build_chain():
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_MSG.strip()),
        ("user", """Current Date and Time: {current_datetime}

Location Details:
- Coordinates: {latitude}, {longitude}
- Location: {location_name}
- State: {state}
- Country: {country}
- Full Address: {display_name}

[Rest of your exact same user prompt here]""")
    ])

    llm = ChatOpenAI(
        model="z-ai/glm-4.5-air:free",
        base_url="https://openrouter.ai/api/v1",
        api_key="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",
        temperature=0.4,
        top_p=0.3
    )

    return prompt | llm | StrOutputParser()

# --- GET CURRENT DATETIME ---
def get_current_datetime():
    """Get current date and time in a readable format"""
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%d %H:%M:%S UTC")

# --- GET PREDICTION ---
def predict_disaster(latitude: float, longitude: float):
    # Get location details from coordinates
    print(f"🔍 Identifying location for coordinates: {latitude}, {longitude}")
    location_info = get_location_from_coordinates(latitude, longitude)
    print(f"📍 Location identified: {location_info['display_name']}\n")
    
    chain = build_chain()
    current_dt = get_current_datetime()

    raw_output = chain.invoke({
        "latitude": latitude,
        "longitude": longitude,
        "location_name": location_info['location'],
        "state": location_info['state'],
        "country": location_info['country'],
        "display_name": location_info['display_name'],
        "current_datetime": current_dt
    })

    print(f"\n🔍 Raw LLM Output:\n{raw_output}\n")
    print("-" * 80)

    # Parse JSON safely
    try:
        prediction = json.loads(raw_output)
        # Ensure coordinates are included
        prediction['latitude'] = latitude
        prediction['longitude'] = longitude
        return prediction
    except json.JSONDecodeError:
        # fallback: extract JSON block
        m = re.search(r"\{[\s\S]*\}", raw_output)
        if m:
            try:
                prediction = json.loads(m.group(0))
                prediction['latitude'] = latitude
                prediction['longitude'] = longitude
                return prediction
            except:
                pass

        # Return template with location info
        return {
            "disaster_name": "Unable to predict",
            "severity": "Unknown",
            "country": location_info['country'],
            "state": location_info['state'],
            "location": location_info['location'],
            "latitude": latitude,
            "longitude": longitude,
            "start_day": None,
            "end_day": None,
            "evacuations": 0,
            "affected_population": 0,
            "error": "Failed to parse LLM response",
            "disaster_details": {},
            "evacuation_plan": {}
        }

# --- VALIDATE PREDICTION ---
def validate_prediction(prediction: dict) -> dict:
    """Validate that predicted dates are in the future and data is complete"""
    current_date = datetime.now(timezone.utc).date()
    warnings = []

    if prediction.get("start_day"):
        try:
            start_date = datetime.strptime(prediction["start_day"], "%Y-%m-%d").date()
            if start_date <= current_date:
                warnings.append("⚠️ Start date is not in the future!")
        except:
            warnings.append("⚠️ Invalid start date format!")

    if prediction.get("end_day"):
        try:
            end_date = datetime.strptime(prediction["end_day"], "%Y-%m-%d").date()
            start_date = datetime.strptime(prediction["start_day"], "%Y-%m-%d").date()
            if end_date < start_date:
                warnings.append("⚠️ End date is before start date!")
        except:
            warnings.append("⚠️ Invalid end date format!")

    if not isinstance(prediction.get("evacuations"), int) or prediction.get("evacuations", 0) <= 0:
        warnings.append("⚠️ Evacuation number should be a positive integer!")

    if warnings:
        prediction["warnings"] = warnings

    return prediction