import email_validator
email_validator.CHECK_DELIVERABILITY = False
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any

# Authentication Models
class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = "citizen"  # "citizen", "admin"
    phone: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Complaint Models
class ComplaintCreateRequest(BaseModel):
    title: Optional[str] = None
    description: str = Field(..., min_length=5, max_length=2000)
    category: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None
    locality: Optional[str] = None
    ward: Optional[str] = None

class ComplaintStatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None
    assigned_department: Optional[str] = None

class SeverityOverrideRequest(BaseModel):
    severity: str
    reason: str

class DuplicateMergeRequest(BaseModel):
    parent_complaint_id: str
    duplicate_complaint_ids: List[str]
    notes: Optional[str] = None

class SupportComplaintRequest(BaseModel):
    complaint_id: str

class DisputeResolutionRequest(BaseModel):
    confirmed: bool
    dispute_reason: Optional[str] = None

# AI Structured Output Schema (validated against AI response)
class AIClassificationSchema(BaseModel):
    primary_category: str
    secondary_category: Optional[str] = None
    problem_description: str
    extracted_entities: List[str] = []
    potential_safety_concerns: List[str] = []
    suggested_department: str
    suggested_severity: str = "Medium"
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    missing_information: List[str] = []
    suggested_next_action: str

class AIVerificationSchema(BaseModel):
    issue_resolved: bool
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0)
    change_summary: str
    visual_evidence_analysis: str
    needs_manual_review: bool

# Conversational AI Assistant Models
class AssistantChatRequest(BaseModel):
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locality: Optional[str] = None

# On-demand AI Complaint Analysis Models
class ComplaintAnalysisRequest(BaseModel):
    description: str = Field(..., min_length=3, max_length=3000)
    image_base64: Optional[str] = None

class ComplaintAnalysisResponse(BaseModel):
    category: str
    priority: str  # "Low", "Medium", "High"
    department: str
    summary: str
    suggested_next_action: str
    confidence_score: float = 0.88
    source: str = "lovable_ai_connector"
    disclaimer: str = "Preliminary AI triage suggestion. Does not represent confirmed municipal resolution."

