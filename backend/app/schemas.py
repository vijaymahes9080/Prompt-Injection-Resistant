from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "viewer"

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class SecurityPolicyCreate(BaseModel):
    name: str
    reject_threshold: int = 70
    rewrite_threshold: int = 40
    rules_json: str = "{}"
    is_active: bool = False

class SecurityPolicyOut(BaseModel):
    id: int
    name: str
    reject_threshold: int
    rewrite_threshold: int
    rules_json: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ToolDefinitionCreate(BaseModel):
    name: str
    description: str
    parameters_schema: str = "{}"
    risk_level: str = "SAFE"
    requires_approval: bool = False
    is_enabled: bool = True

class ToolDefinitionOut(BaseModel):
    id: int
    name: str
    description: str
    parameters_schema: str
    risk_level: str
    requires_approval: bool
    is_enabled: bool

    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    session_id: str
    prompt: str
    model: str = "mock"  # mock, gpt-4o, claude-3-opus, ollama
    system_prompt: Optional[str] = None
    policy_id: Optional[int] = None

class ChatResponse(BaseModel):
    session_id: str
    original_prompt: str
    sanitized_prompt: str
    response: str
    risk_score: int
    action: str
    threat_detected: bool
    threats: List[Dict[str, Any]]
    tokens_used: int

class ScanRequest(BaseModel):
    text: str

class ScanResponse(BaseModel):
    text: str
    normalized_text: str
    risk_score: int
    action: str
    threat_type: str
    matched_pattern: Optional[str] = None

class ThreatEventOut(BaseModel):
    id: int
    timestamp: datetime
    threat_type: str
    matched_pattern: Optional[str] = None
    payload: str
    risk_score: int

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    session_id: str
    prompt_payload: str
    sanitized_payload: Optional[str]
    risk_score: int
    firewall_action: str
    response_payload: Optional[str]
    tokens_used: int
    cost: float
    threat_events: List[ThreatEventOut] = []

    class Config:
        from_attributes = True
