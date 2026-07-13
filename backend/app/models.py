from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import json
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer") # admin, operator, viewer
    created_at = Column(DateTime, default=datetime.utcnow)

class SecurityPolicy(Base):
    __tablename__ = "security_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    reject_threshold = Column(Integer, default=70)
    rewrite_threshold = Column(Integer, default=40)
    # Store rules config: regexes, blocked keywords, RAG trust limits, etc.
    rules_json = Column(Text, default="{}")
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def get_rules(self):
        try:
            return json.loads(self.rules_json)
        except Exception:
            return {}

class ToolDefinition(Base):
    __tablename__ = "tools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    # JSON schema of parameters
    parameters_schema = Column(Text, default="{}")
    risk_level = Column(String, default="SAFE")  # SAFE, RESTRICTED, HIGH_RISK
    requires_approval = Column(Boolean, default=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    session_id = Column(String, index=True, nullable=False)
    username = Column(String, nullable=True)
    prompt_payload = Column(Text, nullable=False)
    sanitized_payload = Column(Text, nullable=True)
    risk_score = Column(Integer, default=0)
    firewall_action = Column(String, default="ALLOW")  # ALLOW, REWRITE, REJECT
    response_payload = Column(Text, nullable=True)
    tokens_used = Column(Integer, default=0)
    cost = Column(Float, default=0.0)
    
    threat_events = relationship("ThreatEvent", back_populates="audit_log")

class ThreatEvent(Base):
    __tablename__ = "threat_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    audit_log_id = Column(Integer, ForeignKey("audit_logs.id"), nullable=False)
    threat_type = Column(String, nullable=False)  # direct_injection, indirect_injection, leak_attempt, nested_instruction
    matched_pattern = Column(String, nullable=True)
    payload = Column(Text, nullable=False)
    risk_score = Column(Integer, default=0)
    
    audit_log = relationship("AuditLog", back_populates="threat_events")

class SavedMemory(Base):
    __tablename__ = "saved_memories"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    role = Column(String, nullable=False)  # system, user, assistant, tool
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
