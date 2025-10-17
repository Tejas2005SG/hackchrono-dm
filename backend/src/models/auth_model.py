from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from bson import ObjectId

class User(BaseModel):
    id: Optional[str] = Field(alias="_id")  # MongoDB _id field
    username: str
    email: EmailStr
    password: str
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str
        }
