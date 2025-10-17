from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CoordinateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude between -90 and 90")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude between -180 and 180")

class DisasterPredictionRequest(BaseModel):
    coordinates: List[CoordinateRequest] = Field(..., min_items=1, description="List of coordinates")

class DisasterDetails(BaseModel):
    description: str
    primary_risks: List[str]
    vulnerable_areas: List[str]
    expected_impact: str
    historical_context: str
    contributing_factors: List[str]

class EvacuationPlan(BaseModel):
    preparation_phase: List[str]
    immediate_actions: List[str]
    during_disaster: List[str]
    evacuation_routes: List[str]
    post_disaster: List[str]
    emergency_contacts: List[str]
    essential_supplies: List[str]

class DisasterPredictionResponse(BaseModel):
    disaster_name: str
    severity: str
    country: str
    state: str
    location: str
    latitude: float
    longitude: float
    start_day: Optional[str]
    end_day: Optional[str]
    evacuations: int
    affected_population: int
    disaster_details: DisasterDetails
    evacuation_plan: EvacuationPlan
    warnings: Optional[List[str]] = None
    error: Optional[str] = None

class PredictionResult(BaseModel):
    predictions: List[DisasterPredictionResponse]
    timestamp: str
    total_locations: int

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None