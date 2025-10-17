import json
import re
import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import HTTPException

from src.schemas.prediction_schema import (
    DisasterPredictionRequest, 
    DisasterPredictionResponse,
    PredictionResult,
    CoordinateRequest
)

# Import your existing RAG functions
from src.services.disaster_prediction import predict_disaster, validate_prediction

class PredictionController:
    def __init__(self):
        self.results_cache = {}
    
    async def predictdisaster_controller(self, request: DisasterPredictionRequest) -> PredictionResult:
        """Controller for disaster prediction endpoint"""
        print("Predict Disaster Controller")
        
        try:
            predictions = []
            
            # Process each coordinate asynchronously
            tasks = []
            for coord in request.coordinates:
                task = asyncio.to_thread(
                    self._process_single_prediction, 
                    coord.latitude, 
                    coord.longitude
                )
                tasks.append(task)
            
            # Wait for all predictions to complete
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    # Create error response for failed predictions
                    error_prediction = DisasterPredictionResponse(
                        disaster_name="Prediction Failed",
                        severity="Unknown",
                        country="Unknown",
                        state="Unknown",
                        location=f"Coordinates: {request.coordinates[i].latitude}, {request.coordinates[i].longitude}",
                        latitude=request.coordinates[i].latitude,
                        longitude=request.coordinates[i].longitude,
                        start_day=None,
                        end_day=None,
                        evacuations=0,
                        affected_population=0,
                        disaster_details={
                            "description": "Failed to generate prediction",
                            "primary_risks": [],
                            "vulnerable_areas": [],
                            "expected_impact": "Unknown",
                            "historical_context": "Unknown",
                            "contributing_factors": []
                        },
                        evacuation_plan={
                            "preparation_phase": [],
                            "immediate_actions": [],
                            "during_disaster": [],
                            "evacuation_routes": [],
                            "post_disaster": [],
                            "emergency_contacts": [],
                            "essential_supplies": []
                        },
                        error=f"Prediction failed: {str(result)}"
                    )
                    predictions.append(error_prediction)
                else:
                    predictions.append(result)
            
            # Create final response
            result = PredictionResult(
                predictions=predictions,
                timestamp=datetime.now(timezone.utc).isoformat(),
                total_locations=len(request.coordinates)
            )
            
            # Cache the result (optional)
            result_id = str(hash(str(request.coordinates)))
            self.results_cache[result_id] = result
            
            return result
            
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Prediction processing failed: {str(e)}"
            )
    
    def _process_single_prediction(self, latitude: float, longitude: float) -> DisasterPredictionResponse:
        """Process prediction for a single coordinate (synchronous)"""
        try:
            # Use your existing RAG functions
            prediction = predict_disaster(latitude, longitude)
            validated_prediction = validate_prediction(prediction)
            
            # Convert to Pydantic model
            return DisasterPredictionResponse(**validated_prediction)
            
        except Exception as e:
            raise Exception(f"Failed to process coordinate ({latitude}, {longitude}): {str(e)}")
    
    async def getresult_controller(self, result_id: str) -> PredictionResult:
        """Controller for retrieving cached results"""
        print("Get Result Controller")
        
        if result_id not in self.results_cache:
            raise HTTPException(
                status_code=404,
                detail="Result not found. The prediction may have expired or never existed."
            )
        
        return self.results_cache[result_id]

# Create controller instance
prediction_controller = PredictionController()