from fastapi import APIRouter, Request, Response, HTTPException
from src.schemas.prediction_schema import DisasterPredictionRequest, PredictionResult
from src.controllers.prediction_controller import prediction_controller

router = APIRouter(prefix="/disaster", tags=["Disaster Prediction"])

@router.post("/predictdisaster", response_model=PredictionResult)
async def call_predictdisaster(request: DisasterPredictionRequest):
    """Endpoint for disaster prediction"""
    return await prediction_controller.predictdisaster_controller(request)

@router.get("/result/{result_id}", response_model=PredictionResult)
async def call_getresult(result_id: str):
    """Endpoint for retrieving cached results"""
    return await prediction_controller.getresult_controller(result_id)