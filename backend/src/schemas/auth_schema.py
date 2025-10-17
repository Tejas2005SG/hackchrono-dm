from pydantic import BaseModel,EmailStr,Field
from typing import Optional
from datetime import datetime

class CreateUser(BaseModel):
    username: str
    email: EmailStr
    password: str = Field(..., min_length=1,max_length=50)
    confirm_password: str = Field(..., min_length=1,max_length=50)

class LoginUser(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: Optional[str]
    username: str
    email: EmailStr
    created_at: datetime    

    class Config:
        from_attributes = True