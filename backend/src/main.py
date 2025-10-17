from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes import auth_routes
from src.routes import prediction_routes
from src.config.db import client

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_routes.router)
app.include_router(prediction_routes.router)

print(client)


